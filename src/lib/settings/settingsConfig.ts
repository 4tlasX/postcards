/**
 * Settings configuration - defaults, types, and options
 */

// =============================================================================
// Types
// =============================================================================

export interface FeatureSettings {
  foodEnabled: boolean;
  medicationEnabled: boolean;
  goalsEnabled: boolean;
  milestonesEnabled: boolean;
  exerciseEnabled: boolean;
  allergiesEnabled: boolean;
}

export interface PreferenceSettings {
  timezone: string;
  accentColor: string;
  backgroundImage: string;
  themeMode: 'dark' | 'light';
}

export type AllSettings = FeatureSettings & PreferenceSettings;

export type SettingKey = keyof AllSettings;

export type FeatureKey = 'food' | 'medication' | 'goals' | 'milestones' | 'exercise' | 'allergies';

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_SETTINGS: AllSettings = {
  // Feature toggles
  foodEnabled: false,
  medicationEnabled: false,
  goalsEnabled: false,
  milestonesEnabled: false,
  exerciseEnabled: false,
  allergiesEnabled: false,
  // User preferences
  timezone: 'UTC',
  accentColor: '#80cbc4', // Material Design Teal 200 (blue-green)
  backgroundImage: '/backgrounds/adam-kool-ndN00KmbJ1c-unsplash.jpg', // Waterfall
  themeMode: 'dark',
};

// =============================================================================
// Feature Definitions
// =============================================================================

export interface FeatureDefinition {
  key: FeatureKey;
  settingKey: keyof FeatureSettings;
  name: string;
  description: string;
  taxonomyName: string;
  taxonomyIcon: string;
}

export const FEATURES: FeatureDefinition[] = [
  {
    key: 'food',
    settingKey: 'foodEnabled',
    name: 'Food Tracking',
    description: 'Track meals and nutrition',
    taxonomyName: 'Food',
    taxonomyIcon: 'utensils',
  },
  {
    key: 'medication',
    settingKey: 'medicationEnabled',
    name: 'Medication Tracking',
    description: 'Track medications and schedules',
    taxonomyName: 'Medication',
    taxonomyIcon: 'pills',
  },
  {
    key: 'goals',
    settingKey: 'goalsEnabled',
    name: 'Goal Tracking',
    description: 'Set and track long-term goals',
    taxonomyName: 'Goal',
    taxonomyIcon: 'bullseye',
  },
  {
    key: 'milestones',
    settingKey: 'milestonesEnabled',
    name: 'Milestone Tracking',
    description: 'Track progress milestones for goals',
    taxonomyName: 'Milestone',
    taxonomyIcon: 'flag',
  },
  {
    key: 'exercise',
    settingKey: 'exerciseEnabled',
    name: 'Exercise Tracking',
    description: 'Log workouts and physical activity',
    taxonomyName: 'Exercise',
    taxonomyIcon: 'dumbbell',
  },
  {
    key: 'allergies',
    settingKey: 'allergiesEnabled',
    name: 'Allergy Tracking',
    description: 'Track allergies and reactions',
    taxonomyName: 'Allergy',
    taxonomyIcon: 'triangle-exclamation',
  },
];

// =============================================================================
// Accent Color Options
// =============================================================================

export interface ColorOption {
  value: string;
  label: string;
}

// Material Design 200 colors
export const ACCENT_COLORS: ColorOption[] = [
  { value: '#ef9a9a', label: 'Red' },
  { value: '#f48fb1', label: 'Pink' },
  { value: '#ce93d8', label: 'Purple' },
  { value: '#b39ddb', label: 'Deep Purple' },
  { value: '#9fa8da', label: 'Indigo' },
  { value: '#90caf9', label: 'Blue' },
  { value: '#81d4fa', label: 'Light Blue' },
  { value: '#80deea', label: 'Cyan' },
  { value: '#80cbc4', label: 'Teal' },
  { value: '#a5d6a7', label: 'Green' },
  { value: '#c5e1a5', label: 'Light Green' },
  { value: '#e6ee9c', label: 'Lime' },
  { value: '#fff59d', label: 'Yellow' },
  { value: '#ffe082', label: 'Amber' },
  { value: '#ffcc80', label: 'Orange' },
  { value: '#ffab91', label: 'Deep Orange' },
  { value: '#bcaaa4', label: 'Brown' },
  { value: '#eeeeee', label: 'Grey' },
  { value: '#b0bec5', label: 'Blue Grey' },
];

