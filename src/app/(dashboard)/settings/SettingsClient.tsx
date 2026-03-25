'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardTitle } from '@/components/card';
import { FormGroup, Select, Toggle, ColorGrid, ImageGrid, Button } from '@/components/form';
import {
  AllSettings,
  FeatureKey,
  FEATURES,
  ACCENT_COLORS,
  BACKGROUND_IMAGES,
  TIMEZONES,
} from '@/lib/settings';
import {
  updateTimezoneAction,
  updateAccentColorAction,
  updateBackgroundImageAction,
  updateThemeModeAction,
  toggleFeatureAction,
  seedDefaultTopicsAction,
  signOutAction,
} from './actions';

interface SettingsClientProps {
  initialSettings: AllSettings;
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const setSettings = useAuthStore((state) => state.setSettings);
  const setSetting = useAuthStore((state) => state.setSetting);
  const userName = useAuthStore((state) => state.userName);
  const userEmail = useAuthStore((state) => state.userEmail);

  // Select individual settings to avoid re-renders when other settings change
  const timezone = useAuthStore((state) => state.userSettings.timezone);
  const foodEnabled = useAuthStore((state) => state.userSettings.foodEnabled);
  const medicationEnabled = useAuthStore((state) => state.userSettings.medicationEnabled);
  const goalsEnabled = useAuthStore((state) => state.userSettings.goalsEnabled);
  const milestonesEnabled = useAuthStore((state) => state.userSettings.milestonesEnabled);
  const exerciseEnabled = useAuthStore((state) => state.userSettings.exerciseEnabled);
  const allergiesEnabled = useAuthStore((state) => state.userSettings.allergiesEnabled);

  // Use local state for visual settings (CSS handles the actual display)
  const [accentColor, setAccentColor] = useState(initialSettings.accentColor);
  const [backgroundImage, setBackgroundImage] = useState(initialSettings.backgroundImage);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(initialSettings.themeMode);

  // Combine into object for easy access
  const userSettings = {
    timezone,
    accentColor,
    backgroundImage,
    themeMode,
    foodEnabled,
    medicationEnabled,
    goalsEnabled,
    milestonesEnabled,
    exerciseEnabled,
    allergiesEnabled,
  };

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Refs for debouncing server actions
  const accentColorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundImageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const themeModeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAccentColorRef = useRef<string | null>(null);
  const pendingBackgroundImageRef = useRef<string | null>(null);
  const pendingThemeModeRef = useRef<'dark' | 'light' | null>(null);

  // Initialize store with server-fetched settings and apply CSS variables
  useEffect(() => {
    setSettings(initialSettings);

    // Apply initial CSS variables
    if (initialSettings.accentColor) {
      // Set base color for light theme to reference
      document.documentElement.style.setProperty('--accent-color-base', initialSettings.accentColor);
      document.documentElement.style.setProperty('--accent-color', initialSettings.accentColor);
      document.documentElement.style.setProperty('--accent-color-hover', adjustBrightness(initialSettings.accentColor, 20));
    }
    if (initialSettings.backgroundImage) {
      document.documentElement.style.setProperty('--background-image', `url(${initialSettings.backgroundImage})`);
    }
    // Apply initial theme mode
    if (initialSettings.themeMode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    // Cleanup timeouts on unmount
    return () => {
      if (accentColorTimeoutRef.current) clearTimeout(accentColorTimeoutRef.current);
      if (backgroundImageTimeoutRef.current) clearTimeout(backgroundImageTimeoutRef.current);
      if (themeModeTimeoutRef.current) clearTimeout(themeModeTimeoutRef.current);
    };
  }, [initialSettings, setSettings]);

  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    const prevTimezone = userSettings.timezone;

    setSetting('timezone', newTimezone);
    setError(null);

    startTransition(async () => {
      const result = await updateTimezoneAction(newTimezone);
      if (result.error) {
        setSetting('timezone', prevTimezone);
        setError(result.error);
      }
    });
  };

  const handleAccentColorChange = (color: string) => {
    // Update CSS variables immediately
    // Set base color for light theme to reference
    document.documentElement.style.setProperty('--accent-color-base', color);
    document.documentElement.style.setProperty('--accent-color', color);
    document.documentElement.style.setProperty('--accent-color-hover', adjustBrightness(color, 20));

    // Update local state for grid selection
    setAccentColor(color);

    // Store the pending value for debounced save
    pendingAccentColorRef.current = color;

    // Clear any existing timeout
    if (accentColorTimeoutRef.current) {
      clearTimeout(accentColorTimeoutRef.current);
    }

    // Debounce server action - wait 500ms before saving
    accentColorTimeoutRef.current = setTimeout(async () => {
      const colorToSave = pendingAccentColorRef.current;
      if (colorToSave) {
        await updateAccentColorAction(colorToSave);
      }
    }, 500);
  };

