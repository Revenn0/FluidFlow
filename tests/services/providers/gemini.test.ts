/**
 * Gemini Provider Tests
 *
 * Comprehensive tests for Gemini provider including
 * connection testing, generation, and streaming.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ProviderConfig, GenerationRequest } from '../../../services/ai/types';

// Mock functions
const mockGenerateContent = vi.fn();
const mockGenerateContentStream = vi.fn();

// Mock the Google GenAI SDK
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: mockGenerateContent,
      generateContentStream: mockGenerateContentStream,
    };
  },
}));

// Mock supportsNativeSchema
vi.mock('../../../services/ai/utils/schemas', () => ({
  supportsNativeSchema: vi.fn(() => false),
}));

// Suppress console.log
vi.spyOn(console, 'log').mockImplementation(() => {});

// Import after mocks are set up
import { GeminiProvider } from '../../../services/ai/providers/gemini';

describe('GeminiProvider', () => {
  let provider: GeminiProvider;
  let config: ProviderConfig;

  beforeEach(() => {
    vi.clearAllMocks();

    config = {
      id: 'test-gemini',
      type: 'gemini',
      name: 'Test Gemini',
      apiKey: 'test-api-key',
      defaultModel: 'gemini-pro',
      baseUrl: '',
      headers: {},
      models: [{ id: 'gemini-pro', name: 'Gemini Pro' }],
    };

    provider = new GeminiProvider(config);
  });

  describe('constructor', () => {
    it('should create provider with config', () => {
      expect(provider.config).toBe(config);
    });

    it('should handle empty API key', () => {
      const emptyKeyConfig = { ...config, apiKey: '' };
      const emptyKeyProvider = new GeminiProvider(emptyKeyConfig);
      expect(emptyKeyProvider.config.apiKey).toBe('');
    });
  });

  describe('testConnection', () => {
    it('should return success when connection is valid', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Hi',
      });

      const result = await provider.testConnection();

      expect(result).toEqual({ success: true });
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should return error when connection fails', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('API key invalid'));

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('API key invalid');
    });

    it('should handle non-Error objects in catch', async () => {
      mockGenerateContent.mockRejectedValueOnce('string error');

      const result = await provider.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });

  describe('generate', () => {
    it('should generate text with basic request', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Generated response',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
        },
      });

      const request: GenerationRequest = {
        prompt: 'Test prompt',
        maxTokens: 1000,
        temperature: 0.7,
      };

      const result = await provider.generate(request, 'gemini-pro');

      expect(result.text).toBe('Generated response');
      expect(result.usage).toEqual({
        inputTokens: 10,
        outputTokens: 20,
      });
    });

    it('should include system instruction', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Test',
        systemInstruction: 'You are a helpful assistant',
      };

      await provider.generate(request, 'gemini-pro');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: 'You are a helpful assistant',
          }),
        })
      );
    });

    it('should include conversation history', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Continue',
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
        ],
      };

      await provider.generate(request, 'gemini-pro');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            { role: 'user', parts: [{ text: 'Hello' }] },
            { role: 'model', parts: [{ text: 'Hi there!' }] },
          ]),
        })
      );
    });

    it('should map assistant role to model', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Test',
        conversationHistory: [{ role: 'assistant', content: 'Previous response' }],
      };

      await provider.generate(request, 'gemini-pro');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            { role: 'model', parts: [{ text: 'Previous response' }] },
          ]),
        })
      );
    });

    it('should map system role to user', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Test',
        conversationHistory: [{ role: 'system', content: 'System message' }],
      };

      await provider.generate(request, 'gemini-pro');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            { role: 'user', parts: [{ text: 'System message' }] },
          ]),
        })
      );
    });

    it('should handle images in request', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Image description',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Describe this image',
        images: [{ data: 'base64imagedata', mimeType: 'image/png' }],
      };

      await provider.generate(request, 'gemini-pro-vision');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              parts: expect.arrayContaining([
                { inlineData: { mimeType: 'image/png', data: 'base64imagedata' } },
                { text: 'Describe this image' },
              ]),
            }),
          ]),
        })
      );
    });

    it('should enable JSON mode with responseMimeType', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '{"key": "value"}',
        usageMetadata: {},
      });

      const request: GenerationRequest = {
        prompt: 'Generate JSON',
        responseFormat: 'json',
        responseSchema: { type: 'object' },
      };

      await provider.generate(request, 'gemini-pro');

      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            responseMimeType: 'application/json',
          }),
        })
      );
    });

    it('should handle empty text response', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '',
        usageMetadata: {},
      });

      const result = await provider.generate({ prompt: 'Test' }, 'gemini-pro');

      expect(result.text).toBe('');
    });

    it('should handle missing usageMetadata', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: 'Response',
      });

      const result = await provider.generate({ prompt: 'Test' }, 'gemini-pro');

      expect(result.usage).toEqual({
        inputTokens: undefined,
        outputTokens: undefined,
      });
    });
  });

  describe('generateStream', () => {
    it('should stream text generation', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: 'Hello' };
          yield { text: ' World' };
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const chunks: string[] = [];
      const onChunk = vi.fn((chunk) => {
        if (chunk.text) chunks.push(chunk.text);
      });

      const request: GenerationRequest = {
        prompt: 'Test streaming',
      };

      const result = await provider.generateStream(request, 'gemini-pro', onChunk);

      expect(result.text).toBe('Hello World');
      expect(chunks).toEqual(['Hello', ' World']);
      expect(onChunk).toHaveBeenCalledWith(expect.objectContaining({ done: true }));
    });

    it('should include conversation history in streaming', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: 'Response' };
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const request: GenerationRequest = {
        prompt: 'Continue',
        conversationHistory: [{ role: 'user', content: 'First message' }],
      };

      await provider.generateStream(request, 'gemini-pro', vi.fn());

      expect(mockGenerateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            { role: 'user', parts: [{ text: 'First message' }] },
          ]),
        })
      );
    });

    it('should handle images in streaming request', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: 'Description' };
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const request: GenerationRequest = {
        prompt: 'Describe this',
        images: [{ data: 'imagedata', mimeType: 'image/jpeg' }],
      };

      await provider.generateStream(request, 'gemini-pro-vision', vi.fn());

      expect(mockGenerateContentStream).toHaveBeenCalledWith(
        expect.objectContaining({
          contents: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                { inlineData: { mimeType: 'image/jpeg', data: 'imagedata' } },
              ]),
            }),
          ]),
        })
      );
    });

    it('should estimate tokens in streaming response', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: 'Response text' };
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const result = await provider.generateStream({ prompt: 'Test' }, 'gemini-pro', vi.fn());

      expect(result.usage?.isEstimated).toBe(true);
      expect(result.usage?.inputTokens).toBeGreaterThan(0);
      expect(result.usage?.outputTokens).toBeGreaterThan(0);
    });

    it('should signal done even on error', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: 'Partial' };
          throw new Error('Stream error');
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const onChunk = vi.fn();

      await expect(
        provider.generateStream({ prompt: 'Test' }, 'gemini-pro', onChunk)
      ).rejects.toThrow('Stream error');

      expect(onChunk).toHaveBeenCalledWith({ text: '', done: true });
    });

    it('should handle empty text chunks', async () => {
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { text: '' };
          yield { text: 'Hello' };
          yield { text: undefined };
        },
      };

      mockGenerateContentStream.mockResolvedValueOnce(mockStream);

      const result = await provider.generateStream({ prompt: 'Test' }, 'gemini-pro', vi.fn());

      expect(result.text).toBe('Hello');
    });
  });
});