// =============================================================================
// Background Image Options
// =============================================================================

export interface BackgroundOption {
  value: string;
  label: string;
  artist: string | null;
  artistUrl: string | null;
}

export const BACKGROUND_IMAGES: BackgroundOption[] = [
  { value: '', label: 'None', artist: null, artistUrl: null },
  { value: '/backgrounds/adam-kool-ndN00KmbJ1c-unsplash.jpg', label: 'Waterfall', artist: 'Adam Kool', artistUrl: 'https://unsplash.com/@adamkool' },
  { value: '/backgrounds/clem-onojeghuo-zlABb6Gke24-unsplash.jpg', label: 'Abstract', artist: 'Clem Onojeghuo', artistUrl: 'https://unsplash.com/@clemono' },
  { value: '/backgrounds/daniel-olah-6KQETG8J-zI-unsplash.jpg', label: 'Ocean', artist: 'Daniel Olah', artistUrl: 'https://unsplash.com/@danesduet' },
  { value: '/backgrounds/daniela-cuevas-t7YycgAoVSw-unsplash.jpg', label: 'Desert', artist: 'Daniela Cuevas', artistUrl: 'https://unsplash.com/@danielacuevas' },
  { value: '/backgrounds/emma-francis-vpHCfunwDrQ-unsplash.jpg', label: 'Blush', artist: 'Emma Francis', artistUrl: 'https://unsplash.com/@emmafrancis' },
  { value: '/backgrounds/fiona-murray-degraaff-F6_mI0aGdZU-unsplash.jpg', label: 'Texture', artist: 'Fiona Murray-DeGraaff', artistUrl: 'https://unsplash.com/@fionamurraydegraaff' },
  { value: '/backgrounds/frank-mckenna-4V8JxijgZ_c-unsplash.jpg', label: 'Waves', artist: 'Frank McKenna', artistUrl: 'https://unsplash.com/@frankiefoto' },
  { value: '/backgrounds/haris-khan-kD9SRoloQCA-unsplash.jpg', label: 'Gradient', artist: 'Haris Khan', artistUrl: 'https://unsplash.com/@hariskhan' },
  { value: '/backgrounds/joshua-sortino-71vAb1FXB6g-unsplash.jpg', label: 'Lights', artist: 'Joshua Sortino', artistUrl: 'https://unsplash.com/@sortino' },
  { value: '/backgrounds/kace-rodriguez-p3OzJuT_Dks-unsplash.jpg', label: 'Mountain', artist: 'Kace Rodriguez', artistUrl: 'https://unsplash.com/@kace' },
  { value: '/backgrounds/kier-in-sight-archives-O7srvV2piu0-unsplash.jpg', label: 'Vintage', artist: 'Kier in Sight Archives', artistUrl: 'https://unsplash.com/@kierinsightarchives' },
  { value: '/backgrounds/krakograff-textures-uPIsSnY2vtA-unsplash.jpg', label: 'Paper', artist: 'Krakograff Textures', artistUrl: 'https://unsplash.com/@krakograff' },
  { value: '/backgrounds/liana-s-9duuU4kMI6s-unsplash.jpg', label: 'Marble', artist: 'Liana S', artistUrl: 'https://unsplash.com/@lianas' },
  { value: '/backgrounds/luca-bravo-zAjdgNXsMeg-unsplash.jpg', label: 'Forest', artist: 'Luca Bravo', artistUrl: 'https://unsplash.com/@lucabravo' },
  { value: '/backgrounds/matheo-jbt-lvi9xKSyCiE-unsplash.jpg', label: 'Soft', artist: 'Matheo JBT', artistUrl: 'https://unsplash.com/@matheo_jbt' },
  { value: '/backgrounds/mehrab-sium-a7O0Tsd8dE8-unsplash.jpg', label: 'Colorful', artist: 'Mehrab Sium', artistUrl: 'https://unsplash.com/@mehrabsium' },
  { value: '/backgrounds/moritz-lange-Rq2XVvWZvDc-unsplash.jpg', label: 'Warm', artist: 'Moritz Lange', artistUrl: 'https://unsplash.com/@moritzlange' },
  { value: '/backgrounds/nasa-rTZW4f02zY8-unsplash.jpg', label: 'Earth', artist: 'NASA', artistUrl: 'https://unsplash.com/@nasa' },
  { value: '/backgrounds/olga-thelavart-HZm2XR0whdw-unsplash.jpg', label: 'Floral', artist: 'Olga Thelavart', artistUrl: 'https://unsplash.com/@thelavart' },
  { value: '/backgrounds/paul-talbot-pQDBGxtiDEo-unsplash.jpg', label: 'Minimalist', artist: 'Paul Talbot', artistUrl: 'https://unsplash.com/@paultalbot' },
  { value: '/backgrounds/petr-vysohlid-9fqwGqGLUxc-unsplash.jpg', label: 'Aurora', artist: 'Petr Vysohlid', artistUrl: 'https://unsplash.com/@petrvysohlid' },
  { value: '/backgrounds/sandra-seitamaa-OHLgIjctfrg-unsplash.jpg', label: 'Lake', artist: 'Sandra Seitamaa', artistUrl: 'https://unsplash.com/@seitamaaphotography' },
  { value: '/backgrounds/sandra-seitamaa-SrFL-O4qXfA-unsplash.jpg', label: 'Nordic', artist: 'Sandra Seitamaa', artistUrl: 'https://unsplash.com/@seitamaaphotography' },
  { value: '/backgrounds/sandra-seitamaa-a7e71c0jSgQ-unsplash.jpg', label: 'Winter', artist: 'Sandra Seitamaa', artistUrl: 'https://unsplash.com/@seitamaaphotography' },
  { value: '/backgrounds/scott-webb-sk59I1qRfEM-unsplash.jpg', label: 'Concrete', artist: 'Scott Webb', artistUrl: 'https://unsplash.com/@scottwebb' },
  { value: '/backgrounds/stephanie-sarlos-Q9q6UGkU96s-unsplash.jpg', label: 'Pastel', artist: 'Stephanie Sarlos', artistUrl: 'https://unsplash.com/@stephaniesarlos' },
  { value: '/backgrounds/yevhenii-deshko-ieY_9lJnLNs-unsplash.jpg', label: 'Pink', artist: 'Yevhenii Deshko', artistUrl: 'https://unsplash.com/@yevheniideshko' },
];

// =============================================================================
// Helper to get setting type info
// =============================================================================

export function getSettingType(key: SettingKey): 'boolean' | 'string' {
  if (key.endsWith('Enabled')) {
    return 'boolean';
  }
  return 'string';
}

/**
 * Parse a setting value from the database (JSONB) to the correct type
 */
export function parseSettingValue<K extends SettingKey>(
  key: K,
  value: unknown
): AllSettings[K] {
  const defaultValue = DEFAULT_SETTINGS[key];

  if (value === null || value === undefined) {
    return defaultValue;
  }

  const expectedType = getSettingType(key);

  if (expectedType === 'boolean') {
    if (typeof value === 'boolean') return value as AllSettings[K];
    if (value === 'true') return true as AllSettings[K];
    if (value === 'false') return false as AllSettings[K];
    return defaultValue;
  }

  // String type
  if (typeof value === 'string') return value as AllSettings[K];
  return String(value) as AllSettings[K];
}
