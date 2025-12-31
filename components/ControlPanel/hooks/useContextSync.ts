/**
 * useContextSync - Syncs chat messages to ConversationContextManager
 *
 * Handles:
 * - Session ID management per project
 * - Message sync with deduplication
 * - Token tracking from message content
 * - Smart context reset when project has existing AI context
 */

import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { getContextManager, CONTEXT_IDS } from '@/services/conversationContext';
import { getProjectContext } from '@/services/projectContext';

interface UseContextSyncOptions {
  projectId: string | undefined;
  messages: ChatMessage[];
  /** When true, skip syncing restored messages (they won't count toward token usage) */
  skipRestoredMessages?: boolean;
}

export function useContextSync({ projectId, messages, skipRestoredMessages = false }: UseContextSyncOptions) {
  const contextManager = getContextManager();
  const sessionIdRef = useRef<string>(`${CONTEXT_IDS.MAIN_CHAT}-${projectId || 'default'}`);
  // Track which messages have been synced to prevent duplicates on batch updates
  const syncedMessageIdsRef = useRef<Set<string>>(new Set());
  // Track if we've done the initial context setup for this project
  const hasInitializedRef = useRef<string | null>(null);

  // Update session ID and handle context reset when project changes
  useEffect(() => {
    const newSessionId = `${CONTEXT_IDS.MAIN_CHAT}-${projectId || 'default'}`;
    sessionIdRef.current = newSessionId;

    // Check if project has existing AI context (style guide + summary)
    // If so, clear the conversation context and mark existing messages as synced
    // This prevents re-counting tokens for historical messages
    if (projectId && projectId !== hasInitializedRef.current) {
      const existingContext = getProjectContext(projectId);
      if (existingContext) {
        console.log(`[ContextSync] Project has existing AI context (generated at ${new Date(existingContext.generatedAt).toLocaleString()})`);
        console.log(`[ContextSync] Clearing conversation context to avoid token bloat from restored messages`);
        contextManager.clearContext(newSessionId);

        // Mark all current messages as synced so they don't get re-added
        // This is key: restored messages won't inflate token count
        messages.forEach(msg => syncedMessageIdsRef.current.add(msg.id));
        console.log(`[ContextSync] Marked ${messages.length} restored messages as synced (won't count toward tokens)`);
      } else {
        // No existing context - clear synced IDs so messages get counted
        syncedMessageIdsRef.current.clear();
      }
      hasInitializedRef.current = projectId;
    } else if (!projectId) {
      // Scratch project - clear synced IDs
      syncedMessageIdsRef.current.clear();
    }

    console.log(`[ContextSync] Project changed, new session: ${newSessionId}`);
  }, [projectId, contextManager, messages]);

  // Sync messages with context manager
  // BUG FIX: Sync ALL new messages, not just the last one
  // React 18 batches state updates, so multiple messages can be added before this runs
  useEffect(() => {
    if (messages.length === 0) return;

    // Find all messages that haven't been synced yet
    const unsynced = messages.filter(msg => !syncedMessageIdsRef.current.has(msg.id));
    if (unsynced.length === 0) return;

    console.log(`[ContextSync] Found ${unsynced.length} unsync'd message(s) to add`);

    for (const msg of unsynced) {
      // For user messages: use llmContent (full codebase) or prompt
      // For assistant messages: use explanation/error + file content for accurate token counting
      let content: string;
      let actualTokens: number | undefined;

      if (msg.role === 'user') {
        content = msg.llmContent || msg.prompt || '';
        // Use actual token count if available (e.g., from codebase sync)
        if (msg.tokenUsage?.totalTokens) {
          actualTokens = msg.tokenUsage.totalTokens;
        }
      } else {
        // For assistant messages, include file content in token estimation
        const textContent = msg.explanation || msg.error || '';
        const filesContent = msg.files
          ? Object.entries(msg.files).map(([path, code]) => `// ${path}\n${code}`).join('\n\n')
          : '';
        content = textContent + (filesContent ? '\n\n' + filesContent : '');

        // Use actual token count from API if available
        if (msg.tokenUsage?.totalTokens) {
          actualTokens = msg.tokenUsage.totalTokens;
        }
      }

      console.log(`[ContextSync] Adding ${msg.role} message (id: ${msg.id.slice(0, 8)}...) to session "${sessionIdRef.current}", content length: ${content.length}, tokens: ${actualTokens || 'estimated'}`);

      contextManager.addMessage(
        sessionIdRef.current,
        msg.role,
        content,
        { messageId: msg.id },
        actualTokens
      );

      // Mark as synced
      syncedMessageIdsRef.current.add(msg.id);
    }
    // Note: contextManager is a singleton, messages array is iterated but we only trigger on length change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  return {
    sessionId: sessionIdRef.current,
    contextManager,
  };
}
