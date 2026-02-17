import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Download, Share2, AlertTriangle, Sparkles, Target, User, Lightbulb } from 'lucide-react';
import ColleeLogo from '@/components/ColleeLogo';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface StoryCardScreenProps {
  onConfirm: () => void;
  onTweak: () => void;
}

const StoryCardScreen: React.FC<StoryCardScreenProps> = ({ onConfirm, onTweak }) => {
  const storyIdentity = useQuery(api.storyIdentity.get, {});
  const [showCards, setShowCards] = useState(false);

  // Trigger card reveal after splash
  React.useEffect(() => {
    const timer = setTimeout(() => setShowCards(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const storyData = storyIdentity ? {
    angle: storyIdentity.angle,
    pillars: storyIdentity.pillars?.map((p: any) => p.theme) || [],
    voice: {
      tone: storyIdentity.voiceTone,
      style: storyIdentity.voiceStyle,
    },
    distinct: storyIdentity.distinct,
    cautions: storyIdentity.cautions || [],
  } : {
    angle: "Loading your story identity...",
    pillars: [],
    voice: { tone: "Loading...", style: "" },
    distinct: "",
    cautions: [],
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      {/* Splash reveal */}
      <AnimatePresence>
        {!showCards && (
          <m.div
            className="fixed inset-0 z-50 bg-background flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <m.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <m.div
                animate={{ y: [0, -4, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="mb-6"
              >
                <ColleeLogo size="md" />
              </m.div>
              <h2 className="font-display text-display-sm text-foreground">Your story is ready</h2>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Top Logo */}
      <m.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: showCards ? 1 : 0, y: showCards ? 0 : -10 }}
        transition={{ duration: 0.4 }}
      >
        <ColleeLogo size="sm" />
      </m.div>

      <m.div
        className="w-full max-w-content mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate={showCards ? "visible" : "hidden"}
      >
        {/* Header */}
        <m.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-display-sm text-foreground mb-2">
            Your Story Identity
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Here's what we discovered about you
          </p>
        </m.div>

        {/* Story Cards */}
        <div className="space-y-6">
          {/* Application Angle - editorial feel */}
          <m.div
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-8 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">Application Angle</h3>
            </div>
            <div className="relative pl-4">
              {/* Decorative quote marks */}
              <span className="absolute -left-1 -top-2 text-4xl font-display text-primary/15 select-none leading-none" aria-hidden="true">"</span>
              <p className="font-display italic text-body-lg text-foreground leading-relaxed">
                {storyData.angle}
              </p>
            </div>
          </m.div>

          {/* Story Pillars with timeline connector */}
          {storyData.pillars.length > 0 && (
            <m.div
              variants={itemVariants}
              className="bg-card rounded-2xl border border-border p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-heading-sm text-foreground">Story Pillars</h3>
              </div>
              <p className="text-body-sm text-muted-foreground mb-5">
                The themes that run through your experiences
              </p>
              <div className="relative">
                {/* Vertical timeline connector */}
                {storyData.pillars.length > 1 && (
                  <div className="absolute left-3 top-4 bottom-4 w-px bg-gradient-to-b from-primary/20 via-primary/10 to-transparent" aria-hidden="true" />
                )}
                <div className="space-y-4">
                  {storyData.pillars.map((pillar: string, index: number) => (
                    <div key={pillar} className="flex items-start gap-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10">
                        <span className="text-caption font-semibold text-primary">{index + 1}</span>
                      </div>
                      <p className="text-body text-foreground">{pillar}</p>
                    </div>
                  ))}
                </div>
              </div>
            </m.div>
          )}

          {/* Voice Profile */}
          <m.div
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-8 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">Voice Profile</h3>
            </div>
            <div className="space-y-3">
              {/* Tone badge with gradient bg */}
              <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/10 text-body-sm font-medium text-foreground">
                {storyData.voice.tone}
              </div>
              <p className="text-body text-muted-foreground leading-relaxed">
                {storyData.voice.style}
              </p>
            </div>
          </m.div>

          {/* What Makes You Distinct */}
          {storyData.distinct && (
            <m.div
              variants={itemVariants}
              className="bg-gradient-to-br from-primary/[0.06] via-secondary/[0.04] to-primary/[0.06] rounded-2xl border border-primary/20 p-8 shadow-glow"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-heading-sm text-foreground">What Makes You Distinct</h3>
              </div>
              <p className="font-display text-heading-sm text-foreground leading-relaxed">
                {storyData.distinct}
              </p>
            </m.div>
          )}

          {/* Topics to Be Careful About */}
          {storyData.cautions.length > 0 && (
            <m.div
              variants={itemVariants}
              className="bg-card rounded-2xl border border-border p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-accent-foreground" />
                </div>
                <h3 className="text-heading-sm text-foreground">Things to Watch</h3>
              </div>
              <div className="space-y-2">
                {storyData.cautions.map((caution: string) => (
                  <div key={caution} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 flex-shrink-0" />
                    <p className="text-body text-muted-foreground">{caution}</p>
                  </div>
                ))}
              </div>
            </m.div>
          )}
        </div>

        {/* Actions */}
        <m.div
          variants={itemVariants}
          className="mt-10 space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="collee-accent"
              size="collee"
              onClick={onConfirm}
              className="flex-1"
            >
              <Check className="w-5 h-5 mr-2" />
              This feels right
            </Button>
            <Button
              variant="collee-outline"
              size="collee"
              onClick={onTweak}
              className="flex-1"
            >
              I want to tweak this
            </Button>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Button variant="collee-ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="collee-ghost" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share link
            </Button>
          </div>
        </m.div>
      </m.div>
    </div>
  );
};

export default StoryCardScreen;
