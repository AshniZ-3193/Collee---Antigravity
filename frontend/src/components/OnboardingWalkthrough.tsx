import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, MapPin, FileText, ArrowLeft, HelpCircle, Heart, Calendar, Sparkles } from 'lucide-react';

type HighlightArea =
  | 'colleges'
  | 'college-card'
  | 'essay-editor'
  | 'context-panel'
  | 'back-button'
  | 'personal-lens'
  | 'prompt-above-editor'
  | 'calendar-toggle'
  | 'dismiss-suggestion'
  | 'sidebar-nav'
  | 'dashboard-progress'
  | 'dashboard-deadlines'
  | 'essays-section'
  | 'essay-toolbar';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  highlightArea: HighlightArea;
  icon: React.ReactNode;
}

const legacyOnboardingSteps: OnboardingStep[] = [
  {
    id: 'colleges',
    title: 'Your Colleges',
    description: 'This is your home base. All the colleges you\'re applying to live here, along with their essays.',
    highlightArea: 'colleges',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: 'calendar-toggle',
    title: 'Calendar View',
    description: 'Toggle between card view and calendar view to see your deadlines at a glance.',
    highlightArea: 'calendar-toggle',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 'college-card',
    title: 'College Cards',
    description: 'Click any card to see its essays. Each shows your progress and upcoming deadlines.',
    highlightArea: 'college-card',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'prompt-above-editor',
    title: 'Your Prompt',
    description: 'The essay prompt is displayed right above where you write, so it\'s always visible while you work.',
    highlightArea: 'prompt-above-editor',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'essay-editor',
    title: 'Essay Editor',
    description: 'This is where you\'ll write. Your work saves automatically, so just focus on your words.',
    highlightArea: 'essay-editor',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'personal-lens',
    title: 'Personal Lens',
    description: 'Capture moments, values, and observations here. Click "Generate story suggestions" on any note to get personalized writing ideas.',
    highlightArea: 'personal-lens',
    icon: <Heart className="w-5 h-5" />,
  },
  {
    id: 'context-panel',
    title: 'Story Suggestions',
    description: 'Personalized suggestions appear here. Don\'t like one? Click the X to dismiss it. You can always generate more from your Personal Lens.',
    highlightArea: 'context-panel',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'back-button',
    title: 'Getting Back',
    description: 'Click "Your Colleges" or the logo anytime to return here. You\'re always one click away.',
    highlightArea: 'back-button',
    icon: <ArrowLeft className="w-5 h-5" />,
  },
];

const dashboardOnboardingSteps: OnboardingStep[] = [
  {
    id: 'sidebar-nav',
    title: 'Sidebar Navigation',
    description: 'Use this rail to move between Dashboard, Essays, and Notes.',
    highlightArea: 'sidebar-nav',
    icon: <MapPin className="w-5 h-5" />,
  },
  {
    id: 'dashboard-progress',
    title: 'Progress Ring',
    description: 'Track required essay completion at a glance.',
    highlightArea: 'dashboard-progress',
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    id: 'dashboard-deadlines',
    title: 'Deadlines',
    description: 'Upcoming deadlines and progress are grouped here.',
    highlightArea: 'dashboard-deadlines',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: 'essays-section',
    title: 'Essays Section',
    description: 'Open the Essays area to continue writing and managing drafts.',
    highlightArea: 'essays-section',
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'essay-toolbar',
    title: 'AI Toolbar',
    description: 'Use Strategy, Feedback, Reuse, and Comments while writing.',
    highlightArea: 'essay-toolbar',
    icon: <Sparkles className="w-5 h-5" />,
  },
];

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  mode?: 'legacy' | 'dashboard';
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STORAGE_KEY = 'collee-onboarding-completed';
const HIGHLIGHT_PADDING = 8;

