import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import ColleeLayout from '@/components/ColleeLayout';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

import type {
  AddCollegeStep,
  AddCollegeScreenProps,
  ApplicationType,
  EnsureSchoolContentResponse,
  EssayPrompt,
  SelectedCollegeConfig,
} from './add-college/types';
import AddCollegeHeader from './add-college/AddCollegeHeader';
import ApplicationTypeStep from './add-college/ApplicationTypeStep';
import PromptsStep from './add-college/PromptsStep';
import SelectCollegesStep from './add-college/SelectCollegesStep';
import { defaultApplicationTypes } from './add-college/data';
import {
  createEmptyPrompt,
  filterPromptsForUser,
  inferRelevantMajors,
  normalizeApplicationTypes,
  toGlobalCollegeId,
} from './add-college/utils';
import { useCollegeSelection } from './add-college/useCollegeSelection';
import { usePromptEditor } from './add-college/usePromptEditor';

const AddCollegeScreen: React.FC<AddCollegeScreenProps> = ({
  onBack,
  onAddCollege,
  onComplete,
}) => {
  const addCollegeMutation = useMutation(api.colleges.add);
  const ensureSchoolContentAction = useAction(api.ai.ensureSchoolContent.ensure);
  const userProfile = useQuery(api.userProfile.get, {});
  const [isSearchingPrompts, setIsSearchingPrompts] = useState(false);
  const [isSearchingDeadlines, setIsSearchingDeadlines] = useState(false);
  const [deadlineSearchError, setDeadlineSearchError] = useState<string | null>(null);
  const [promptSearchError, setPromptSearchError] = useState<string | null>(null);
  const [qualityStatusMessage, setQualityStatusMessage] = useState<string | null>(null);
  const [isAutoAdding, setIsAutoAdding] = useState(false);
  const [step, setStep] = useState<AddCollegeStep>('select');
  const [appTypeOptionsByCollegeId, setAppTypeOptionsByCollegeId] = useState<Record<string, ApplicationType[] | null>>({});
  const [promptsByCollegeId, setPromptsByCollegeId] = useState<Record<string, EssayPrompt[] | null>>({});
  
  // For multi-college flow: track app types for each selected college
  const [collegeConfigs, setCollegeConfigs] = useState<SelectedCollegeConfig[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
 
  const {
    searchQuery,
    setSearchQuery,
    trimmedSearchQuery,
    selectedColleges,
    selectedCollegesCount,
    filteredColleges,
    showAddCustom,
    customCollegeId,
    customIsSelected,
    setGlobalColleges,
    getCollegeById,
    toggleCollegeSelection,
    handleAddCustomCollege,
    removeSelectedCollege,
    getSelectedCollegeConfigs,
  } = useCollegeSelection();

  const userInterests = userProfile?.primaryInterests || [];
  const {
    prompts,
    setPrompts,
    showAllPrompts,
    setShowAllPrompts,
    hiddenPromptCount,
    displayPrompts,
    validPromptCount,
    addPrompt,
    removePrompt,
    updatePrompt,
    resetPrompts,
  } = usePromptEditor({ userInterests });

  // Get current college being configured
  const currentConfig = collegeConfigs[currentConfigIndex];
  const currentCollegeId = currentConfig?.collegeId;
  const currentCollegeName = currentConfig?.collegeName;
  const currentCollegeData = currentConfig
    ? getCollegeById(currentConfig.collegeId)
    : null;
  const currentAppTypeOptions = currentConfig
    ? appTypeOptionsByCollegeId[currentConfig.collegeId]
    : undefined;
  const currentAvailableAppTypes = currentAppTypeOptions && currentAppTypeOptions.length > 0
    ? currentAppTypeOptions
    : currentCollegeData?.applicationTypes || defaultApplicationTypes;
  const currentPromptsFromSearch = currentConfig
    ? promptsByCollegeId[currentConfig.collegeId]
    : undefined;
  const autoAddGuardRef = useRef<Set<string>>(new Set());

  const canProceedToApplicationType = selectedCollegesCount > 0;
  const canProceedToPrompts = currentConfig?.applicationType !== '';
  const deadlineSearchAttempted = currentAppTypeOptions !== undefined;
  const noDeadlinesFound = deadlineSearchAttempted && (currentAppTypeOptions?.length ?? 0) === 0;
  const promptSearchAttempted = currentPromptsFromSearch !== undefined;
  const noPromptsFound = promptSearchAttempted && (currentPromptsFromSearch?.length ?? 0) === 0;

  const mapFetchedPrompts = useCallback((searchedPrompts: EnsureSchoolContentResponse['prompts']) => {
    const mappedPrompts: EssayPrompt[] = searchedPrompts.map((prompt, index) => ({
      id: `searched-${index}`,
      promptText: prompt.text,
      promptType: prompt.promptType || '',
      limitValue: prompt.wordCountMax || 250,
      isOptional: prompt.isOptional || false,
      targetProgram: prompt.targetProgram || undefined,
      relevantMajors: prompt.relevantMajors || undefined,
    }));
    return mappedPrompts.map((prompt) => {
      if (prompt.relevantMajors && prompt.relevantMajors.length > 0) return prompt;
      const inferred = inferRelevantMajors(prompt);
      return inferred.length > 0 ? { ...prompt, relevantMajors: inferred } : prompt;
    });
  }, []);

  const canAddCollege = !isSearchingPrompts && (
    validPromptCount > 0 || noPromptsFound || !!promptSearchError
  );

  useEffect(() => {
    setQualityStatusMessage(null);
  }, [step, currentCollegeId]);

  const addCollegeWithPrompts = useCallback(async (
    config: SelectedCollegeConfig,
    promptList: EssayPrompt[],
    preEnsured?: EnsureSchoolContentResponse | null,
  ) => {
    const validPrompts = promptList
      .filter(p => p.promptText.trim() && p.limitValue > 0)
      .map(p => ({
        text: p.promptText.trim(),
        wordCountMax: p.limitValue,
        isOptional: p.isOptional,
        promptType: p.promptType || undefined,
        targetProgram: p.targetProgram || undefined,
        relevantMajors: p.relevantMajors || undefined,
      }));

    try {
      let ensured: EnsureSchoolContentResponse | null = preEnsured || null;
      if (!ensured && validPrompts.length > 0) {
        try {
          ensured = await ensureSchoolContentAction({
            query: config.collegeName || 'Unknown',
            schoolSlug: config.schoolSlug,
            seedPrompts: validPrompts,
            seedApplicationTypes: config.deadline
              ? [
                  {
                    value: config.applicationType || "application",
                    label: config.applicationType || "Application",
                    deadline: config.deadline,
                  },
                ]
              : [],
          });
        } catch (error) {
          console.error("Global content verification seed failed:", error);
        }
      }

      await addCollegeMutation({
        name: config.collegeName || 'Unknown',
        schoolSlug: ensured?.schoolSlug || config.schoolSlug,
        applicationType: config.applicationType,
        deadline: config.deadline,
        sourceQualityStatus: ensured?.qualityStatus || config.sourceQualityStatus,
        sourceQualityScore: ensured?.qualityScore || config.sourceQualityScore,
        sourceVerifiedAt: ensured?.qualityStatus === "verified" ? Date.now() : config.sourceVerifiedAt,
        prompts: validPrompts.map((prompt) => ({
          text: prompt.text,
          wordCountMax: prompt.wordCountMax,
          isOptional: prompt.isOptional,
          promptType: prompt.promptType,
        })),
      });
      onAddCollege(config.collegeId || 'custom');
      return true;
    } catch (e) {
      console.error("Failed to add college:", e);
      return false;
    }
  }, [addCollegeMutation, ensureSchoolContentAction, onAddCollege]);

  useEffect(() => {
    if (step !== 'application-type' || !currentCollegeId || !currentCollegeName) return;
    if (currentAppTypeOptions !== undefined) return;

    let cancelled = false;
    const loadDeadlines = async () => {
      setIsSearchingDeadlines(true);
      setDeadlineSearchError(null);
      try {
        const ensured = await ensureSchoolContentAction({
          query: currentCollegeName,
          schoolSlug: currentConfig?.schoolSlug,
        });
        if (cancelled) return;

        const normalized = normalizeApplicationTypes(ensured?.applicationTypes || []);

        setAppTypeOptionsByCollegeId((prev) => ({
          ...prev,
          [currentCollegeId]: normalized,
        }));
        setCollegeConfigs((prev) => {
          const next = [...prev];
          const target = next[currentConfigIndex];
          if (!target) return prev;
          next[currentConfigIndex] = {
            ...target,
            collegeName: ensured?.canonicalName || target.collegeName,
            schoolSlug: ensured?.schoolSlug || target.schoolSlug,
            sourceQualityStatus: ensured?.qualityStatus || target.sourceQualityStatus,
            sourceQualityScore: ensured?.qualityScore || target.sourceQualityScore,
            sourceVerifiedAt: ensured?.qualityStatus === "verified" ? Date.now() : target.sourceVerifiedAt,
          };
          return next;
        });
        setQualityStatusMessage(
          ensured?.qualityStatus === "verified"
            ? "Data verified from trusted admissions sources."
            : ensured?.qualityStatus === "needs_review"
              ? "Data has source conflicts and needs review."
              : "Showing provisional data while verification continues."
        );

        const resolvedGlobalId = toGlobalCollegeId(ensured?.schoolSlug || currentConfig?.schoolSlug || currentCollegeName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
        setGlobalColleges((prev) => ({
          ...prev,
          [resolvedGlobalId]: {
            id: resolvedGlobalId,
            name: ensured?.canonicalName || currentCollegeName,
            location: "Global school",
            applicationTypes: normalized,
            schoolSlug: ensured?.schoolSlug || currentConfig?.schoolSlug,
            qualityStatus: ensured?.qualityStatus,
            qualityScore: ensured?.qualityScore,
          },
        }));

        if (ensured?.status === "enriching" && normalized.length === 0) {
          setDeadlineSearchError("Still enriching this college. Showing default options for now.");
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to ensure school content for deadlines:", e);
          const message = e instanceof Error && e.message
            ? e.message
            : "Couldn't load global school data. Showing default options.";
          setDeadlineSearchError(message);
          setAppTypeOptionsByCollegeId((prev) => ({
            ...prev,
            [currentCollegeId]: [],
          }));
        }
      } finally {
        if (!cancelled) setIsSearchingDeadlines(false);
      }
    };

    loadDeadlines();
    return () => {
      cancelled = true;
    };
  }, [
    step,
    currentCollegeId,
    currentCollegeName,
    currentConfig?.schoolSlug,
    currentConfigIndex,
    currentAppTypeOptions,
    ensureSchoolContentAction,
    setGlobalColleges,
  ]);

  useEffect(() => {
    if (step !== 'prompts' || !currentCollegeId || !currentCollegeName) return;
    if (currentPromptsFromSearch !== undefined) {
      if (currentPromptsFromSearch.length > 0) {
        setPrompts(currentPromptsFromSearch);
      } else {
        resetPrompts();
      }
      return;
    }

    let cancelled = false;
    const loadPrompts = async () => {
      setIsSearchingPrompts(true);
      setPromptSearchError(null);
      try {
        const ensured = await ensureSchoolContentAction({
          query: currentCollegeName,
          schoolSlug: currentConfig?.schoolSlug,
        });
        if (cancelled) return;
        const promptsWithMajors = mapFetchedPrompts(ensured?.prompts || []);
        const normalizedAppTypes = normalizeApplicationTypes(ensured?.applicationTypes || []);

        setCollegeConfigs((prev) => {
          const next = [...prev];
          const target = next[currentConfigIndex];
          if (!target) return prev;
          next[currentConfigIndex] = {
            ...target,
            collegeName: ensured?.canonicalName || target.collegeName,
            schoolSlug: ensured?.schoolSlug || target.schoolSlug,
            sourceQualityStatus: ensured?.qualityStatus || target.sourceQualityStatus,
            sourceQualityScore: ensured?.qualityScore || target.sourceQualityScore,
            sourceVerifiedAt: ensured?.qualityStatus === "verified" ? Date.now() : target.sourceVerifiedAt,
          };
          return next;
        });
        setQualityStatusMessage(
          ensured?.qualityStatus === "verified"
            ? "Data verified from trusted admissions sources."
            : ensured?.qualityStatus === "needs_review"
              ? "Data has source conflicts and needs review."
              : "Showing provisional data while verification continues."
        );
        if (normalizedAppTypes.length > 0) {
          setAppTypeOptionsByCollegeId((prev) => ({
            ...prev,
            [currentCollegeId]: normalizedAppTypes,
          }));
        }

        setPrompts(promptsWithMajors.length > 0
          ? promptsWithMajors
          : [createEmptyPrompt()]
        );
        setPromptsByCollegeId((prev) => ({
          ...prev,
          [currentCollegeId]: promptsWithMajors,
        }));

        const userInterests = userProfile?.primaryInterests || [];
        const promptsForUser = filterPromptsForUser(promptsWithMajors, userInterests);
        const autoAddPrompts = promptsForUser.length > 0 ? promptsForUser : promptsWithMajors;

        if (autoAddPrompts.length > 0 && !autoAddGuardRef.current.has(currentCollegeId)) {
          autoAddGuardRef.current.add(currentCollegeId);
          setIsAutoAdding(true);
          const success = await addCollegeWithPrompts({
            collegeId: currentCollegeId,
            collegeName: ensured?.canonicalName || currentCollegeName,
            applicationType: currentConfig?.applicationType || '',
            deadline: currentConfig?.deadline || '',
            schoolSlug: ensured?.schoolSlug || currentConfig?.schoolSlug,
            sourceQualityStatus: ensured?.qualityStatus,
            sourceQualityScore: ensured?.qualityScore,
            sourceVerifiedAt: ensured?.qualityStatus === "verified" ? Date.now() : undefined,
          }, autoAddPrompts, ensured);
          setIsAutoAdding(false);

          if (success) {
            if (currentConfigIndex < collegeConfigs.length - 1) {
              setCurrentConfigIndex(prev => prev + 1);
              resetPrompts();
            } else {
              onComplete();
            }
          } else {
            autoAddGuardRef.current.delete(currentCollegeId);
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to ensure school content for prompts:", e);
          const message = e instanceof Error && e.message
            ? e.message
            : "Couldn't load global school prompts. You can add them manually.";
          setPromptSearchError(message);
          resetPrompts();
          setPromptsByCollegeId((prev) => ({
            ...prev,
            [currentCollegeId]: [],
          }));
        }
      } finally {
        if (!cancelled) setIsSearchingPrompts(false);
      }
    };

    loadPrompts();
    return () => {
      cancelled = true;
    };
  }, [
    step,
    currentCollegeId,
    currentCollegeName,
    currentConfig,
    currentConfig?.schoolSlug,
    currentConfigIndex,
    collegeConfigs.length,
    currentPromptsFromSearch,
    addCollegeWithPrompts,
    mapFetchedPrompts,
    onComplete,
    ensureSchoolContentAction,
    setPrompts,
    userProfile?.primaryInterests,
    resetPrompts,
  ]);

  const handleContinueToApplicationType = () => {
    if (canProceedToApplicationType) {
      const configs = getSelectedCollegeConfigs();
      setCollegeConfigs(configs);
      setCurrentConfigIndex(0);
      setStep('application-type');
    }
  };

  const handleSelectApplicationType = (appTypeValue: string) => {
    const appType = currentAvailableAppTypes.find(t => t.value === appTypeValue);
    if (appType) {
      setCollegeConfigs(prev => {
        const newConfigs = [...prev];
        newConfigs[currentConfigIndex] = {
          ...newConfigs[currentConfigIndex],
          applicationType: appType.value,
          deadline: appType.deadline,
        };
        return newConfigs;
      });
    }
  };

  const handleContinueToNextCollegeOrPrompts = () => {
    if (currentConfigIndex < collegeConfigs.length - 1) {
      setCurrentConfigIndex(prev => prev + 1);
    } else {
      setCurrentConfigIndex(0);
      setStep('prompts');
    }
  };

  const handleContinueToPrompts = () => {
    if (canProceedToPrompts) {
      handleContinueToNextCollegeOrPrompts();
    }
  };

  const handleAddCollegeAndContinue = async () => {
    if (canAddCollege) {
      const success = await addCollegeWithPrompts(
        {
          collegeId: currentConfig?.collegeId || 'custom',
          collegeName: currentConfig?.collegeName || 'Unknown',
          applicationType: currentConfig?.applicationType || '',
          deadline: currentConfig?.deadline || '',
          schoolSlug: currentConfig?.schoolSlug,
          sourceQualityStatus: currentConfig?.sourceQualityStatus,
          sourceQualityScore: currentConfig?.sourceQualityScore,
          sourceVerifiedAt: currentConfig?.sourceVerifiedAt,
        },
        prompts
      );

      if (!success) return;

      if (currentConfigIndex < collegeConfigs.length - 1) {
        setCurrentConfigIndex(prev => prev + 1);
        resetPrompts();
      } else {
        onComplete();
      }
    }
  };

  const handleBack = () => {
    if (step === 'prompts') {
      if (currentConfigIndex > 0) {
        // Go back to previous college's prompts
        setCurrentConfigIndex(prev => prev - 1);
        resetPrompts();
      } else {
        // Go back to application type for last college
        setCurrentConfigIndex(collegeConfigs.length - 1);
        setStep('application-type');
      }
    } else if (step === 'application-type') {
      if (currentConfigIndex > 0) {
        // Go back to previous college's app type
        setCurrentConfigIndex(prev => prev - 1);
      } else {
        // Go back to college selection
        setStep('select');
        setCollegeConfigs([]);
        setCurrentConfigIndex(0);
      }
    } else {
      onBack();
    }
  };

  return (
    <ColleeLayout>
      <div className="space-y-6">
        <AddCollegeHeader
          step={step}
          currentConfig={currentConfig}
          currentConfigIndex={currentConfigIndex}
          collegeConfigsLength={collegeConfigs.length}
          onBack={handleBack}
        />

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <SelectCollegesStep
              selectedColleges={selectedColleges}
              getCollegeById={getCollegeById}
              onRemoveSelectedCollege={removeSelectedCollege}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              filteredColleges={filteredColleges}
              onToggleCollegeSelection={toggleCollegeSelection}
              showAddCustom={showAddCustom}
              customCollegeId={customCollegeId}
              customIsSelected={customIsSelected}
              trimmedSearchQuery={trimmedSearchQuery}
              onAddCustomCollege={handleAddCustomCollege}
              canProceedToApplicationType={canProceedToApplicationType}
              selectedCollegesCount={selectedCollegesCount}
              onContinue={handleContinueToApplicationType}
            />
          ) : step === 'application-type' ? (
            <ApplicationTypeStep
              currentConfig={currentConfig}
              currentConfigIndex={currentConfigIndex}
              collegeConfigsLength={collegeConfigs.length}
              currentAvailableAppTypes={currentAvailableAppTypes}
              isSearchingDeadlines={isSearchingDeadlines}
              deadlineSearchError={deadlineSearchError}
              noDeadlinesFound={noDeadlinesFound}
              qualityStatusMessage={qualityStatusMessage}
              canProceedToPrompts={canProceedToPrompts}
              onSelectApplicationType={handleSelectApplicationType}
              onContinue={handleContinueToPrompts}
              nextCollegeName={collegeConfigs[currentConfigIndex + 1]?.collegeName}
            />
          ) : (
            <PromptsStep
              currentConfig={currentConfig}
              currentConfigIndex={currentConfigIndex}
              collegeConfigsLength={collegeConfigs.length}
              isAutoAdding={isAutoAdding}
              isSearchingPrompts={isSearchingPrompts}
              promptSearchError={promptSearchError}
              noPromptsFound={noPromptsFound}
              qualityStatusMessage={qualityStatusMessage}
              hiddenPromptCount={hiddenPromptCount}
              showAllPrompts={showAllPrompts}
              onToggleShowAll={() => setShowAllPrompts(!showAllPrompts)}
              displayPrompts={displayPrompts}
              totalPromptCount={prompts.length}
              onRemovePrompt={removePrompt}
              onUpdatePrompt={updatePrompt}
              onAddPrompt={addPrompt}
              canAddCollege={canAddCollege}
              onAddCollegeAndContinue={handleAddCollegeAndContinue}
            />
          )}
        </AnimatePresence>
      </div>
    </ColleeLayout>
  );
};

export default AddCollegeScreen;
