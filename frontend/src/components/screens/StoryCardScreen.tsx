import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check, Download, Share2, AlertTriangle, Sparkles, Target, User, Lightbulb } from 'lucide-react';
import ColleeLogo from '@/components/ColleeLogo';

interface StoryCardScreenProps {
  onConfirm: () => void;
  onTweak: () => void;
}

const StoryCardScreen: React.FC<StoryCardScreenProps> = ({ onConfirm, onTweak }) => {
  // Mock data - in real app this would come from analysis
  // Framing intentionally avoids achievement-centric language
  const storyData = {
    angle: "Someone who notices the quiet things — and finds meaning in everyday moments",
    pillars: [
      "Caring for others through small, consistent actions",
      "Finding growth in routine and repetition",
      "Seeing what others tend to overlook"
    ],
    voice: {
      tone: "Honest and reflective",
      style: "You're at your best when you slow down and describe a single moment. Your writing feels genuine when you trust the details to carry the meaning."
    },
    distinct: "You don't need a big stage to show who you are. Your strength is in noticing — the small shifts, the unspoken needs, the things that happen when no one's watching. That kind of attention is rare.",
    cautions: [
      "Avoid summarizing your experiences — trust specific moments",
      "Don't feel pressure to explain what you 'learned' — let the reader discover it",
      "Watch out for downplaying your own perspective — your observations matter"
    ]
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background px-6 py-12">
      {/* Top Logo */}
      <motion.div 
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ColleeLogo size="sm" />
      </motion.div>

      <motion.div
        className="w-full max-w-content mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-display-sm text-foreground mb-2">
            Your Story Identity
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Here's what we discovered about you
          </p>
        </motion.div>

        {/* Story Cards */}
        <div className="space-y-6">
          {/* Application Angle */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-6 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">Application Angle</h3>
            </div>
            <p className="text-body-lg text-foreground leading-relaxed">
              "{storyData.angle}"
            </p>
          </motion.div>

          {/* Story Pillars */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-6 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">Story Pillars</h3>
            </div>
            <p className="text-body-sm text-muted-foreground mb-4">
              The themes that run through your experiences
            </p>
            <div className="space-y-3">
              {storyData.pillars.map((pillar, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-caption font-medium text-primary">{index + 1}</span>
                  </div>
                  <p className="text-body text-foreground">{pillar}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Voice Profile */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-6 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">Voice Profile</h3>
            </div>
            <div className="space-y-3">
              <div className="inline-block px-3 py-1.5 rounded-full bg-muted text-body-sm font-medium text-foreground">
                {storyData.voice.tone}
              </div>
              <p className="text-body text-muted-foreground leading-relaxed">
                {storyData.voice.style}
              </p>
            </div>
          </motion.div>

          {/* What Makes You Distinct */}
          <motion.div 
            variants={itemVariants}
            className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl border border-primary/20 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-heading-sm text-foreground">What Makes You Distinct</h3>
            </div>
            <p className="text-body-lg text-foreground leading-relaxed">
              {storyData.distinct}
            </p>
          </motion.div>

          {/* Topics to Be Careful About */}
          <motion.div 
            variants={itemVariants}
            className="bg-card rounded-2xl border border-border p-6 shadow-soft"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-accent-foreground" />
              </div>
              <h3 className="text-heading-sm text-foreground">Things to Watch</h3>
            </div>
            <div className="space-y-2">
              {storyData.cautions.map((caution, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2.5 flex-shrink-0" />
                  <p className="text-body text-muted-foreground">{caution}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Actions */}
        <motion.div 
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
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StoryCardScreen;
