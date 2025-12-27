/**
 * ThemeContext - Global theme management
 *
 * Handles theme selection, persistence, and CSS variable application.
 * Themes are applied via CSS custom properties on the document root.
 */
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  ThemeId,
  Theme,
  THEMES,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  SEMANTIC_COLORS,
} from '../types/theme';

// ============ Types ============

export interface ThemeContextValue {
  // Current theme
  currentTheme: Theme;
  themeId: ThemeId;

  // Theme actions
  setTheme: (themeId: ThemeId) => void;
  resetTheme: () => void;

  // All available themes
  themes: typeof THEMES;
  themeList: Theme[];
}

// ============ CSS Variable Application ============

function applyThemeToDocument(theme: Theme): void {
  const root = document.documentElement;
  const { colors } = theme;

  // ============ BASE COLORS ============
  root.style.setProperty('--theme-background', colors.background);
  root.style.setProperty('--theme-background-elevated', colors.backgroundElevated);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-hover', colors.surfaceHover);
  root.style.setProperty('--theme-surface-active', colors.surfaceActive);
  root.style.setProperty('--theme-surface-elevated', colors.surfaceElevated);

  // ============ GLASS EFFECTS ============
  root.style.setProperty('--theme-glass-100', colors.glass100);
  root.style.setProperty('--theme-glass-200', colors.glass200);
  root.style.setProperty('--theme-glass-300', colors.glass300);
  root.style.setProperty('--theme-glass-400', colors.glass400);

  // ============ BORDERS ============
  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-border-hover', colors.borderHover);
  root.style.setProperty('--theme-border-light', colors.borderLight);
  root.style.setProperty('--theme-border-strong', colors.borderStrong);

  // ============ TEXT ============
  root.style.setProperty('--theme-text-primary', colors.textPrimary);
  root.style.setProperty('--theme-text-secondary', colors.textSecondary);
  root.style.setProperty('--theme-text-muted', colors.textMuted);
  root.style.setProperty('--theme-text-dim', colors.textDim);
  root.style.setProperty('--theme-text-inverse', colors.textInverse);
  root.style.setProperty('--theme-text-on-accent', colors.textOnAccent);
  root.style.setProperty('--theme-text-heading', colors.textHeading);
  root.style.setProperty('--theme-text-link', colors.textLink);
  root.style.setProperty('--theme-text-link-hover', colors.textLinkHover);

  // ============ PRIMARY ACCENT ============
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-accent-hover', colors.accentHover);
  root.style.setProperty('--theme-accent-active', colors.accentActive);
  root.style.setProperty('--theme-accent-subtle', colors.accentSubtle);
  root.style.setProperty('--theme-accent-muted', colors.accentMuted);

  // ============ SECONDARY ACCENT ============
  root.style.setProperty('--theme-secondary', colors.secondary);
  root.style.setProperty('--theme-secondary-hover', colors.secondaryHover);
  root.style.setProperty('--theme-secondary-subtle', colors.secondarySubtle);

  // ============ TERTIARY ACCENT ============
  root.style.setProperty('--theme-tertiary', colors.tertiary);
  root.style.setProperty('--theme-tertiary-hover', colors.tertiaryHover);
  root.style.setProperty('--theme-tertiary-subtle', colors.tertiarySubtle);

  // ============ AI-SPECIFIC COLORS ============
  root.style.setProperty('--theme-ai-accent', colors.aiAccent);
  root.style.setProperty('--theme-ai-accent-hover', colors.aiAccentHover);
  root.style.setProperty('--theme-ai-accent-subtle', colors.aiAccentSubtle);
  root.style.setProperty('--theme-ai-secondary', colors.aiSecondary);
  root.style.setProperty('--theme-ai-secondary-subtle', colors.aiSecondarySubtle);

  // ============ COMPONENT: SIDEBAR ============
  root.style.setProperty('--theme-sidebar-bg', colors.sidebarBackground);
  root.style.setProperty('--theme-sidebar-border', colors.sidebarBorder);
  root.style.setProperty('--theme-sidebar-item-hover', colors.sidebarItemHover);
  root.style.setProperty('--theme-sidebar-item-active', colors.sidebarItemActive);

  // ============ COMPONENT: HEADER ============
  root.style.setProperty('--theme-header-bg', colors.headerBackground);
  root.style.setProperty('--theme-header-border', colors.headerBorder);
  root.style.setProperty('--theme-header-text', colors.headerText);

  // ============ COMPONENT: MODAL ============
  root.style.setProperty('--theme-modal-bg', colors.modalBackground);
  root.style.setProperty('--theme-modal-overlay', colors.modalOverlay);
  root.style.setProperty('--theme-modal-border', colors.modalBorder);
  root.style.setProperty('--theme-modal-header-bg', colors.modalHeaderBg);

  // ============ COMPONENT: INPUT ============
  root.style.setProperty('--theme-input-bg', colors.inputBackground);
  root.style.setProperty('--theme-input-border', colors.inputBorder);
  root.style.setProperty('--theme-input-border-focus', colors.inputBorderFocus);
  root.style.setProperty('--theme-input-placeholder', colors.inputPlaceholder);

  // ============ COMPONENT: BUTTON ============
  root.style.setProperty('--theme-button-bg', colors.buttonBackground);
  root.style.setProperty('--theme-button-bg-hover', colors.buttonBackgroundHover);
  root.style.setProperty('--theme-button-border', colors.buttonBorder);
  root.style.setProperty('--theme-button-text', colors.buttonText);

  // ============ COMPONENT: TOOLTIP ============
  root.style.setProperty('--theme-tooltip-bg', colors.tooltipBackground);
  root.style.setProperty('--theme-tooltip-text', colors.tooltipText);
  root.style.setProperty('--theme-tooltip-border', colors.tooltipBorder);

  // ============ COMPONENT: BADGE ============
  root.style.setProperty('--theme-badge-bg', colors.badgeBackground);
  root.style.setProperty('--theme-badge-text', colors.badgeText);

  // ============ COMPONENT: CODE ============
  root.style.setProperty('--theme-code-bg', colors.codeBackground);
  root.style.setProperty('--theme-code-text', colors.codeText);
  root.style.setProperty('--theme-code-border', colors.codeBorder);
  root.style.setProperty('--theme-line-number', colors.lineNumberText);
  root.style.setProperty('--theme-line-highlight', colors.lineHighlight);

  // ============ INTERACTIVE STATES ============
  root.style.setProperty('--theme-focus-ring', colors.focusRing);
  root.style.setProperty('--theme-focus-ring-offset', colors.focusRingOffset);
  root.style.setProperty('--theme-selection', colors.selection);
  root.style.setProperty('--theme-selection-text', colors.selectionText);
  root.style.setProperty('--theme-highlight', colors.highlight);

  // ============ OVERLAYS & SHADOWS ============
  root.style.setProperty('--theme-overlay', colors.overlay);
  root.style.setProperty('--theme-shadow', colors.shadow);
  root.style.setProperty('--theme-shadow-strong', colors.shadowStrong);
  root.style.setProperty('--theme-glow', colors.glow);

  // ============ GRADIENT ============
  root.style.setProperty('--theme-gradient-from', colors.gradientFrom);
  root.style.setProperty('--theme-gradient-via', colors.gradientVia);
  root.style.setProperty('--theme-gradient-to', colors.gradientTo);

  // ============ SCROLLBAR ============
  root.style.setProperty('--theme-scrollbar-track', colors.scrollbarTrack);
  root.style.setProperty('--theme-scrollbar-thumb', colors.scrollbarThumb);
  root.style.setProperty('--theme-scrollbar-thumb-hover', colors.scrollbarThumbHover);

  // ============ STATUS BAR ============
  root.style.setProperty('--theme-statusbar-bg', colors.statusBarBackground);
  root.style.setProperty('--theme-statusbar-border', colors.statusBarBorder);
  root.style.setProperty('--theme-statusbar-text', colors.statusBarText);

  // ============ DIVIDER ============
  root.style.setProperty('--theme-divider', colors.divider);
  root.style.setProperty('--theme-divider-strong', colors.dividerStrong);

  // ============ COMPONENT: PREVIEW ============
  root.style.setProperty('--theme-preview-bg', colors.previewBg);
  root.style.setProperty('--theme-preview-device-border', colors.previewDeviceBorder);
  root.style.setProperty('--theme-preview-device-notch', colors.previewDeviceNotch);
  root.style.setProperty('--theme-preview-urlbar-bg', colors.previewUrlbarBg);

  // ============ SEMANTIC COLORS ============
  root.style.setProperty('--color-success', SEMANTIC_COLORS.success);
  root.style.setProperty('--color-success-hover', SEMANTIC_COLORS.successHover);
  root.style.setProperty('--color-success-subtle', SEMANTIC_COLORS.successSubtle);
  root.style.setProperty('--color-success-text', SEMANTIC_COLORS.successText);
  root.style.setProperty('--color-success-border', SEMANTIC_COLORS.successBorder);

  root.style.setProperty('--color-warning', SEMANTIC_COLORS.warning);
  root.style.setProperty('--color-warning-hover', SEMANTIC_COLORS.warningHover);
  root.style.setProperty('--color-warning-subtle', SEMANTIC_COLORS.warningSubtle);
  root.style.setProperty('--color-warning-text', SEMANTIC_COLORS.warningText);
  root.style.setProperty('--color-warning-border', SEMANTIC_COLORS.warningBorder);

  root.style.setProperty('--color-error', SEMANTIC_COLORS.error);
  root.style.setProperty('--color-error-hover', SEMANTIC_COLORS.errorHover);
  root.style.setProperty('--color-error-subtle', SEMANTIC_COLORS.errorSubtle);
  root.style.setProperty('--color-error-text', SEMANTIC_COLORS.errorText);
  root.style.setProperty('--color-error-border', SEMANTIC_COLORS.errorBorder);

  root.style.setProperty('--color-info', SEMANTIC_COLORS.info);
  root.style.setProperty('--color-info-hover', SEMANTIC_COLORS.infoHover);
  root.style.setProperty('--color-info-subtle', SEMANTIC_COLORS.infoSubtle);
  root.style.setProperty('--color-info-text', SEMANTIC_COLORS.infoText);
  root.style.setProperty('--color-info-border', SEMANTIC_COLORS.infoBorder);

  root.style.setProperty('--color-neutral', SEMANTIC_COLORS.neutral);
  root.style.setProperty('--color-neutral-hover', SEMANTIC_COLORS.neutralHover);
  root.style.setProperty('--color-neutral-subtle', SEMANTIC_COLORS.neutralSubtle);
  root.style.setProperty('--color-neutral-text', SEMANTIC_COLORS.neutralText);
  root.style.setProperty('--color-neutral-border', SEMANTIC_COLORS.neutralBorder);

  root.style.setProperty('--color-feature', SEMANTIC_COLORS.feature);
  root.style.setProperty('--color-feature-subtle', SEMANTIC_COLORS.featureSubtle);
  root.style.setProperty('--color-feature-text', SEMANTIC_COLORS.featureText);

  // Set data attribute for potential CSS selectors
  root.setAttribute('data-theme', theme.id);
}

// ============ Context ============

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ============ Provider ============

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && stored in THEMES) {
        return stored as ThemeId;
      }
    } catch {
      // localStorage might not be available
    }
    return DEFAULT_THEME;
  });

  // Get current theme object
  const currentTheme = THEMES[themeId];

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyThemeToDocument(currentTheme);
  }, [currentTheme]);

  // Set theme and persist to localStorage
  const setTheme = useCallback((newThemeId: ThemeId) => {
    setThemeId(newThemeId);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newThemeId);
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Reset to default theme
  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
  }, [setTheme]);

  // Create list of themes for iteration
  const themeList = useMemo(() => Object.values(THEMES), []);

  // Memoized context value
  const value = useMemo<ThemeContextValue>(() => ({
    currentTheme,
    themeId,
    setTheme,
    resetTheme,
    themes: THEMES,
    themeList,
  }), [currentTheme, themeId, setTheme, resetTheme, themeList]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ============ Hooks ============

/**
 * Use the theme context
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Use only theme selection
 * For components that just need to read/set the theme
 */
// eslint-disable-next-line react-refresh/only-export-components -- Context hook pattern
export function useThemeSelection() {
  const { themeId, setTheme, themeList } = useTheme();
  return { themeId, setTheme, themeList };
}
