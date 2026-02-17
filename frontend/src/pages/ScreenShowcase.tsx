import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import ResumeScreen from '@/components/screens/ResumeScreen';
import AcademicScreen from '@/components/screens/AcademicScreen';
import DiagnosticsScreen from '@/components/screens/DiagnosticsScreen';
import WritingToneScreen from '@/components/screens/WritingToneScreen';
import PersonalLensScreen from '@/components/screens/PersonalLensScreen';
import ReflectionScreen from '@/components/screens/ReflectionScreen';
import LoadingScreen from '@/components/screens/LoadingScreen';
import StoryCardScreen from '@/components/screens/StoryCardScreen';

type Screen = 
  | 'welcome'
  | 'resume'
  | 'academic'
  | 'diagnostics'
  | 'writing-tone'
  | 'personal-lens'
  | 'reflection'
  | 'loading'
  | 'story-card';

const screens: { id: Screen; label: string }[] = [
  { id: 'welcome', label: '1. Welcome' },
  { id: 'resume', label: '2. Resume/Activities' },
  { id: 'academic', label: '3. Academic Direction' },
  { id: 'diagnostics', label: '4. Diagnostics' },
  { id: 'writing-tone', label: '5. Writing Tone' },
  { id: 'personal-lens', label: '6. Personal Lens' },
  { id: 'reflection', label: '7. Reflection' },
  { id: 'loading', label: '8. Loading' },
  { id: 'story-card', label: '9. Story Card' },
];

const ScreenShowcase: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('welcome');

  const screenContent = useMemo(() => {
    const noop = () => {};

    switch (activeScreen) {
      case 'welcome':
        return <WelcomeScreen onStart={noop} />;
      case 'resume':
        return <ResumeScreen onContinue={noop} onBack={noop} />;
      case 'academic':
        return <AcademicScreen onContinue={noop} onBack={noop} />;
      case 'diagnostics':
        return <DiagnosticsScreen onContinue={noop} onBack={noop} />;
      case 'writing-tone':
        return <WritingToneScreen onContinue={noop} onBack={noop} />;
      case 'personal-lens':
        return <PersonalLensScreen onContinue={noop} onBack={noop} />;
      case 'reflection':
        return <ReflectionScreen onContinue={noop} onBack={noop} />;
      case 'loading':
        return <LoadingScreen onComplete={noop} />;
      case 'story-card':
        return <StoryCardScreen onConfirm={noop} onTweak={noop} />;
      default:
        return <WelcomeScreen onStart={noop} />;
    }
  }, [activeScreen]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border p-4 flex-shrink-0">
        <div className="mb-6">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Back to App
          </Link>
          <h2 className="text-heading-sm text-foreground mt-4 mb-2">Screen Showcase</h2>
          <p className="text-body-sm text-muted-foreground">
            Click to view each screen
          </p>
        </div>
        
        <div className="space-y-1">
          {screens.map((screen) => (
            <Button
              key={screen.id}
              variant={activeScreen === screen.id ? "secondary" : "ghost"}
              className="w-full justify-start text-left h-auto py-2 px-3"
              onClick={() => setActiveScreen(screen.id)}
            >
              <span className="text-body-sm">{screen.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Screen Preview */}
      <div className="flex-1 overflow-auto">
        {screenContent}
      </div>
    </div>
  );
};

export default ScreenShowcase;
