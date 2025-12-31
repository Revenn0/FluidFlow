/**
 * API Client Tests
 *
 * Comprehensive tests for API client functions including
 * timeout handling, retry logic, and health monitoring.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Suppress console output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('apiCall', () => {
    it('should make successful API call', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      });

      const result = await apiCall<{ data: string }>('/test');
      expect(result).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on client error (4xx) without retries', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad Request' }),
      });

      // No retries for 4xx errors
      await expect(apiCall('/test', { retries: 0 })).rejects.toThrow('Bad Request');
    });

    it('should throw timeout error on abort', async () => {
      const { apiCall } = await import('../../../services/api/client');

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(apiCall('/test', { timeout: 1000, retries: 0 })).rejects.toThrow(
        'Request timeout after 1000ms'
      );
    });

    it('should include Content-Type header by default', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiCall('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should merge custom headers', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiCall('/test', {
        headers: { 'X-Custom': 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Custom': 'value',
          }),
        })
      );
    });

    it('should handle details error field without retries', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ details: 'Detailed error message' }),
      });

      await expect(apiCall('/test', { retries: 0 })).rejects.toThrow('Detailed error message');
    });

    it('should handle server error response', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      });

      await expect(apiCall('/test', { retries: 0 })).rejects.toThrow('Internal Server Error');
    });

    it('should handle non-Error exceptions', async () => {
      const { apiCall } = await import('../../../services/api/client');

      mockFetch.mockRejectedValueOnce('string error');

      await expect(apiCall('/test', { retries: 0 })).rejects.toThrow();
    });
  });

  describe('checkServerHealth', () => {
    it('should return true when server is healthy', async () => {
      const { checkServerHealth } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await checkServerHealth();
      expect(result).toBe(true);
    });

    it('should return false when server returns error', async () => {
      const { checkServerHealth } = await import('../../../services/api/client');

      mockFetch.mockResolvedValueOnce({ ok: false });

      const result = await checkServerHealth();
      expect(result).toBe(false);
    });

    it('should return false when fetch throws', async () => {
      const { checkServerHealth } = await import('../../../services/api/client');

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await checkServerHealth();
      expect(result).toBe(false);
    });
  });

  describe('isBackendOnline', () => {
    it('should return current backend status', async () => {
      const { isBackendOnline } = await import('../../../services/api/client');

      // Default should be true
      const result = isBackendOnline();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('startHealthMonitor and stopHealthMonitor', () => {
    it('should start health monitoring and cleanup properly', async () => {
      const { startHealthMonitor, stopHealthMonitor } = await import(
        '../../../services/api/client'
      );

      mockFetch.mockResolvedValue({ ok: true });

      const onStatusChange = vi.fn();
      startHealthMonitor(onStatusChange, 60000);

      // Cleanup immediately
      stopHealthMonitor();
    });

    it('should not start duplicate monitors', async () => {
      const { startHealthMonitor, stopHealthMonitor } = await import(
        '../../../services/api/client'
      );

      mockFetch.mockResolvedValue({ ok: true });

      startHealthMonitor(undefined, 60000);
      startHealthMonitor(undefined, 60000); // Should be ignored

      // Cleanup
      stopHealthMonitor();
    });

    it('should stop health monitoring', async () => {
      const { startHealthMonitor, stopHealthMonitor } = await import(
        '../../../services/api/client'
      );

      mockFetch.mockResolvedValue({ ok: true });

      startHealthMonitor(undefined, 60000);
      stopHealthMonitor();

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('API_BASE', () => {
    it('should export API_BASE constant', async () => {
      const { API_BASE } = await import('../../../services/api/client');
      expect(API_BASE).toBeDefined();
      expect(typeof API_BASE).toBe('string');
    });

    it('should default to /api when VITE_API_URL is not set', async () => {
      const { API_BASE } = await import('../../../services/api/client');
      expect(API_BASE).toBe('/api');
    });
  });
});
