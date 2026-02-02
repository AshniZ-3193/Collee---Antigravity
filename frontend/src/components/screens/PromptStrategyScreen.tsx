import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Lightbulb, Check, Sparkles } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface Strategy {
  id: string;
  title: string;
  description: string;
  angle: string;
}

interface PromptStrategyScreenProps {
  promptText: string;
  onBack: () => void;
  onSelectStrategy: (strategyId: string) => void;
  onStartWriting: () => void;
}

const strategies: Strategy[] = [
  {
    id: 'personal-growth',
    title: 'Personal growth arc',
    description: 'Show how a specific experience changed your perspective or values',
    angle: 'Focus on the transformation, not just the event',
  },
  {
    id: 'unexpected-connection',
    title: 'Unexpected connection',
    description: 'Link two seemingly unrelated parts of your life to reveal something unique',
    angle: 'Let the contrast create the story',
  },
  {
    id: 'quiet-moment',
    title: 'A quiet moment',
    description: 'Zoom in on a small, specific moment that reveals something larger about you',
    angle: 'Details matter more than drama',
  },
  {
    id: 'challenging-belief',
    title: 'Challenging a belief',
    description: 'Explore a time when your thinking evolved or you changed your mind',
    angle: 'Show intellectual curiosity and openness',
  },
];

const PromptStrategyScreen: React.FC<PromptStrategyScreenProps> = ({
  promptText,
  onBack,
  onSelectStrategy,
  onStartWriting,
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  return (
    <ColleeLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-body-sm">Back</span>
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/15 mb-4">
              <Lightbulb className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Pick an approach</h1>
            <p className="text-body text-muted-foreground max-w-md mx-auto">
              Based on your story, here are some directions that might work well for this essay
            </p>
          </div>
        </motion.div>

        {/* Selected Prompt Summary */}
        <motion.div
          className="p-4 rounded-xl bg-muted/50 border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <p className="text-body-sm text-muted-foreground line-clamp-2">
            {promptText}
          </p>
        </motion.div>

        {/* Strategies */}
        <div className="space-y-3">
          {strategies.map((strategy, index) => (
            <motion.button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-secondary bg-secondary/5'
                  : 'border-border bg-card hover:border-secondary/30'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05, duration: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedStrategy === strategy.id
                    ? 'border-secondary bg-secondary'
                    : 'border-muted-foreground'
                }`}>
                  {selectedStrategy === strategy.id && (
                    <Check className="w-3 h-3 text-secondary-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-body font-medium text-foreground mb-1">
                    {strategy.title}
                  </h3>
                  <p className="text-body-sm text-muted-foreground mb-2">
                    {strategy.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-body-sm text-secondary">
                    <Sparkles className="w-3 h-3" />
                    <span>{strategy.angle}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Start Writing Button */}
        {selectedStrategy && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-4 space-y-3"
          >
            <Button
              variant="collee-accent"
              size="collee"
              onClick={onStartWriting}
              className="w-full"
            >
              Start writing
            </Button>
            <p className="text-body-sm text-center text-muted-foreground">
              You can always change direction later
            </p>
          </motion.div>
        )}
      </div>
    </ColleeLayout>
  );
};

export default PromptStrategyScreen;
