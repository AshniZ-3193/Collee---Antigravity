import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, MapPin, FileText, Lightbulb, ArrowLeft, HelpCircle, Heart, Calendar, Sparkles } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  highlightArea: 'colleges' | 'college-card' | 'essay-editor' | 'context-panel' | 'back-button' | 'personal-lens' | 'prompt-above-editor' | 'calendar-toggle' | 'dismiss-suggestion';
  icon: React.ReactNode;
}

const onboardingSteps: OnboardingStep[] = [
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

interface OnboardingWalkthroughProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ONBOARDING_STORAGE_KEY = 'collee-onboarding-completed';

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
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
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

  const step = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // Calculate highlight position based on step
  const getHighlightStyle = (): React.CSSProperties => {
    switch (step.highlightArea) {
      case 'colleges':
        return { left: '0', top: '48px', width: '320px', height: 'calc(100% - 48px)' };
      case 'calendar-toggle':
        return { left: '200px', top: '56px', width: '80px', height: '36px' };
      case 'college-card':
        return { left: '16px', top: '140px', width: '288px', height: '180px' };
      case 'prompt-above-editor':
        return { left: '340px', top: '140px', width: 'calc(100% - 680px)', height: '80px' };
      case 'essay-editor':
        return { left: '320px', top: '240px', width: 'calc(100% - 640px)', height: 'calc(100% - 288px)' };
      case 'personal-lens':
        return { left: '380px', top: '100px', width: '120px', height: '32px' };
      case 'context-panel':
        return { right: '0', top: '48px', width: '320px', height: 'calc(100% - 48px)' };
      case 'dismiss-suggestion':
        return { right: '24px', top: '200px', width: '280px', height: '100px' };
      case 'back-button':
        return { left: '336px', top: '56px', width: '140px', height: '44px' };
      default:
        return {};
    }
  };

  // Position the tooltip near the highlight
  const getTooltipPosition = (): string => {
    switch (step.highlightArea) {
      case 'colleges':
        return 'left-[340px] top-1/3';
      case 'calendar-toggle':
        return 'left-[300px] top-[100px]';
      case 'college-card':
        return 'left-[340px] top-[200px]';
      case 'prompt-above-editor':
        return 'left-1/2 -translate-x-1/2 top-[240px]';
      case 'essay-editor':
        return 'left-1/2 -translate-x-1/2 top-1/3';
      case 'personal-lens':
        return 'left-[520px] top-[140px]';
      case 'context-panel':
        return 'right-[340px] top-1/3';
      case 'dismiss-suggestion':
        return 'right-[340px] top-[220px]';
      case 'back-button':
        return 'left-[340px] top-[120px]';
      default:
        return 'left-1/2 -translate-x-1/2 top-1/3';
    }
  };

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
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]" />

          {/* Highlight cutout effect */}
          <motion.div
            className="absolute border-2 border-primary rounded-xl bg-background/10 shadow-lg"
            style={getHighlightStyle()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Pulsing ring effect */}
            <div className="absolute inset-0 rounded-xl border-2 border-primary/50 animate-pulse" />
          </motion.div>

          {/* Tooltip Card */}
          <motion.div
            className={`absolute ${getTooltipPosition()} max-w-sm`}
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
                {onboardingSteps.map((_, index) => (
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