  // Helper to adjust color brightness for hover states
  function adjustBrightness(hex: string, percent: number): string {
    if (!hex.startsWith('#')) return hex;
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + Math.round(2.55 * percent)));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + Math.round(2.55 * percent)));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + Math.round(2.55 * percent)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  const handleBackgroundChange = (image: string) => {
    // Update CSS variable immediately
    if (image) {
      document.documentElement.style.setProperty('--background-image', `url(${image})`);
    } else {
      document.documentElement.style.setProperty('--background-image', 'none');
    }

    // Update local state for grid selection
    setBackgroundImage(image);

    // Store the pending value for debounced save
    pendingBackgroundImageRef.current = image;

    // Clear any existing timeout
    if (backgroundImageTimeoutRef.current) {
      clearTimeout(backgroundImageTimeoutRef.current);
    }

    // Debounce server action - wait 500ms before saving
    backgroundImageTimeoutRef.current = setTimeout(async () => {
      const imageToSave = pendingBackgroundImageRef.current;
      if (imageToSave !== null) {
        await updateBackgroundImageAction(imageToSave);
      }
    }, 500);
  };

  const handleThemeModeChange = (mode: 'dark' | 'light') => {
    // Update body class immediately
    if (mode === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    // Update local state
    setThemeMode(mode);

    // Store the pending value for debounced save
    pendingThemeModeRef.current = mode;

    // Clear any existing timeout
    if (themeModeTimeoutRef.current) {
      clearTimeout(themeModeTimeoutRef.current);
    }

    // Debounce server action - wait 500ms before saving
    themeModeTimeoutRef.current = setTimeout(async () => {
      const modeToSave = pendingThemeModeRef.current;
      if (modeToSave !== null) {
        await updateThemeModeAction(modeToSave);
      }
    }, 500);
  };

  const handleFeatureToggle = (feature: FeatureKey, enabled: boolean) => {
    const featureConfig = FEATURES.find((f) => f.key === feature);
    if (!featureConfig) return;

    const settingKey = featureConfig.settingKey;
    const prevValue = userSettings[settingKey];

    setSetting(settingKey, enabled);
    setError(null);

    startTransition(async () => {
      const result = await toggleFeatureAction(feature, enabled);
      if (result.error) {
        setSetting(settingKey, prevValue);
        setError(result.error);
      }
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutAction();
    });
  };

  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedTopics = () => {
    setSeedMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await seedDefaultTopicsAction();
      if (result.error) {
        setError(result.error);
      } else if (result.count !== undefined) {
        if (result.count > 0) {
          setSeedMessage(`Added ${result.count} default topic${result.count === 1 ? '' : 's'}`);
        } else {
          setSeedMessage('All default topics already exist');
        }
        // Clear message after 3 seconds
        setTimeout(() => setSeedMessage(null), 3000);
      }
    });
  };

  const timezoneOptions = TIMEZONES.map((tz) => ({
    value: tz.value,
    label: tz.label,
  }));

  const accentColorOptions = ACCENT_COLORS.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const imageOptions = BACKGROUND_IMAGES.map((bg) => ({
    value: bg.value,
    label: bg.label,
    artist: bg.artist,
  }));

  return (
    <div>
      {error && (
        <div className="form-error-banner">{error}</div>
      )}

      {/* Account */}
      <Card>
        <CardTitle>Account</CardTitle>
        <FormGroup label="Email">
          <span className="card-body">{userEmail}</span>
        </FormGroup>
        {userName && (
          <FormGroup label="Username">
            <span className="card-body">{userName}</span>
          </FormGroup>
        )}
      </Card>

      {/* Preferences */}
      <Card>
        <CardTitle>Preferences</CardTitle>
        <FormGroup
          label="Timezone"
          hint="Used to determine the current day for journal entries"
        >
          <Select
            options={timezoneOptions}
            value={userSettings.timezone}
            onChange={handleTimezoneChange}
            disabled={isPending}
          />
        </FormGroup>
      </Card>

      {/* Theme */}
      <Card>
        <CardTitle>Theme</CardTitle>
        <FormGroup label="Mode">
          <div className="theme-mode-toggle">
            <button
              type="button"
              className={`theme-mode-btn ${userSettings.themeMode === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeModeChange('dark')}
              disabled={isPending}
            >
              Dark
            </button>
            <button
              type="button"
              className={`theme-mode-btn ${userSettings.themeMode === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeModeChange('light')}
              disabled={isPending}
            >
              Light
            </button>
          </div>
        </FormGroup>

        <FormGroup label="Accent Color">
          <ColorGrid
            options={accentColorOptions}
            value={userSettings.accentColor}
            onChange={handleAccentColorChange}
            disabled={isPending}
          />
        </FormGroup>

        <FormGroup label="Background Image">
          <ImageGrid
            options={imageOptions}
            value={userSettings.backgroundImage}
            onChange={handleBackgroundChange}
            disabled={isPending}
          />
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>
            Images from{' '}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
          </p>
        </FormGroup>
      </Card>

      {/* Topics */}
      <Card>
        <CardTitle>Topics</CardTitle>
        <div className="card-body">
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
            Seed the default topics (Task, Idea, Research, Event, etc.) if they were deleted or missing
          </p>
          {seedMessage && (
            <p className="form-success" style={{ marginBottom: '0.75rem' }}>
              {seedMessage}
            </p>
          )}
          <Button
            variant="secondary"
            onClick={handleSeedTopics}
            disabled={isPending}
          >
            {isPending ? 'Seeding...' : 'Seed Default Topics'}
          </Button>
        </div>
      </Card>

      {/* Features */}
      <Card>
        <CardTitle>Features</CardTitle>
        <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
          Enable optional topics for specialized tracking
        </p>
        {FEATURES.map((feature) => (
          <Toggle
            key={feature.key}
            id={`feature-${feature.key}`}
            label={feature.name}
            description={feature.description}
            checked={Boolean(userSettings[feature.settingKey])}
            onChange={(e) => handleFeatureToggle(feature.key, e.target.checked)}
            disabled={isPending}
          />
        ))}
      </Card>

      {/* Danger Zone */}
      <Card>
        <CardTitle>Danger Zone</CardTitle>
        <div className="card-body">
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
            Sign out of your account on this device
          </p>
          <Button
            variant="danger"
            onClick={handleSignOut}
            disabled={isPending}
          >
            {isPending ? 'Signing out...' : 'Sign Out'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
