import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import OnboardingWalkthrough, { useOnboardingState } from '@/components/OnboardingWalkthrough';
import { mapCollegesFromConvex } from '@/components/screens/workspace/dataTransforms';
import type { College, ExportData } from '@/components/screens/workspace/types';

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
  onLogout?: () => void;
  initialActiveEssay?: { collegeId: string; essayId: string } | null;
  onInitialActiveEssayApplied?: () => void;
}

const DashboardShell: React.FC<DashboardShellProps> = ({
  onAddCollege,
  onExport,
  onEditStoryIdentity,
  onLogout,
  initialActiveEssay,
  onInitialActiveEssayApplied,
}) => {
  const convexCollegesResult = useQuery(api.colleges.list, {});
  const storyIdentityData = useQuery(api.storyIdentity.get, {});
  const experienceUsagesResult = useQuery(api.experienceBank.getUsages);

  const { user } = useUser();
  const colleges: College[] = useMemo(() => mapCollegesFromConvex(convexCollegesResult), [convexCollegesResult]);
  const dashboardData = useDashboardData(colleges, user?.firstName || undefined);

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

    setSelectedCollegeId(collegeId);
    if (targetEssayId) {
      setActiveEssay({ collegeId, essayId: targetEssayId });
    } else {
      setActiveEssay(null);
    }
    setActiveSection('essays');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onAddCollege={onAddCollege}
        onLogout={onLogout}
        onEditStoryIdentity={onEditStoryIdentity}
        onTakeTour={resetOnboarding}
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
            onBackToSchools={() => setActiveSection('dashboard')}
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
