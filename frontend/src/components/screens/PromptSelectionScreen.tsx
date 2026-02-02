import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface Prompt {
  id: string;
  text: string;
  wordLimit: number;
}

interface PromptSelectionScreenProps {
  collegeName: string;
  onBack: () => void;
  onSelectPrompt: (promptId: string) => void;
}

const availablePrompts: Prompt[] = [
  {
    id: '1',
    text: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it. If this sounds like you, then please share your story.',
    wordLimit: 650,
  },
  {
    id: '2',
    text: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
    wordLimit: 650,
  },
  {
    id: '3',
    text: 'Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?',
    wordLimit: 650,
  },
  {
    id: '4',
    text: 'Describe a problem you have solved or a problem you would like to solve. It can be an intellectual challenge, a research query, an ethical dilemma - anything of personal importance.',
    wordLimit: 650,
  },
  {
    id: '5',
    text: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.',
    wordLimit: 650,
  },
];

const PromptSelectionScreen: React.FC<PromptSelectionScreenProps> = ({
  collegeName,
  onBack,
  onSelectPrompt,
}) => {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Choose a prompt</h1>
            <p className="text-body text-muted-foreground">
              Select the essay prompt you'd like to work on for {collegeName}
            </p>
          </div>
        </motion.div>

        {/* Prompts List */}
        <div className="space-y-3">
          {availablePrompts.map((prompt, index) => (
            <motion.button
              key={prompt.id}
              onClick={() => setSelectedPrompt(prompt.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedPrompt === prompt.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/30'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedPrompt === prompt.id
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground'
                }`}>
                  {selectedPrompt === prompt.id && (
                    <Check className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-body text-foreground leading-relaxed mb-2">
                    {prompt.text}
                  </p>
                  <span className="text-body-sm text-muted-foreground">
                    {prompt.wordLimit} words max
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Continue Button */}
        {selectedPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="pt-4"
          >
            <Button
              variant="collee-accent"
              size="collee"
              onClick={() => onSelectPrompt(selectedPrompt)}
              className="w-full"
            >
              Continue with this prompt
            </Button>
          </motion.div>
        )}
      </div>
    </ColleeLayout>
  );
};

export default PromptSelectionScreen;
