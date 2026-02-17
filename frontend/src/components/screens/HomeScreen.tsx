import React from 'react';
import { m } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLogo from '@/components/ColleeLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { ArrowRight, Sparkles, Compass, PenLine } from 'lucide-react';

interface HomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onLogoClick?: () => void;
  isLoggedIn?: boolean;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onGetStarted, onLogin, onLogoClick, isLoggedIn = false }) => {
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
      {/* Header with gradient bottom border */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <ColleeLogo size="sm" showText showTagline onClick={onLogoClick} />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              onClick={onLogin}
              className="text-foreground-muted hover:text-foreground"
            >
              {isLoggedIn ? 'Continue to dashboard' : 'Log in'}
            </Button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </header>

      {/* Hero Section */}
      <main className="pt-24">
        <section className="max-w-3xl mx-auto px-6 py-24 text-center relative">
          {/* Subtle radial gradient glow behind headline */}
          <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" aria-hidden="true" />

          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <h1 className="font-display text-display text-foreground mb-6 leading-tight">
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
            >
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </m.div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-6 py-20">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="font-display text-heading text-foreground text-center mb-16">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Connecting line between steps (desktop only) */}
              <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10" aria-hidden="true" />

              {steps.map((step, index) => (
                <m.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="text-center relative"
                >
                  {/* Oversized faint step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[5rem] font-display font-bold text-primary/[0.04] leading-none select-none pointer-events-none" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-5 relative">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-body font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed">
                    {step.description}
                  </p>
                </m.div>
              ))}
            </div>
          </m.div>
        </section>

        {/* Gentle Reassurance */}
        <section className="max-w-2xl mx-auto px-6 py-20 text-center">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-warm rounded-2xl border border-card-border p-10 shadow-soft relative overflow-hidden"
          >
            {/* Decorative sparkle accent */}
            <Sparkles className="absolute top-4 right-4 w-5 h-5 text-secondary/20" aria-hidden="true" />

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
          </m.div>
        </section>

        {/* Footer with gradient fade line */}
        <footer className="max-w-5xl mx-auto px-6 py-12">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-12" />
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
