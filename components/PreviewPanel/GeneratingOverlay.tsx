/**
 * GeneratingOverlay - Engaging loading screen during code generation
 *
 * Shows rotating tips, features, and promotions while waiting.
 */
import React, { useState, useEffect, memo } from 'react';
import {
  Loader2,
  Wand2,
  Bot,
  Eye,
  GitBranch,
  MousePointer2,
  Brain,
  Wrench,
  Smartphone,
  Lightbulb,
  RefreshCw,
  Target,
  MessageSquare,
  Heart,
  Megaphone,
  Sparkles,
  Zap,
  Code2,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { getPromotionCycle, type Promotion } from '../../data/promotions';

// Icon mapping
const ICONS: Record<string, LucideIcon> = {
  Wand2,
  Bot,
  Eye,
  GitBranch,
  MousePointer2,
  Brain,
  Wrench,
  Smartphone,
  Lightbulb,
  RefreshCw,
  Target,
  MessageSquare,
  Heart,
  Megaphone,
  Sparkles,
  Zap,
  Code2,
};

interface GeneratingOverlayProps {
  isGenerating: boolean;
  isFixing?: boolean;
}

export const GeneratingOverlay = memo(function GeneratingOverlay({
  isGenerating,
  isFixing = false,
}: GeneratingOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [promotions] = useState(() => getPromotionCycle());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  // Navigate to previous
  const goToPrev = () => {
    setAutoPlay(false); // Stop auto-play when user navigates
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + promotions.length) % promotions.length);
      setIsTransitioning(false);
    }, 150);
  };

  // Navigate to next
  const goToNext = () => {
    setAutoPlay(false); // Stop auto-play when user navigates
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
      setIsTransitioning(false);
    }, 150);
  };

  // Cycle through promotions (only if autoPlay is enabled)
  useEffect(() => {
    if (!isGenerating) {
      setCurrentIndex(0);
      setAutoPlay(true);
      return;
    }

    if (!autoPlay) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % promotions.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [isGenerating, promotions.length, autoPlay]);

  if (!isGenerating) return null;

  const current = promotions[currentIndex];
  const IconComponent = current.icon ? ICONS[current.icon] || Sparkles : Sparkles;

  // Type-based styling using CSS variables
  const getTypeStyles = (type: Promotion['type']): {
    bg: React.CSSProperties;
    border: React.CSSProperties;
    icon: React.CSSProperties;
    title: React.CSSProperties;
    badge: React.CSSProperties;
    badgeText: string;
  } => {
    switch (type) {
      case 'feature':
        return {
          bg: { backgroundColor: 'var(--color-info-subtle)' },
          border: { border: '1px solid var(--color-info-border)' },
          icon: { color: 'var(--color-info)' },
          title: { color: 'var(--color-info)' },
          badge: { backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' },
          badgeText: 'Feature',
        };
      case 'tip':
        return {
          bg: { backgroundColor: 'var(--color-warning-subtle)' },
          border: { border: '1px solid var(--color-warning-border)' },
          icon: { color: 'var(--color-warning)' },
          title: { color: 'var(--color-warning)' },
          badge: { backgroundColor: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
          badgeText: 'Pro Tip',
        };
      case 'creator':
        return {
          bg: { backgroundColor: 'var(--theme-ai-secondary-subtle)' },
          border: { border: '1px solid var(--theme-ai-secondary)' },
          icon: { color: 'var(--theme-ai-secondary)' },
          title: { color: 'var(--theme-ai-secondary)' },
          badge: { backgroundColor: 'var(--theme-ai-secondary-subtle)', color: 'var(--theme-ai-secondary)' },
          badgeText: 'FluidFlow',
        };
      case 'ad':
        return {
          bg: { backgroundColor: 'var(--color-success-subtle)' },
          border: { border: '1px solid var(--color-success-border)' },
          icon: { color: 'var(--color-success)' },
          title: { color: 'var(--color-success)' },
          badge: { backgroundColor: 'var(--color-success-subtle)', color: 'var(--color-success)' },
          badgeText: 'Sponsored',
        };
      default:
        return {
          bg: { backgroundColor: 'var(--theme-glass-200)' },
          border: { border: '1px solid var(--theme-border)' },
          icon: { color: 'var(--theme-text-muted)' },
          title: { color: 'var(--theme-text-secondary)' },
          badge: { backgroundColor: 'var(--theme-glass-200)', color: 'var(--theme-text-secondary)' },
          badgeText: '',
        };
    }
  };

  const styles = getTypeStyles(current.type);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-md" style={{ backgroundColor: 'var(--theme-overlay)' }}>
      {/* Main spinner */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full animate-spin" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: 'var(--theme-accent-subtle)', borderTopColor: 'var(--theme-accent)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full animate-spin" style={{ borderWidth: '4px', borderStyle: 'solid', borderColor: 'var(--theme-ai-accent-subtle)', borderBottomColor: 'var(--theme-ai-accent)', animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-pulse" style={{ color: 'var(--theme-accent)' }} />
        </div>
      </div>

      {/* Status text */}
      <p className="text-lg font-medium mb-8 animate-pulse" style={{ color: 'var(--theme-accent)' }}>
        {isFixing ? 'Adapting Layout...' : 'Constructing Interface...'}
      </p>

      {/* Promotion card with navigation */}
      <div className="flex items-center gap-3 max-w-lg mx-4">
        {/* Previous button */}
        <button
          onClick={goToPrev}
          className="p-2 rounded-full transition-all shrink-0"
          style={{ backgroundColor: 'var(--theme-glass-100)', color: 'var(--theme-text-muted)' }}
          title="Previous"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Card */}
        <div
          className={`flex-1 p-5 rounded-xl transition-all duration-300 ${
            isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{ ...styles.bg, ...styles.border }}
        >
        {/* Badge */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={styles.badge}>
            {styles.badgeText}
          </span>
          <div className="flex items-center gap-1">
            {promotions.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{
                  backgroundColor: i === currentIndex ? 'var(--theme-text-secondary)' : 'var(--theme-glass-300)',
                  transform: i === currentIndex ? 'scale(1.25)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={styles.bg}>
            <IconComponent className="w-5 h-5" style={styles.icon} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1" style={styles.title}>{current.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-text-muted)' }}>{current.description}</p>
            {current.link && (
              <a
                href={current.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-xs hover:underline"
                style={styles.icon}
              >
                {current.linkText || 'Learn more'}
                <Zap className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        </div>

        {/* Next button */}
        <button
          onClick={goToNext}
          className="p-2 rounded-full transition-all shrink-0"
          style={{ backgroundColor: 'var(--theme-glass-100)', color: 'var(--theme-text-muted)' }}
          title="Next"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress hint */}
      <p className="mt-6 text-xs" style={{ color: 'var(--theme-text-dim)' }}>
        AI is crafting your interface • This usually takes 10-30 seconds
      </p>
    </div>
  );
});

export default GeneratingOverlay;