const TOUR_TARGET_SELECTORS: Record<HighlightArea, string[]> = {
  colleges: ['[data-tour="colleges-panel"]'],
  'calendar-toggle': ['[data-tour="calendar-toggle"]'],
  'college-card': ['[data-tour="college-card"]'],
  'prompt-above-editor': ['[data-tour="prompt-above-editor"]'],
  'essay-editor': ['[data-tour="essay-editor"]'],
  'personal-lens': ['[data-tour="personal-lens-tab"]'],
  'context-panel': ['[data-tour="context-panel"]', '[data-tour="show-guidance-button"]'],
  'dismiss-suggestion': ['[data-tour="dismiss-suggestion"]'],
  'back-button': ['[data-tour="back-to-colleges"]', '[data-tour="logo-button"]'],
  'sidebar-nav': ['[data-tour="sidebar-nav"]'],
  'dashboard-progress': ['[data-tour="dashboard-progress"]'],
  'dashboard-deadlines': ['[data-tour="dashboard-deadlines"]'],
  'essays-section': ['[data-tour="essays-section"]'],
  'essay-toolbar': ['[data-tour="essay-toolbar"]'],
};

const FALLBACK_HIGHLIGHT_STYLES: Record<HighlightArea, React.CSSProperties> = {
  colleges: { left: 0, top: 48, width: 320, height: 'calc(100% - 48px)' },
  'calendar-toggle': { left: 200, top: 56, width: 80, height: 36 },
  'college-card': { left: 16, top: 140, width: 288, height: 180 },
  'prompt-above-editor': { left: 340, top: 140, width: 'calc(100% - 680px)', height: 96 },
  'essay-editor': { left: 320, top: 240, width: 'calc(100% - 640px)', height: 'calc(100% - 288px)' },
  'personal-lens': { left: 380, top: 100, width: 120, height: 32 },
  'context-panel': { left: 'calc(100% - 320px)', top: 48, width: 320, height: 'calc(100% - 48px)' },
  'dismiss-suggestion': { left: 'calc(100% - 320px)', top: 190, width: 280, height: 120 },
  'back-button': { left: 336, top: 56, width: 160, height: 44 },
  'sidebar-nav': { left: 8, top: 8, width: 56, height: 'calc(100% - 16px)' },
  'dashboard-progress': { left: 160, top: 180, width: 240, height: 240 },
  'dashboard-deadlines': { left: 120, top: 420, width: 'calc(100% - 220px)', height: 220 },
  'essays-section': { left: 8, top: 118, width: 56, height: 40 },
  'essay-toolbar': { left: 340, top: 100, width: 'calc(100% - 420px)', height: 56 },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface RectCandidate {
  rect: DOMRect;
  visibleArea: number;
  visibleRatio: number;
}

export const useOnboardingState = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
    setHasCompletedOnboarding(completed);
    // Auto-trigger for first-time users
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    setHasCompletedOnboarding(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    setShowOnboarding(true);
  };

  return {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  };
};

