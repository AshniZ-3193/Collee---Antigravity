import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import OnboardingWalkthrough, { useOnboardingState } from '@/components/OnboardingWalkthrough';
import { mapCollegesFromConvex } from '@/components/screens/workspace/dataTransforms';
import type { College, ExportData } from '@/components/screens/workspace/types';

import type { WorkspaceMode } from '@/components/hooks/useWorkspaceMode';
import AppSidebar from './AppSidebar';
import DashboardSection from './DashboardSection';
import type { DashboardSection as DashboardSectionType } from './types';
import { useDashboardData } from './useDashboardData';
import EssaysSection from '@/components/essays/EssaysSection';
import NotesSection from '@/components/notes/NotesSection';

interface DashboardShellProps {
  onAddCollege: () => void;
  onExport: (data: ExportData) => void;
  onEditStoryIdentity?: () => void;
  onLogoClick?: () => void;
  onLogout?: () => void;
  initialActiveEssay?: { collegeId: string; essayId: string } | null;
  onInitialActiveEssayApplied?: () => void;
  mode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
}

const LEGACY_PENDING_ESSAY_KEY = 'collee-pending-active-essay';

const DashboardShell: React.FC<DashboardShellProps> = ({
  onAddCollege,
  onExport,
  onEditStoryIdentity,
  onLogout,
  initialActiveEssay,
  onInitialActiveEssayApplied,
  mode,
  onModeChange,
}) => {
  const convexCollegesResult = useQuery(api.colleges.list, {});
  const storyIdentityData = useQuery(api.storyIdentity.get, {});
  const experienceUsagesResult = useQuery(api.experienceBank.getUsages);

  const colleges: College[] = useMemo(() => mapCollegesFromConvex(convexCollegesResult), [convexCollegesResult]);
  const dashboardData = useDashboardData(colleges);

  const [activeSection, setActiveSection] = useState<DashboardSectionType>('dashboard');
  const [activeEssay, setActiveEssay] = useState<{ collegeId: string; essayId: string } | null>(null);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string | null>(null);

  const {
    showOnboarding,
    setShowOnboarding,
    completeOnboarding,
    resetOnboarding,
  } = useOnboardingState();

  useEffect(() => {
    if (!initialActiveEssay) return;

    const matchesCurrent =
      activeEssay?.collegeId === initialActiveEssay.collegeId &&
      activeEssay?.essayId === initialActiveEssay.essayId;
    if (!matchesCurrent) {
      setActiveEssay(initialActiveEssay);
      setSelectedCollegeId(initialActiveEssay.collegeId);
      setActiveSection('essays');
    }

    onInitialActiveEssayApplied?.();
  }, [
    initialActiveEssay,
    activeEssay?.collegeId,
    activeEssay?.essayId,
    onInitialActiveEssayApplied,
  ]);

  const handleOpenEssays = (collegeId: string, essayId?: string) => {
    const college = colleges.find((item) => item.id === collegeId);
    const targetEssayId = essayId ?? college?.essays[0]?.id;
    if (targetEssayId) {
      try {
        window.localStorage.setItem(
          LEGACY_PENDING_ESSAY_KEY,
          JSON.stringify({ collegeId, essayId: targetEssayId }),
        );
      } catch (error) {
        console.error('Failed to persist pending essay selection:', error);
      }
      onModeChange('legacy');
      return;
    }

    setSelectedCollegeId(collegeId);
    setActiveEssay(null);
    setActiveSection('essays');
  };

  useEffect(() => {
    if (activeSection !== 'essays') return;
    if (!selectedCollegeId) return;

    const selectedCollege = colleges.find((college) => college.id === selectedCollegeId);
    if (!selectedCollege || selectedCollege.essays.length === 0) {
      return;
    }

    const hasValidActiveEssay =
      activeEssay?.collegeId === selectedCollege.id &&
      selectedCollege.essays.some((essay) => essay.id === activeEssay.essayId);

    if (!hasValidActiveEssay) {
      setActiveEssay({
        collegeId: selectedCollege.id,
        essayId: selectedCollege.essays[0].id,
      });
    }
  }, [activeSection, selectedCollegeId, colleges, activeEssay]);

  useEffect(() => {
    if (activeSection !== 'essays') return;
    if (activeEssay) return;
    if (selectedCollegeId) return;
    if (colleges.length === 0) return;

    const firstCollege = colleges[0];
    setSelectedCollegeId(firstCollege.id);
    if (firstCollege.essays.length > 0) {
      setActiveEssay({ collegeId: firstCollege.id, essayId: firstCollege.essays[0].id });
    }
  }, [activeSection, activeEssay, selectedCollegeId, colleges]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onAddCollege={onAddCollege}
        onLogout={onLogout}
        onEditStoryIdentity={onEditStoryIdentity}
        onTakeTour={resetOnboarding}
        mode={mode}
        onModeChange={onModeChange}
        notesEnabled={true}
      />

      <main className="flex-1 overflow-hidden">
        {activeSection === 'dashboard' && (
          <DashboardSection
            data={dashboardData}
            onAddCollege={onAddCollege}
            onOpenEssays={handleOpenEssays}
          />
        )}

        {activeSection === 'essays' && (
          <EssaysSection
            colleges={colleges}
            activeEssay={activeEssay}
            setActiveEssay={setActiveEssay}
            selectedCollegeId={selectedCollegeId}
            onAddCollege={onAddCollege}
            onExport={onExport}
            storyIdentityData={storyIdentityData}
            experienceUsagesResult={experienceUsagesResult}
          />
        )}

        {activeSection === 'notes' && <NotesSection colleges={colleges} />}
      </main>

      <OnboardingWalkthrough
        isOpen={showOnboarding}
        mode="dashboard"
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default DashboardShell;
