/**
 * Hook for managing prompt level preference
 */
import { useState } from 'react';
import { PromptLevel } from '../../../data/promptLibrary';

const STORAGE_KEY = 'fluidflow_prompt_level';

export function usePromptLevel(): [PromptLevel, (level: PromptLevel) => void] {
  const [level, setLevel] = useState<PromptLevel>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['simple', 'detailed', 'advanced'].includes(stored)) {
        return stored as PromptLevel;
      }
    }
    return 'detailed'; // Default to detailed
  });

  const setAndPersist = (newLevel: PromptLevel) => {
    setLevel(newLevel);
    localStorage.setItem(STORAGE_KEY, newLevel);
  };

  return [level, setAndPersist];
}
