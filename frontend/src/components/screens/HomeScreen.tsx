import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLogo from '@/components/ColleeLogo';
import { ArrowRight, Sparkles, Compass, PenLine } from 'lucide-react';

interface HomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onGetStarted, onLogin }) => {
  const steps = [
    {
      icon: Sparkles,
      title: 'Understand your story',
      description: 'Reflect on what matters most to you — your experiences, values, and voice.',
    },
    {
      icon: Compass,
      title: 'Find the right fit',
      description: 'Match your experiences to each prompt, so every essay feels intentional.',
    },
    {
      icon: PenLine,
      title: 'Write with confidence',
      description: 'Start from clarity, not a blank page. Know what you want to say before you write.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border-light">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <ColleeLogo size="sm" showText showTagline />
          <Button
            variant="ghost"
            onClick={onLogin}
            className="text-foreground-muted hover:text-foreground"
          >
            Log in
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-24">
        <section className="max-w-3xl mx-auto px-6 py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-display text-foreground mb-6 leading-tight">
              Figure out what you want to say<br />
              <span className="text-foreground-muted">before you start writing.</span>
            </h1>
            <p className="text-body-lg text-foreground-muted max-w-xl mx-auto mb-10 leading-relaxed">
              Collee helps you get clear on your story — so your essays feel natural, thoughtful, and true to who you are.
            </p>
            <Button
              variant="collee"
              size="collee"
              onClick={onGetStarted}
              className="shadow-soft-md"
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-heading text-foreground text-center mb-16">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <step.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-body font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Gentle Reassurance */}
        <section className="max-w-2xl mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-card rounded-2xl border border-card-border p-10 shadow-soft"
          >
            <p className="text-body text-foreground-muted mb-6 leading-relaxed">
              You already have everything you need to write great essays.<br />
              Collee just helps you see it clearly.
            </p>
            <Button
              variant="collee-accent"
              size="lg"
              onClick={onGetStarted}
            >
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-border-light">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <ColleeLogo size="xs" showText showTagline />
            <p className="text-caption text-foreground-subtle">
              Made for students, by people who remember the process.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HomeScreen;
