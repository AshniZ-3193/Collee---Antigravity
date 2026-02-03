import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useConvexAuth } from 'convex/react';
import { useQuery } from 'convex/react';
import { useClerk, useAuth } from '@clerk/clerk-react';
import { api } from '../../convex/_generated/api';
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
import HomeScreen from '@/components/screens/HomeScreen';
import AuthLoadingScreen from '@/components/screens/AuthLoadingScreen';
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
  | 'auth-loading'
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
  const { isAuthenticated: isConvexAuth, isLoading: isConvexLoading } = useConvexAuth();
  const { isSignedIn, isLoaded: isClerkLoaded } = useAuth();
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

  const [currentScreen, setCurrentScreen] = useState<Screen>('auth-loading');
  const hasNavigatedAfterAuth = useRef(false);

  const isProfileLoading =
    isSignedIn && isUserStored && (profile === undefined || storyIdentity === undefined);
  const isAuthGateLoading =
    !isClerkLoaded ||
    isConvexLoading ||
    isUserLoading ||
    (isSignedIn && !isUserStored) ||
    isProfileLoading;

  // Watch for auth state changes and navigate accordingly
  useEffect(() => {
    // Don't do anything while loading core auth/state.
    if (isAuthGateLoading) {
      if (currentScreen === 'home' || currentScreen === 'auth') {
        setCurrentScreen('auth-loading');
      }
      return;
    }

    if (!isSignedIn) {
      if (currentScreen === 'auth-loading') {
        setCurrentScreen('home');
      }

      // If user signed out, go back to home
      if (currentScreen !== 'home' && currentScreen !== 'auth') {
        hasNavigatedAfterAuth.current = false;
        setCurrentScreen('home');
      }

      return;
    }

    // If user is authenticated and on home or auth screen, navigate based on their profile
    // This handles both: 1) completing auth on auth screen, 2) returning from OAuth redirect to home
    if (isSignedIn && isUserStored && (currentScreen === 'auth' || currentScreen === 'home' || currentScreen === 'auth-loading') && !hasNavigatedAfterAuth.current) {
      hasNavigatedAfterAuth.current = true;

      if (storyIdentity || profile?.onboardingComplete) {
        setCurrentScreen('workspace');
      } else {
        setCurrentScreen('welcome');
      }
    }
  }, [
    isAuthGateLoading,
    isSignedIn,
    isUserStored,
    currentScreen,
    storyIdentity,
    profile,
  ]);

  // Reset the navigation flag only when going to auth screen (user explicitly starting auth flow)
  // Don't reset when going to home - that would cause re-navigation for intentional home visits
  useEffect(() => {
    if (currentScreen === 'auth') {
      hasNavigatedAfterAuth.current = false;
    }
  }, [currentScreen]);

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleGoHome = () => {
    navigateTo('home');
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
        {currentScreen === 'auth-loading' && (
          <AuthLoadingScreen />
        )}

        {currentScreen === 'home' && (
          <HomeScreen
            onGetStarted={() => navigateTo('auth')}
            isLoggedIn={Boolean(isClerkLoaded && isSignedIn)}
            onLogin={() => {
              if (isClerkLoaded && isSignedIn && isUserStored) {
                // If data is still loading, keep the user on home until the auth
                // effect routes them to the correct screen.
                if (profile === undefined || storyIdentity === undefined) {
                  return;
                }

                // User is already logged in, route appropriately
                if (storyIdentity || profile?.onboardingComplete) {
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
