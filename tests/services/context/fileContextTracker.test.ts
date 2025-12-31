/**
 * FileContextTracker Tests
 *
 * Tests for file context tracking including delta detection,
 * storage persistence, and singleton management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FileContextTracker,
  getFileContextTracker,
  clearFileTracker,
  hasFileContext,
  clearAllFileTrackers,
} from '../../../services/context/fileContextTracker';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
  }),
};

vi.stubGlobal('localStorage', mockLocalStorage);

// Suppress console.log/warn in tests
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('FileContextTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    clearAllFileTrackers();
  });

  afterEach(() => {
    clearAllFileTrackers();
  });

  describe('constructor', () => {
    it('should create a tracker with the given context ID', () => {
      const tracker = new FileContextTracker('test-context', false);
      expect(tracker.getCurrentTurn()).toBe(0);
      expect(tracker.hasTrackedFiles()).toBe(false);
    });

    it('should load from storage if persistence is enabled', () => {
      const savedData = {
        files: {
          'src/App.tsx': {
            contentHash: 'abc123',
            lastSharedAt: Date.now(),
            sharedInTurn: 1,
            size: 100,
          },
        },
        currentTurn: 1,
      };
      mockStorage['fluidflow_file_context_test-load'] = JSON.stringify(savedData);

      const tracker = new FileContextTracker('test-load', true);
      expect(tracker.hasTrackedFiles()).toBe(true);
      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
    });

    it('should handle corrupted storage data gracefully', () => {
      mockStorage['fluidflow_file_context_corrupt'] = 'not valid json';

      // Should not throw
      const tracker = new FileContextTracker('corrupt', true);
      expect(tracker.hasTrackedFiles()).toBe(false);
    });
  });

  describe('getDelta', () => {
    it('should mark all files as new when no files are tracked', () => {
      const tracker = new FileContextTracker('delta-test', false);

      const files = {
        'src/App.tsx': 'const App = () => <div>Hello</div>;',
        'src/index.tsx': 'import App from "./App";',
      };

      const delta = tracker.getDelta(files);

      expect(delta.new).toHaveLength(2);
      expect(delta.changed).toHaveLength(2);
      expect(delta.unchanged).toHaveLength(0);
      expect(delta.deleted).toHaveLength(0);
    });

    it('should detect changed files', () => {
      const tracker = new FileContextTracker('delta-test', false);

      const initialFiles = {
        'src/App.tsx': 'const App = () => <div>Hello</div>;',
      };

      tracker.markFilesAsShared(initialFiles);

      const updatedFiles = {
        'src/App.tsx': 'const App = () => <div>Updated!</div>;',
      };

      const delta = tracker.getDelta(updatedFiles);

      expect(delta.changed).toContain('src/App.tsx');
      expect(delta.unchanged).toHaveLength(0);
    });

    it('should detect unchanged files', () => {
      const tracker = new FileContextTracker('delta-test', false);

      const files = {
        'src/App.tsx': 'const App = () => <div>Hello</div>;',
      };

      tracker.markFilesAsShared(files);

      const delta = tracker.getDelta(files);

      expect(delta.unchanged).toContain('src/App.tsx');
      expect(delta.changed).toHaveLength(0);
    });

    it('should detect deleted files', () => {
      const tracker = new FileContextTracker('delta-test', false);

      const initialFiles = {
        'src/App.tsx': 'content',
        'src/utils.ts': 'content',
      };

      tracker.markFilesAsShared(initialFiles);

      const currentFiles = {
        'src/App.tsx': 'content',
        // utils.ts is deleted
      };

      const delta = tracker.getDelta(currentFiles);

      expect(delta.deleted).toContain('src/utils.ts');
    });

    it('should handle mixed changes', () => {
      const tracker = new FileContextTracker('delta-test', false);

      const initialFiles = {
        'src/unchanged.ts': 'same content',
        'src/changed.ts': 'original content',
        'src/deleted.ts': 'will be deleted',
      };

      tracker.markFilesAsShared(initialFiles);

      const currentFiles = {
        'src/unchanged.ts': 'same content',
        'src/changed.ts': 'modified content',
        'src/new.ts': 'brand new file',
      };

      const delta = tracker.getDelta(currentFiles);

      expect(delta.unchanged).toContain('src/unchanged.ts');
      expect(delta.changed).toContain('src/changed.ts');
      expect(delta.new).toContain('src/new.ts');
      expect(delta.deleted).toContain('src/deleted.ts');
    });

    it('should handle non-string content by converting to string', () => {
      const tracker = new FileContextTracker('delta-test', false);

      // TypeScript type says string but test edge case
      const files = {
        'src/data.ts': 12345 as unknown as string,
      };

      const delta = tracker.getDelta(files);
      expect(delta.new).toContain('src/data.ts');
    });
  });

  describe('markFilesAsShared', () => {
    it('should mark specified files as shared', () => {
      const tracker = new FileContextTracker('mark-test', false);

      const files = {
        'src/App.tsx': 'content A',
        'src/utils.ts': 'content B',
      };

      tracker.markFilesAsShared(files);

      expect(tracker.hasTrackedFiles()).toBe(true);
      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
      expect(tracker.getTrackedPaths()).toContain('src/utils.ts');
    });

    it('should increment turn number', () => {
      const tracker = new FileContextTracker('mark-test', false);

      expect(tracker.getCurrentTurn()).toBe(0);

      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });
      expect(tracker.getCurrentTurn()).toBe(1);

      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });
      expect(tracker.getCurrentTurn()).toBe(2);
    });

    it('should only mark specified paths if provided', () => {
      const tracker = new FileContextTracker('mark-test', false);

      const files = {
        'src/App.tsx': 'content A',
        'src/utils.ts': 'content B',
      };

      tracker.markFilesAsShared(files, ['src/App.tsx']);

      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
      expect(tracker.getTrackedPaths()).not.toContain('src/utils.ts');
    });

    it('should update file state correctly', () => {
      const tracker = new FileContextTracker('mark-test', false);

      const files = {
        'src/App.tsx': 'const App = () => {};',
      };

      tracker.markFilesAsShared(files);

      const state = tracker.getFileState('src/App.tsx');
      expect(state).toBeDefined();
      expect(state!.sharedInTurn).toBe(1);
      expect(state!.size).toBe(files['src/App.tsx'].length);
      expect(state!.contentHash).toBeDefined();
      expect(state!.lastSharedAt).toBeGreaterThan(0);
    });

    it('should save to storage when persistence is enabled', () => {
      const tracker = new FileContextTracker('persist-test', true);

      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should skip files with undefined content', () => {
      const tracker = new FileContextTracker('mark-test', false);

      const files = {
        'src/App.tsx': 'content',
      };

      // Try to mark a path that doesn't exist in files
      tracker.markFilesAsShared(files, ['src/App.tsx', 'src/missing.ts']);

      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
      expect(tracker.getTrackedPaths()).not.toContain('src/missing.ts');
    });
  });

  describe('removeDeletedFiles', () => {
    it('should remove tracking for deleted files', () => {
      const tracker = new FileContextTracker('remove-test', false);

      tracker.markFilesAsShared({
        'src/App.tsx': 'content',
        'src/utils.ts': 'content',
      });

      tracker.removeDeletedFiles(['src/utils.ts']);

      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
      expect(tracker.getTrackedPaths()).not.toContain('src/utils.ts');
    });

    it('should handle removing non-existent paths', () => {
      const tracker = new FileContextTracker('remove-test', false);

      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });

      // Should not throw
      tracker.removeDeletedFiles(['src/nonexistent.ts']);

      expect(tracker.getTrackedPaths()).toContain('src/App.tsx');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const tracker = new FileContextTracker('stats-test', false);

      const files = {
        'src/App.tsx': 'A'.repeat(100),
        'src/utils.ts': 'B'.repeat(200),
      };

      tracker.markFilesAsShared(files);

      // Add a new file and modify one
      const updatedFiles = {
        'src/App.tsx': 'A'.repeat(100), // unchanged
        'src/utils.ts': 'C'.repeat(200), // changed
        'src/new.ts': 'D'.repeat(50), // new
      };

      const stats = tracker.getStats(updatedFiles);

      expect(stats.totalTracked).toBe(2);
      expect(stats.unchangedFiles).toBe(1);
      expect(stats.changedFiles).toBe(2); // modified + new
      expect(stats.estimatedTokensSaved).toBe(25); // 100 chars / 4
    });

    it('should return zero stats for empty tracker', () => {
      const tracker = new FileContextTracker('stats-test', false);

      const stats = tracker.getStats({ 'src/App.tsx': 'content' });

      expect(stats.totalTracked).toBe(0);
      expect(stats.changedFiles).toBe(1);
      expect(stats.unchangedFiles).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all tracked files', () => {
      const tracker = new FileContextTracker('clear-test', false);

      tracker.markFilesAsShared({
        'src/App.tsx': 'content',
        'src/utils.ts': 'content',
      });

      tracker.clear();

      expect(tracker.hasTrackedFiles()).toBe(false);
      expect(tracker.getCurrentTurn()).toBe(0);
    });
  });

  describe('getFileState', () => {
    it('should return state for tracked file', () => {
      const tracker = new FileContextTracker('state-test', false);

      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });

      const state = tracker.getFileState('src/App.tsx');
      expect(state).toBeDefined();
    });

    it('should return undefined for untracked file', () => {
      const tracker = new FileContextTracker('state-test', false);

      const state = tracker.getFileState('src/nonexistent.ts');
      expect(state).toBeUndefined();
    });
  });
});

describe('Singleton Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
    clearAllFileTrackers();
  });

  describe('getFileContextTracker', () => {
    it('should return same tracker instance for same context ID', () => {
      const tracker1 = getFileContextTracker('singleton-test');
      const tracker2 = getFileContextTracker('singleton-test');

      expect(tracker1).toBe(tracker2);
    });

    it('should return different tracker instances for different context IDs', () => {
      const tracker1 = getFileContextTracker('context-1');
      const tracker2 = getFileContextTracker('context-2');

      expect(tracker1).not.toBe(tracker2);
    });
  });

  describe('clearFileTracker', () => {
    it('should clear specific tracker', () => {
      const tracker = getFileContextTracker('clear-specific');
      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });

      clearFileTracker('clear-specific');

      expect(tracker.hasTrackedFiles()).toBe(false);
    });

    it('should do nothing for non-existent tracker', () => {
      // Should not throw
      clearFileTracker('non-existent');
    });
  });

  describe('hasFileContext', () => {
    it('should return true when tracker has files', () => {
      const tracker = getFileContextTracker('has-context');
      tracker.markFilesAsShared({ 'src/App.tsx': 'content' });

      expect(hasFileContext('has-context')).toBe(true);
    });

    it('should return false when tracker is empty', () => {
      getFileContextTracker('empty-context');

      expect(hasFileContext('empty-context')).toBe(false);
    });

    it('should return false for non-existent tracker', () => {
      expect(hasFileContext('non-existent')).toBe(false);
    });
  });

  describe('clearAllFileTrackers', () => {
    it('should clear all trackers', () => {
      const tracker1 = getFileContextTracker('all-1');
      const tracker2 = getFileContextTracker('all-2');

      tracker1.markFilesAsShared({ 'file1.ts': 'content' });
      tracker2.markFilesAsShared({ 'file2.ts': 'content' });

      clearAllFileTrackers();

      expect(tracker1.hasTrackedFiles()).toBe(false);
      expect(tracker2.hasTrackedFiles()).toBe(false);
    });
  });
});
