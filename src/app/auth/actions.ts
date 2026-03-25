'use server';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, validatePassword, validateUsername, validateEmail } from '@/lib/auth';
import { generateSchemaName, createTenantSchema } from '@/lib/db';
import { getTypedSetting } from '@/lib/settings';

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour
const SESSION_COOKIE_NAME = 'chronicles_session';

// Encryption params returned to client on login
export interface EncryptionParamsResult {
  encryptionEnabled: boolean;
  kekSalt?: string;
  encryptedMasterKey?: string;
  kekWrapIv?: string;
  kekIterations?: number;
  recoveryWrappedMK?: string;
  recoveryWrapIv?: string;
}

// Result returned to client (no schema info)
export interface AuthResult {
  success?: boolean;
  error?: string;
  data?: {
    userName: string;
    userEmail: string;
  };
  encryption?: EncryptionParamsResult;
}

/**
 * Sets the session cookie (HTTP-only)
 */
async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

/**
 * Clears the session cookie
 */
async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Gets the session token from cookies
 */
async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}

/**
 * Creates a new session for an account
 */
async function createSession(accountId: number): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: {
      accountId,
      expiresAt,
    },
  });

  return { token: session.token, expiresAt };
}

/**
 * Extends session expiration (sliding window)
 * Called on each successful session validation to keep active users logged in
 */
async function extendSession(token: string): Promise<Date> {
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.update({
    where: { token },
    data: { expiresAt: newExpiresAt },
  });

  return newExpiresAt;
}

/**
 * Deletes all sessions for an account
 */
async function deleteAllSessions(accountId: number): Promise<void> {
  await prisma.session.deleteMany({
    where: { accountId },
  });
}

/**
 * Deletes a specific session by token
 */
async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  });
}

/**
 * Cleans up expired sessions from the database.
 * Should be called periodically (e.g., via cron job or on certain actions).
 * Returns the number of deleted sessions.
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}

/**
 * Helper to convert base64 to Buffer for database storage
 */
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

/**
 * Helper to convert Buffer to base64 for client
 */
function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

/**
 * Register a new user account
 */
export async function registerUserAction(formData: FormData): Promise<AuthResult> {
  const username = (formData.get('username') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  // Encryption params (optional - sent from client after setupEncryption)
  const kekSalt = formData.get('kekSalt') as string | null;
  const wrappedMK = formData.get('wrappedMK') as string | null;
  const wrapIv = formData.get('wrapIv') as string | null;
  const recoveryWrappedMK = formData.get('recoveryWrappedMK') as string | null;
  const recoveryWrapIv = formData.get('recoveryWrapIv') as string | null;

  // Validate inputs
  const usernameValidation = validateUsername(username || '');
  if (!usernameValidation.valid) {
    return { error: usernameValidation.errors[0] };
  }

  const emailValidation = validateEmail(email || '');
  if (!emailValidation.valid) {
    return { error: emailValidation.errors[0] };
  }

  const passwordValidation = validatePassword(password || '');
  if (!passwordValidation.valid) {
    return { error: passwordValidation.errors[0] };
  }

  // Check for existing user
  const existingUser = await prisma.account.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      return { error: 'An account with this email already exists' };
    }
    return { error: 'This username is already taken' };
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate tenant schema
  const schemaName = await generateSchemaName();

  // Determine if encryption is being set up
  const hasEncryption = kekSalt && wrappedMK && wrapIv && recoveryWrappedMK && recoveryWrapIv;

  // Create account with optional encryption fields
  const account = await prisma.account.create({
    data: {
      username,
      email,
      passwordHash,
      tenantSchemaName: schemaName,
      ...(hasEncryption && {
        kekSalt: base64ToBuffer(kekSalt),
        encryptedMasterKey: base64ToBuffer(wrappedMK),
        kekWrapIv: base64ToBuffer(wrapIv),
        recoveryWrappedMK: base64ToBuffer(recoveryWrappedMK),
        recoveryWrapIv: base64ToBuffer(recoveryWrapIv),
        encryptionEnabled: true,
      }),
    },
  });

  // Create tenant schema
  await createTenantSchema(schemaName);

  // Create session and set cookie
  const { token, expiresAt } = await createSession(account.id);
  await setSessionCookie(token, expiresAt);

  // Return only display info to client (no schema)
  return {
    success: true,
    data: {
      userName: account.username,
      userEmail: account.email,
    },
    encryption: {
      encryptionEnabled: account.encryptionEnabled,
    },
  };
}

/**
 * Login an existing user
 */
