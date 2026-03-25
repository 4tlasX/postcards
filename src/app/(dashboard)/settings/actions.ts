'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { upsertSetting, deleteSetting, createTaxonomy, getAllTaxonomies } from '@/lib/db';
import { getServerSession, logoutAction } from '@/app/auth/actions';
import { FeatureKey, FEATURES } from '@/lib/settings';
import { seedDefaultTaxonomies } from '@/lib/taxonomies';

// =============================================================================
// Legacy generic setting actions
// =============================================================================

export async function upsertSettingAction(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  const key = formData.get('key') as string;
  const valueStr = formData.get('value') as string;

  if (!key?.trim()) {
    return { error: 'Key is required' };
  }

  let value: unknown = valueStr;

  // Try to parse as JSON, otherwise keep as string
  if (valueStr?.trim()) {
    try {
      value = JSON.parse(valueStr);
    } catch {
      value = valueStr;
    }
  }

  await upsertSetting(session.schemaName, key, value);
  revalidatePath('/settings');
  return { success: true };
}

export async function deleteSettingAction(formData: FormData) {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  const key = formData.get('key') as string;

  if (!key) {
    return { error: 'Key is required' };
  }

  await deleteSetting(session.schemaName, key);
  revalidatePath('/settings');
  return { success: true };
}

// =============================================================================
// Typed settings actions
// =============================================================================

/**
 * Update timezone setting
 */
export async function updateTimezoneAction(
  timezone: string
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  if (!timezone?.trim()) {
    return { error: 'Timezone is required' };
  }

  try {
    await upsertSetting(session.schemaName, 'timezone', timezone);
    revalidatePath('/settings');
    return {};
  } catch (error) {
    console.error('Failed to update timezone:', error);
    return { error: 'Failed to update timezone' };
  }
}

/**
 * Update accent color setting
 */
export async function updateAccentColorAction(
  color: string
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  try {
    await upsertSetting(session.schemaName, 'accentColor', color);
    // No revalidatePath - we use optimistic updates for instant feedback
    return {};
  } catch (error) {
    console.error('Failed to update accent color:', error);
    return { error: 'Failed to update accent color' };
  }
}

/**
 * Update background image setting
 */
export async function updateBackgroundImageAction(
  image: string
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  try {
    await upsertSetting(session.schemaName, 'backgroundImage', image);
    // No revalidatePath - we use optimistic updates for instant feedback
    return {};
  } catch (error) {
    console.error('Failed to update background image:', error);
    return { error: 'Failed to update background image' };
  }
}

/**
 * Update theme mode setting (dark/light)
 */
export async function updateThemeModeAction(
  mode: 'dark' | 'light'
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  try {
    await upsertSetting(session.schemaName, 'themeMode', mode);
    // No revalidatePath - we use optimistic updates for instant feedback
    return {};
  } catch (error) {
    console.error('Failed to update theme mode:', error);
    return { error: 'Failed to update theme mode' };
  }
}

/**
 * Toggle a feature flag and create associated taxonomy if enabling
 */
export async function toggleFeatureAction(
  feature: FeatureKey,
  enabled: boolean
): Promise<{ error?: string }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  const featureConfig = FEATURES.find((f) => f.key === feature);
  if (!featureConfig) {
    return { error: 'Invalid feature' };
  }

  try {
    // If enabling, check if taxonomy exists and create if not
    if (enabled) {
      const taxonomies = await getAllTaxonomies(session.schemaName);
      const exists = taxonomies.some(
        (t) => t.name.toLowerCase() === featureConfig.taxonomyName.toLowerCase()
      );

      if (!exists) {
        await createTaxonomy(session.schemaName, featureConfig.taxonomyName, {
          icon: featureConfig.taxonomyIcon,
        });
      }
    }

    // Update the setting
    await upsertSetting(session.schemaName, featureConfig.settingKey, enabled);
    revalidatePath('/settings');
    return {};
  } catch (error) {
    console.error(`Failed to toggle feature ${feature}:`, error);
    return { error: `Failed to ${enabled ? 'enable' : 'disable'} ${featureConfig.name}` };
  }
}

/**
 * Seed default topics (taxonomies) for the user
 */
export async function seedDefaultTopicsAction(): Promise<{ error?: string; count?: number }> {
  const session = await getServerSession();
  if (!session) {
    return { error: 'Not authenticated' };
  }

  try {
    // Get existing taxonomies to count how many we have before
    const existingBefore = await getAllTaxonomies(session.schemaName);
    const countBefore = existingBefore.length;

    // Seed default taxonomies (uses ON CONFLICT DO NOTHING)
    await seedDefaultTaxonomies(session.schemaName);

    // Get count after to see how many were added
    const existingAfter = await getAllTaxonomies(session.schemaName);
    const countAfter = existingAfter.length;
    const added = countAfter - countBefore;

    revalidatePath('/');
    revalidatePath('/settings');
    return { count: added };
  } catch (error) {
    console.error('Failed to seed default topics:', error);
    return { error: 'Failed to seed default topics' };
  }
}

/**
 * Sign out action
 */
export async function signOutAction(): Promise<void> {
  await logoutAction();
  redirect('/auth/login');
}
