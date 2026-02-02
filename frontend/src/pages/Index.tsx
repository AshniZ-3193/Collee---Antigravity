import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomeScreen from '@/components/screens/HomeScreen';
import { AuthScreen } from '@/components/screens/AuthScreen';
import WelcomeScreen from '@/components/screens/WelcomeScreen';
import ResumeScreen from '@/components/screens/ResumeScreen';
import AcademicScreen from '@/components/screens/AcademicScreen';
import DiagnosticsScreen from '@/components/screens/DiagnosticsScreen';
import WritingToneScreen from '@/components/screens/WritingToneScreen';
import PersonalLensScreen from '@/components/screens/PersonalLensScreen';
import ReflectionScreen from '@/components/screens/ReflectionScreen';
import LoadingScreen from '@/components/screens/LoadingScreen';
import StoryCardScreen from '@/components/screens/StoryCardScreen';
import AddCollegeScreen from '@/components/screens/AddCollegeScreen';
import ExportScreen from '@/components/screens/ExportScreen';
import ShareViewScreen from '@/components/screens/ShareViewScreen';
import ColleeWorkspace from '@/components/screens/ColleeWorkspace';
import EditStoryIdentityScreen from '@/components/screens/EditStoryIdentityScreen';

type Screen =
  | 'home'
  | 'auth'
  | 'welcome'
  | 'resume'
  | 'academic'
  | 'diagnostics'
  | 'writing-tone'
  | 'personal-lens'
  | 'reflection'
  | 'loading'
  | 'story-card'
  | 'workspace'
  | 'add-college'
  | 'export'
  | 'share-view'
  | 'edit-story-identity';

// Check if Story Identity exists (one-time onboarding detection)
const hasStoryIdentity = (): boolean => {
  try {
    const stored = localStorage.getItem('collee_story_identity');
    if (stored) {
      const data = JSON.parse(stored);
      // Verify it has the required structure
      return data && data.experiences && data.pillars;
    }
    return false;
  } catch {
    return false;
  }
};

// Mark Story Identity as complete after onboarding
const markOnboardingComplete = () => {
  const defaultIdentity = {
    experiences: [
      { id: 'exp1', name: 'Teaching Grandma Technology', tags: ['empathy', 'patience', 'family'] },
      { id: 'exp2', name: 'Robotics Competition Failure', tags: ['resilience', 'leadership', 'teamwork'] },
      { id: 'exp3', name: 'Starting the Coding Club', tags: ['leadership', 'community', 'initiative'] },
    ],
    pillars: [
      { id: 'p1', theme: 'Bridging worlds through technology' },
      { id: 'p2', theme: 'Learning through failure' },
      { id: 'p3', theme: 'Community building' },
    ],
    voicePreferences: {
      tone: 'conversational',
      reminders: [
        'Emphasize learning over achievement',
        'Use specific moments over abstract claims',
        'Let authenticity come through',
      ],
    },
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem('collee_story_identity', JSON.stringify(defaultIdentity));
};

const Index = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  // Navigate to home (for logo click in workspace)
  const handleGoHome = () => {
    navigateTo('home');
  };

  // Handle login - check if onboarding is needed
  const handleLogin = () => {
    if (hasStoryIdentity()) {
      // Skip onboarding, go directly to workspace (College Map)
      navigateTo('workspace');
    } else {
      // First-time user, start onboarding
      navigateTo('welcome');
    }
  };

  // Handle signup - always start fresh onboarding
  const handleSignup = () => {
    // Clear any existing story identity to ensure fresh onboarding
    localStorage.removeItem('collee_story_identity');
    navigateTo('welcome');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    markOnboardingComplete();
    navigateTo('workspace');
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentScreen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={currentScreen === 'workspace' ? 'h-screen' : ''}
      >
        {/* PUBLIC HOME SCREEN */}
        {currentScreen === 'home' && (
          <HomeScreen 
            onGetStarted={() => navigateTo('auth')}
            onLogin={() => navigateTo('auth')}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen 
            onLogin={handleLogin}
            onSignup={handleSignup}
            onLogoClick={handleGoHome}
          />
        )}
        
        {/* ONBOARDING FLOW - Only runs if no Story Identity exists */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen onStart={() => navigateTo('resume')} />
        )}
        
        {currentScreen === 'resume' && (
          <ResumeScreen 
            onContinue={() => navigateTo('academic')}
            onBack={() => navigateTo('welcome')}
          />
        )}
        
        {currentScreen === 'academic' && (
          <AcademicScreen 
            onContinue={() => navigateTo('diagnostics')}
            onBack={() => navigateTo('resume')}
          />
        )}
        
        {currentScreen === 'diagnostics' && (
          <DiagnosticsScreen 
            onContinue={() => navigateTo('writing-tone')}
            onBack={() => navigateTo('academic')}
          />
        )}
        
        {currentScreen === 'writing-tone' && (
          <WritingToneScreen 
            onContinue={() => navigateTo('personal-lens')}
            onBack={() => navigateTo('diagnostics')}
          />
        )}
        
        {currentScreen === 'personal-lens' && (
          <PersonalLensScreen 
            onContinue={() => navigateTo('reflection')}
            onBack={() => navigateTo('writing-tone')}
          />
        )}
        
        {currentScreen === 'reflection' && (
          <ReflectionScreen 
            onContinue={() => navigateTo('loading')}
            onBack={() => navigateTo('personal-lens')}
          />
        )}
        
        {currentScreen === 'loading' && (
          <LoadingScreen onComplete={() => navigateTo('story-card')} />
        )}
        
        {currentScreen === 'story-card' && (
          <StoryCardScreen 
            onConfirm={handleOnboardingComplete}
            onTweak={() => navigateTo('diagnostics')}
          />
        )}

        {/* MAIN APP - College Map + Essay Editor */}
        {currentScreen === 'workspace' && (
          <ColleeWorkspace 
            onAddCollege={() => navigateTo('add-college')}
            onExport={() => navigateTo('export')}
            onEditStoryIdentity={() => navigateTo('edit-story-identity')}
            onLogoClick={handleGoHome}
            onLogout={handleGoHome}
          />
        )}

        {currentScreen === 'add-college' && (
          <AddCollegeScreen 
            onBack={() => navigateTo('workspace')}
            onAddCollege={(collegeId) => {
              // The AddCollegeScreen handles multi-college flow internally
              // This callback is called for each college added, but navigation
              // is handled by onBack when all colleges are complete
              console.log('College added:', collegeId);
            }}
            onComplete={() => navigateTo('workspace')}
          />
        )}

        {currentScreen === 'export' && (
          <ExportScreen 
            essayTitle="Personal Statement"
            collegeName="Stanford University"
            wordCount={542}
            onBack={() => navigateTo('workspace')}
          />
        )}

        {currentScreen === 'share-view' && (
          <ShareViewScreen 
            collegeName="Stanford University"
            promptText="Describe an experience where you had to make a difficult choice."
            essayContent="The moment I realized I wanted to pursue computer science was not in a classroom — it was in my grandmother's kitchen.\n\nShe had just received a new smartphone from my parents, and the look of confusion and frustration on her face was something I'll never forget."
            wordCount={542}
            authorName="Student"
          />
        )}

        {/* EDIT STORY IDENTITY - Modular editing without re-onboarding */}
        {currentScreen === 'edit-story-identity' && (
          <EditStoryIdentityScreen 
            onBack={() => navigateTo('workspace')}
            onSave={() => navigateTo('workspace')}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