export async function loginUserAction(formData: FormData): Promise<AuthResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  // Find user by email (include encryption fields)
  const account = await prisma.account.findUnique({
    where: { email },
  });

  if (!account) {
    // Generic message to prevent email enumeration
    return { error: 'Invalid email or password' };
  }

  // Verify password
  const isValid = await verifyPassword(password, account.passwordHash);

  if (!isValid) {
    // Delete all existing sessions on failed login attempt
    await deleteAllSessions(account.id);
    await clearSessionCookie();
    return { error: 'Invalid email or password' };
  }

  // Delete any existing sessions (single session policy)
  await deleteAllSessions(account.id);

  // Create new session and set cookie
  const { token, expiresAt } = await createSession(account.id);
  await setSessionCookie(token, expiresAt);

  // Build encryption params if enabled
  let encryption: EncryptionParamsResult = {
    encryptionEnabled: account.encryptionEnabled,
  };

  if (account.encryptionEnabled && account.kekSalt && account.encryptedMasterKey && account.kekWrapIv) {
    encryption = {
      encryptionEnabled: true,
      kekSalt: bufferToBase64(account.kekSalt),
      encryptedMasterKey: bufferToBase64(account.encryptedMasterKey),
      kekWrapIv: bufferToBase64(account.kekWrapIv),
      kekIterations: account.kekIterations,
      recoveryWrappedMK: account.recoveryWrappedMK ? bufferToBase64(account.recoveryWrappedMK) : undefined,
      recoveryWrapIv: account.recoveryWrapIv ? bufferToBase64(account.recoveryWrapIv) : undefined,
    };
  }

  // Return display info + encryption params
  return {
    success: true,
    data: {
      userName: account.username,
      userEmail: account.email,
    },
    encryption,
  };
}

/**
 * Logout a user - deletes session and clears cookie
 */
export async function logoutAction(): Promise<AuthResult> {
  const token = await getSessionToken();

  if (token) {
    await deleteSession(token);
  }

  await clearSessionCookie();
  return { success: true };
}

/**
 * Validate the current session from cookie (for client use).
 * Returns only display info - no schema.
 */
export async function validateSessionAction(): Promise<{
  valid: boolean;
  data?: {
    userName: string;
    userEmail: string;
    themeMode?: 'dark' | 'light';
  };
}> {
  const token = await getSessionToken();

  if (!token) {
    return { valid: false };
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          username: true,
          email: true,
          tenantSchemaName: true,
        },
      },
    },
  });

  if (!session) {
    await clearSessionCookie();
    return { valid: false };
  }

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await deleteSession(token);
    await clearSessionCookie();
    return { valid: false };
  }

  // Sliding window: extend session expiration on each successful validation
  const newExpiresAt = await extendSession(token);
  await setSessionCookie(token, newExpiresAt);

  // Get theme mode setting
  const themeMode = await getTypedSetting(session.account.tenantSchemaName, 'themeMode');

  return {
    valid: true,
    data: {
      userName: session.account.username,
      userEmail: session.account.email,
      themeMode,
    },
  };
}

/**
 * Get tenant schema for server-side use only.
 * Validates session and returns the user's schema name.
 * This should NEVER be exposed to the client.
 */
export async function getServerSession(): Promise<{
  schemaName: string;
  userName: string;
  userEmail: string;
} | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          tenantSchemaName: true,
          username: true,
          email: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    schemaName: session.account.tenantSchemaName,
    userName: session.account.username,
    userEmail: session.account.email,
  };
}

/**
 * Get encryption params for the current session.
 * Used by EncryptionProvider to initialize.
 */
export async function getEncryptionParams(): Promise<EncryptionParamsResult | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      account: {
        select: {
          encryptionEnabled: true,
          kekSalt: true,
          encryptedMasterKey: true,
          kekWrapIv: true,
          kekIterations: true,
          recoveryWrappedMK: true,
          recoveryWrapIv: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  const account = session.account;

  if (!account.encryptionEnabled) {
    return { encryptionEnabled: false };
  }

  return {
    encryptionEnabled: true,
    kekSalt: account.kekSalt ? bufferToBase64(account.kekSalt) : undefined,
    encryptedMasterKey: account.encryptedMasterKey ? bufferToBase64(account.encryptedMasterKey) : undefined,
    kekWrapIv: account.kekWrapIv ? bufferToBase64(account.kekWrapIv) : undefined,
    kekIterations: account.kekIterations,
    recoveryWrappedMK: account.recoveryWrappedMK ? bufferToBase64(account.recoveryWrappedMK) : undefined,
    recoveryWrapIv: account.recoveryWrapIv ? bufferToBase64(account.recoveryWrapIv) : undefined,
  };
}

/**
 * Update password and re-wrap master key (after recovery)
 */
export async function updatePasswordAction(formData: FormData): Promise<AuthResult> {
  const token = await getSessionToken();
  if (!token) {
    return { error: 'Not authenticated' };
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { account: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return { error: 'Session expired' };
  }

  const newPassword = formData.get('newPassword') as string;
  const kekSalt = formData.get('kekSalt') as string;
  const wrappedMK = formData.get('wrappedMK') as string;
  const wrapIv = formData.get('wrapIv') as string;

  if (!newPassword || !kekSalt || !wrappedMK || !wrapIv) {
    return { error: 'Missing required fields' };
  }

  // Validate new password
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return { error: passwordValidation.errors[0] };
  }

  // Hash new password and update encryption params
  const passwordHash = await hashPassword(newPassword);

  await prisma.account.update({
    where: { id: session.account.id },
    data: {
      passwordHash,
      kekSalt: base64ToBuffer(kekSalt),
      encryptedMasterKey: base64ToBuffer(wrappedMK),
      kekWrapIv: base64ToBuffer(wrapIv),
    },
  });

  return { success: true };
}
