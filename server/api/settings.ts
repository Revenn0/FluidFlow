import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { safeJsonParse, safeJsonStringify } from '../../utils/safeJson';
import { encryptProviderConfig, decryptProviderConfig } from '../utils/encryption';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Settings directory (separate from projects) - use process.cwd() for reliability
const SETTINGS_DIR = path.join(process.cwd(), 'settings');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'global.json');

// Ensure settings dir exists
if (!existsSync(SETTINGS_DIR)) {
  mkdirSync(SETTINGS_DIR, { recursive: true });
}

// Global settings structure
interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  apiKey?: string;
  baseUrl?: string;
  models?: string[];
  isLocal?: boolean;
}

interface CustomSnippet {
  id: string;
  name: string;
  code: string;
  category: string;
  createdAt: number;
}

interface GlobalSettings {
  // AI Provider settings
  aiProviders: ProviderConfig[];
  activeProviderId: string;

  // Custom code snippets
  customSnippets: CustomSnippet[];

  // Metadata
  updatedAt: number;
}

const DEFAULT_SETTINGS: GlobalSettings = {
  aiProviders: [],
  activeProviderId: 'default-gemini',
  customSnippets: [],
  updatedAt: 0
};

// Lock to prevent concurrent settings saves
let settingsLock: Promise<void> | null = null;

async function withSettingsLock<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for any existing lock
  if (settingsLock) {
    await settingsLock;
  }

  // Create new lock
  let resolveLock: () => void;
  settingsLock = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });

  try {
    return await fn();
  } finally {
    resolveLock!();
    settingsLock = null;
  }
}

// Helper to load settings (decrypts API keys)
async function loadSettings(): Promise<GlobalSettings> {
  try {
    if (existsSync(SETTINGS_FILE)) {
      const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
      const settings = { ...DEFAULT_SETTINGS, ...safeJsonParse(data, {}) } as GlobalSettings;

      // Decrypt API keys in provider configs
      if (settings.aiProviders && settings.aiProviders.length > 0) {
        settings.aiProviders = await Promise.all(
          settings.aiProviders.map(provider => decryptProviderConfig(provider))
        );
      }

      return settings;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return { ...DEFAULT_SETTINGS };
}

// Helper to save settings (encrypts API keys)
async function saveSettings(settings: GlobalSettings): Promise<void> {
  settings.updatedAt = Date.now();

  // Create a copy with encrypted API keys
  const settingsToSave = { ...settings };
  if (settingsToSave.aiProviders && settingsToSave.aiProviders.length > 0) {
    settingsToSave.aiProviders = await Promise.all(
      settingsToSave.aiProviders.map(provider => encryptProviderConfig(provider))
    );
  }

  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settingsToSave, null, 2));
}

// ============ SETTINGS API ============

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update all settings
router.put('/', async (req, res) => {
  try {
    const { aiProviders, activeProviderId, customSnippets } = req.body;

    const updatedAt = await withSettingsLock(async () => {
      const settings = await loadSettings();

      if (aiProviders !== undefined) settings.aiProviders = aiProviders;
      if (activeProviderId !== undefined) settings.activeProviderId = activeProviderId;
      if (customSnippets !== undefined) settings.customSnippets = customSnippets;

      await saveSettings(settings);
      return settings.updatedAt;
    });

    res.json({ message: 'Settings saved', updatedAt });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// ============ AI PROVIDERS ============

// Get AI providers
router.get('/ai-providers', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json({
      providers: settings.aiProviders,
      activeId: settings.activeProviderId
    });
  } catch (error) {
    console.error('Get AI providers error:', error);
    res.status(500).json({ error: 'Failed to get AI providers' });
  }
});

// Save AI providers
router.put('/ai-providers', async (req, res) => {
  try {
    const { providers, activeId } = req.body;

    const updatedAt = await withSettingsLock(async () => {
      const settings = await loadSettings();

      if (providers !== undefined) settings.aiProviders = providers;
      if (activeId !== undefined) settings.activeProviderId = activeId;

      await saveSettings(settings);
      return settings.updatedAt;
    });

    res.json({ message: 'AI providers saved', updatedAt });
  } catch (error) {
    console.error('Save AI providers error:', error);
    res.status(500).json({ error: 'Failed to save AI providers' });
  }
});

// ============ CUSTOM SNIPPETS ============

// Get custom snippets
router.get('/snippets', async (req, res) => {
  try {
    const settings = await loadSettings();
    res.json(settings.customSnippets);
  } catch (error) {
    console.error('Get snippets error:', error);
    res.status(500).json({ error: 'Failed to get snippets' });
  }
});

// Save custom snippets
router.put('/snippets', async (req, res) => {
  try {
    const { snippets } = req.body;

    const updatedAt = await withSettingsLock(async () => {
      const settings = await loadSettings();
      settings.customSnippets = snippets || [];
      await saveSettings(settings);
      return settings.updatedAt;
    });

    res.json({ message: 'Snippets saved', updatedAt });
  } catch (error) {
    console.error('Save snippets error:', error);
    res.status(500).json({ error: 'Failed to save snippets' });
  }
});

// Add single snippet
router.post('/snippets', async (req, res) => {
  try {
    const { name, code, category } = req.body;

    const newSnippet = await withSettingsLock(async () => {
      const settings = await loadSettings();

      const snippet: CustomSnippet = {
        id: `custom-${Date.now()}`,
        name,
        code,
        category: category || 'Custom',
        createdAt: Date.now()
      };

      settings.customSnippets.push(snippet);
      await saveSettings(settings);
      return snippet;
    });

    res.status(201).json(newSnippet);
  } catch (error) {
    console.error('Add snippet error:', error);
    res.status(500).json({ error: 'Failed to add snippet' });
  }
});

// Delete snippet
router.delete('/snippets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await withSettingsLock(async () => {
      const settings = await loadSettings();
      settings.customSnippets = settings.customSnippets.filter(s => s.id !== id);
      await saveSettings(settings);
    });

    res.json({ message: 'Snippet deleted' });
  } catch (error) {
    console.error('Delete snippet error:', error);
    res.status(500).json({ error: 'Failed to delete snippet' });
  }
});

export { router as settingsRouter };
