import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useConvexAuth } from 'convex/react';
import { useQuery } from 'convex/react';
import { useClerk } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
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

const Index = () => {
  const { isAuthenticated: isConvexAuth } = useConvexAuth();
  const { isAuthenticated: isUserStored, isLoading: isUserLoading } = useStoreUserEffect();
  const { signOut } = useClerk();

  // Only query profile if user is authenticated and stored
  const profile = useQuery(
    api.userProfile.get,
    isUserStored ? {} : "skip"
  );
  const storyIdentity = useQuery(
    api.storyIdentity.get,
    isUserStored ? {} : "skip"
  );

  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  // Auto-navigate based on auth state
  useEffect(() => {
    if (!isConvexAuth && currentScreen !== 'home' && currentScreen !== 'auth') {
      setCurrentScreen('home');
    }
  }, [isConvexAuth]);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleGoHome = () => {
    navigateTo('home');
  };

  // Handle successful login
  const handleLogin = () => {
    // Auth state will update via Clerk - check if onboarding is complete
    if (storyIdentity) {
      navigateTo('workspace');
    } else if (profile?.onboardingComplete) {
      navigateTo('loading'); // Re-generate story identity
    } else {
      navigateTo('welcome');
    }
  };

  // Handle successful signup
  const handleSignup = () => {
    navigateTo('welcome');
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    navigateTo('workspace');
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    navigateTo('home');
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
            onLogin={() => {
              if (isUserStored) {
                // Already logged in, route appropriately
                if (storyIdentity) {
                  navigateTo('workspace');
                } else {
                  navigateTo('welcome');
                }
              } else {
                navigateTo('auth');
              }
            }}
          />
        )}

        {currentScreen === 'auth' && (
          <AuthScreen
            onLogin={handleLogin}
            onSignup={handleSignup}
            onLogoClick={handleGoHome}
          />
        )}

        {/* ONBOARDING FLOW */}
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

        {/* MAIN APP */}
        {currentScreen === 'workspace' && (
          <ColleeWorkspace
            onAddCollege={() => navigateTo('add-college')}
            onExport={() => navigateTo('export')}
            onEditStoryIdentity={() => navigateTo('edit-story-identity')}
            onLogoClick={handleGoHome}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'add-college' && (
          <AddCollegeScreen
            onBack={() => navigateTo('workspace')}
            onAddCollege={(collegeId) => {
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
            essayContent="The moment I realized I wanted to pursue computer science was not in a classroom — it was in my grandmother's kitchen."
            wordCount={542}
            authorName="Student"
          />
        )}

        {/* EDIT STORY IDENTITY */}
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