const OnboardingWalkthrough: React.FC<OnboardingWalkthroughProps> = ({
  isOpen,
  mode = 'legacy',
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 384, height: 260 });

  const steps = mode === 'dashboard' ? dashboardOnboardingSteps : legacyOnboardingSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // Reset to first step when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(0);
    }
  }, [currentStep, steps.length]);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const findTargetRect = useCallback((area: HighlightArea): DOMRect | null => {
    if (typeof document === 'undefined') return null;

    const selectors = TOUR_TARGET_SELECTORS[area] ?? [];
    for (const selector of selectors) {
      const candidates: RectCandidate[] = [];
      const elements = Array.from(document.querySelectorAll(selector));
      for (const element of elements) {
        const htmlElement = element as HTMLElement;
        if (htmlElement.getClientRects().length === 0) continue;
        const rect = htmlElement.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;

        const visibleWidth = Math.max(
          0,
          Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0),
        );
        const visibleHeight = Math.max(
          0,
          Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0),
        );
        const visibleArea = visibleWidth * visibleHeight;
        const totalArea = rect.width * rect.height;
        const visibleRatio = totalArea > 0 ? visibleArea / totalArea : 0;

        if (visibleArea > 0) {
          candidates.push({ rect, visibleArea, visibleRatio });
        }
      }

      if (candidates.length === 0) {
        continue;
      }

      if (area === 'college-card') {
        const mostlyVisible = candidates
          .filter((candidate) => candidate.visibleRatio >= 0.6)
          .sort((a, b) => a.rect.top - b.rect.top);

        if (mostlyVisible.length > 0) {
          return mostlyVisible[0].rect;
        }
      }

      const bestCandidate = candidates.sort((a, b) => {
        if (b.visibleArea !== a.visibleArea) return b.visibleArea - a.visibleArea;
        return a.rect.top - b.rect.top;
      })[0];

      if (bestCandidate) {
        return bestCandidate.rect;
      }
    }

    return null;
  }, []);

  const refreshTargetRect = useCallback(() => {
    if (!isOpen) return;
    setTargetRect(findTargetRect(step.highlightArea));
  }, [findTargetRect, isOpen, step.highlightArea]);

  useEffect(() => {
    if (!isOpen) return;
    refreshTargetRect();

    let frameCount = 0;
    let rafId = 0;
    const syncDuringLayoutAnimations = () => {
      refreshTargetRect();
      frameCount += 1;
      if (frameCount < 20) {
        rafId = window.requestAnimationFrame(syncDuringLayoutAnimations);
      }
    };
    rafId = window.requestAnimationFrame(syncDuringLayoutAnimations);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [isOpen, currentStep, refreshTargetRect]);

  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      window.requestAnimationFrame(refreshTargetRect);
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen, refreshTargetRect]);

  useEffect(() => {
    if (!isOpen || !tooltipRef.current) return;
    const rect = tooltipRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setTooltipSize({ width: rect.width, height: rect.height });
    }
  }, [isOpen, currentStep, targetRect]);

  const highlightStyle = useMemo<React.CSSProperties>(() => {
    if (!targetRect || typeof window === 'undefined') {
      return FALLBACK_HIGHLIGHT_STYLES[step.highlightArea];
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = clamp(targetRect.left - HIGHLIGHT_PADDING, 8, viewportWidth - 8);
    const top = clamp(targetRect.top - HIGHLIGHT_PADDING, 8, viewportHeight - 8);
    const width = clamp(
      targetRect.width + HIGHLIGHT_PADDING * 2,
      24,
      viewportWidth - left - 8,
    );
    const height = clamp(
      targetRect.height + HIGHLIGHT_PADDING * 2,
      24,
      viewportHeight - top - 8,
    );

    return { left, top, width, height };
  }, [step.highlightArea, targetRect]);

  const tooltipStyle = useMemo<React.CSSProperties>(() => {
    if (typeof window === 'undefined') {
      return {};
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;
    const gap = 18;
    const width = tooltipSize.width;
    const height = tooltipSize.height;
    const maxLeft = Math.max(margin, viewportWidth - width - margin);
    const maxTop = Math.max(margin, viewportHeight - height - margin);

    if (!targetRect) {
      return {
        left: clamp((viewportWidth - width) / 2, margin, maxLeft),
        top: clamp((viewportHeight - height) / 3, margin, maxTop),
      };
    }

    let left = targetRect.right + gap;
    if (left + width > viewportWidth - margin) {
      left = targetRect.left - width - gap;
    }
    if (left < margin) {
      left = targetRect.left + (targetRect.width - width) / 2;
    }

    const centeredTop = targetRect.top + targetRect.height / 2 - height / 2;
    const top = clamp(centeredTop, margin, maxTop);

    return {
      left: clamp(left, margin, maxLeft),
      top,
    };
  }, [targetRect, tooltipSize.height, tooltipSize.width]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-foreground/20" />

          {/* Highlight cutout effect */}
          <motion.div
            className="absolute border-2 border-primary rounded-xl bg-background/10 shadow-lg"
            style={highlightStyle}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
          </motion.div>

          {/* Tooltip Card */}
          <motion.div
            ref={tooltipRef}
            className="absolute max-w-sm"
            style={tooltipStyle}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="bg-card rounded-2xl shadow-xl border border-border p-5">
              {/* Header with icon */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-body font-semibold text-foreground">{step.title}</h3>
                  <p className="text-body-sm text-muted-foreground mt-1 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 my-4">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-primary'
                        : index < currentStep
                        ? 'bg-primary/40'
                        : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSkip}
                  className="text-body-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
                >
                  Skip tour
                </button>
                
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handlePrevious}
                      className="text-muted-foreground"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back
                    </Button>
                  )}
                  <Button
                    variant="collee"
                    size="sm"
                    onClick={handleNext}
                  >
                    {isLastStep ? 'Get started' : 'Next'}
                    {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-lg bg-card/90 hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Help button component for persistent access
export const HelpButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
    >
      <HelpCircle className="w-4 h-4" />
      <span className="text-body-sm">Help</span>
    </button>
  );
};

export default OnboardingWalkthrough;
