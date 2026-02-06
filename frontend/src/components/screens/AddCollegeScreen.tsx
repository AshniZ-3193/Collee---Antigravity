import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, Check, GraduationCap, Plus, Trash2, FileText, X, Eye, EyeOff } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import ColleeLogo from '@/components/ColleeLogo';
import { PROMPT_TYPES } from '@/lib/promptTypes';
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AddCollegeScreenProps {
  onBack: () => void;
  onAddCollege: (collegeId: string) => void;
  onComplete: () => void;
}

interface EssayPrompt {
  id: string;
  promptText: string;
  promptType: string;
  limitValue: number;
  isOptional: boolean;
  targetProgram?: string;
  relevantMajors?: string[];
}

interface ApplicationType {
  value: string;
  label: string;
  deadline: string;
}

interface CollegeData {
  id: string;
  name: string;
  location: string;
  applicationTypes: ApplicationType[];
  schoolSlug?: string;
  qualityStatus?: "unverified" | "verified" | "needs_review";
  qualityScore?: number;
}

interface SelectedCollegeConfig {
  collegeId: string;
  collegeName: string;
  applicationType: string;
  deadline: string;
  schoolSlug?: string;
  sourceQualityStatus?: "unverified" | "verified" | "needs_review";
  sourceQualityScore?: number;
  sourceVerifiedAt?: number;
}

interface EnsureSchoolContentResponse {
  status: "ready" | "enriching";
  schoolSlug: string;
  canonicalName: string;
  qualityStatus: "unverified" | "verified" | "needs_review";
  qualityScore: number;
  verificationNotes?: string;
  prompts: Array<{
    text: string;
    wordCountMax: number;
    isOptional: boolean;
    promptType?: string;
    targetProgram?: string;
    relevantMajors?: string[];
  }>;
  applicationTypes: Array<{
    label: string;
    deadline: string;
    value?: string;
  }>;
  sourceUrls: string[];
  cachedAt: number;
  expiresAt: number;
}

const toApplicationTypeValue = (label: string) => {
  const normalized = label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "application";
};

const toCustomCollegeId = (name: string) => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `custom:${normalized || "college"}`;
};

const toGlobalCollegeId = (slug: string) => `global:${slug}`;

const normalizeApplicationTypes = (items: Array<{ label?: string; deadline?: string; value?: string }>) => {
  const seen = new Set<string>();
  return items
    .filter((item) => item && item.label && item.deadline)
    .map((item) => ({
      value: item.value || toApplicationTypeValue(item.label as string),
      label: item.label as string,
      deadline: item.deadline as string,
    }))
    .filter((item) => {
      if (seen.has(item.value)) return false;
      seen.add(item.value);
      return true;
    });
};

const majorKeywordGroups = [
  {
    canonical: "computer science",
    keywords: ["computer science", "cs", "comp sci", "informatics", "software", "programming", "coding", "data science", "ai", "artificial intelligence", "machine learning"],
  },
  {
    canonical: "engineering",
    keywords: ["engineering", "mechanical", "electrical", "chemical", "aerospace", "civil", "robotics", "biomedical", "industrial", "systems"],
  },
  {
    canonical: "business administration",
    keywords: ["business", "management", "entrepreneurship", "commerce", "administration"],
  },
  { canonical: "economics", keywords: ["economics", "econ"] },
  { canonical: "finance", keywords: ["finance", "financial"] },
  { canonical: "accounting", keywords: ["accounting", "accountant"] },
  { canonical: "marketing", keywords: ["marketing", "advertising", "branding"] },
  { canonical: "art", keywords: ["art", "visual art", "fine art", "design", "graphic design", "studio art"] },
  { canonical: "music", keywords: ["music", "composition", "performance"] },
  { canonical: "theater", keywords: ["theater", "theatre", "drama", "acting"] },
  { canonical: "english", keywords: ["english", "literature", "writing", "creative writing"] },
  { canonical: "history", keywords: ["history"] },
  { canonical: "philosophy", keywords: ["philosophy", "ethics"] },
  { canonical: "biology", keywords: ["biology", "bio", "biological"] },
  { canonical: "chemistry", keywords: ["chemistry", "chem"] },
  { canonical: "physics", keywords: ["physics"] },
  { canonical: "neuroscience", keywords: ["neuroscience", "neuro"] },
  { canonical: "environmental science", keywords: ["environmental science", "environmental", "ecology", "sustainability"] },
  { canonical: "nursing", keywords: ["nursing", "nurse"] },
  { canonical: "public health", keywords: ["public health", "health policy", "epidemiology"] },
  { canonical: "pre-med", keywords: ["pre-med", "premed", "medicine", "medical"] },
  { canonical: "health sciences", keywords: ["health sciences", "health science", "health"] },
  { canonical: "mathematics", keywords: ["mathematics", "math", "statistics", "stat"] },
];

const majorRelations: Record<string, string[]> = {
  "computer science": ["engineering", "mathematics", "physics"],
  "engineering": ["computer science", "mathematics", "physics"],
  "mathematics": ["computer science", "physics"],
};

const normalizeMajorTokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const normalizeMajorPhrase = (value: string) => normalizeMajorTokens(value).join(" ");

const matchesKeyword = (normalized: string, tokens: string[], keyword: string) => {
  const keywordTokens = normalizeMajorTokens(keyword);
  if (keywordTokens.length === 0) return false;
  if (keywordTokens.length === 1) {
    return tokens.includes(keywordTokens[0]);
  }
  return normalized.includes(keywordTokens.join(" "));
};

const expandMajorTags = (tags: string[]) => {
  const expanded = new Set<string>();
  tags.forEach((tag) => {
    const normalized = normalizeMajorPhrase(tag);
    if (!normalized) return;
    expanded.add(normalized);
    const tokens = normalizeMajorTokens(tag);
    majorKeywordGroups.forEach((group) => {
      if (group.keywords.some((keyword) => matchesKeyword(normalized, tokens, keyword))) {
        expanded.add(group.canonical);
      }
    });
  });

  Array.from(expanded).forEach((tag) => {
    (majorRelations[tag] || []).forEach((related) => expanded.add(related));
  });

  return expanded;
};

const inferRelevantMajors = (prompt: EssayPrompt): string[] => {
  const combinedText = `${prompt.targetProgram || ""} ${prompt.promptText || ""}`;
  const normalized = normalizeMajorPhrase(combinedText);
  const tokens = normalizeMajorTokens(combinedText);
  const matches = new Set<string>();
  majorKeywordGroups.forEach((group) => {
    if (group.keywords.some((keyword) => matchesKeyword(normalized, tokens, keyword))) {
      matches.add(group.canonical);
    }
  });
  return Array.from(matches);
};

// Filter prompts based on user's primary interests
const filterPromptsForUser = (prompts: EssayPrompt[], userInterests: string[]): EssayPrompt[] => {
  if (!userInterests || userInterests.length === 0) {
    return prompts; // No interests = show all
  }

  const normalizedInterests = expandMajorTags(userInterests);
  if (normalizedInterests.size === 0) return prompts;

  return prompts.filter(prompt => {
    // Always show prompts with no specific target or "all" majors
    if (!prompt.relevantMajors || prompt.relevantMajors.length === 0 || prompt.relevantMajors.includes("all")) {
      return true;
    }

    const normalizedMajors = expandMajorTags(prompt.relevantMajors);
    for (const major of normalizedMajors) {
      if (normalizedInterests.has(major)) return true;
    }
    return false;
  });
};

// College data with available application types and their deadlines
const popularColleges: CollegeData[] = [
  { 
    id: 'stanford', 
    name: 'Stanford University', 
    location: 'Stanford, CA',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ]
  },
  { 
    id: 'mit', 
    name: 'Massachusetts Institute of Technology', 
    location: 'Cambridge, MA',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ]
  },
  { 
    id: 'harvard', 
    name: 'Harvard University', 
    location: 'Cambridge, MA',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'yale', 
    name: 'Yale University', 
    location: 'New Haven, CT',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 2' },
    ]
  },
  { 
    id: 'princeton', 
    name: 'Princeton University', 
    location: 'Princeton, NJ',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'columbia', 
    name: 'Columbia University', 
    location: 'New York, NY',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'uchicago', 
    name: 'University of Chicago', 
    location: 'Chicago, IL',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 4' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ]
  },
  { 
    id: 'duke', 
    name: 'Duke University', 
    location: 'Durham, NC',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ]
  },
  { 
    id: 'penn', 
    name: 'University of Pennsylvania', 
    location: 'Philadelphia, PA',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ]
  },
  { 
    id: 'northwestern', 
    name: 'Northwestern University', 
    location: 'Evanston, IL',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ]
  },
  { 
    id: 'brown', 
    name: 'Brown University', 
    location: 'Providence, RI',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ]
  },
  { 
    id: 'dartmouth', 
    name: 'Dartmouth College', 
    location: 'Hanover, NH',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ]
  },
  { 
    id: 'cornell', 
    name: 'Cornell University', 
    location: 'Ithaca, NY',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 2' },
    ]
  },
  { 
    id: 'vanderbilt', 
    name: 'Vanderbilt University', 
    location: 'Nashville, TN',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'rice', 
    name: 'Rice University', 
    location: 'Houston, TX',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ]
  },
  { 
    id: 'notredame', 
    name: 'University of Notre Dame', 
    location: 'Notre Dame, IN',
    applicationTypes: [
      { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'washu', 
    name: 'Washington University in St. Louis', 
    location: 'St. Louis, MO',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 4' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 4' },
    ]
  },
  { 
    id: 'emory', 
    name: 'Emory University', 
    location: 'Atlanta, GA',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 1' },
    ]
  },
  { 
    id: 'georgetown', 
    name: 'Georgetown University', 
    location: 'Washington, DC',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 10' },
    ]
  },
  { 
    id: 'usc', 
    name: 'University of Southern California', 
    location: 'Los Angeles, CA',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 15' },
    ]
  },
  { 
    id: 'berkeley', 
    name: 'UC Berkeley', 
    location: 'Berkeley, CA',
    applicationTypes: [
      { value: 'rd', label: 'Regular Decision', deadline: 'Nov 30' },
    ]
  },
  { 
    id: 'ucla', 
    name: 'UCLA', 
    location: 'Los Angeles, CA',
    applicationTypes: [
      { value: 'rd', label: 'Regular Decision', deadline: 'Nov 30' },
    ]
  },
  { 
    id: 'umich', 
    name: 'University of Michigan', 
    location: 'Ann Arbor, MI',
    applicationTypes: [
      { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Feb 1' },
    ]
  },
  { 
    id: 'nyu', 
    name: 'New York University', 
    location: 'New York, NY',
    applicationTypes: [
      { value: 'ed1', label: 'Early Decision I', deadline: 'Nov 1' },
      { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 5' },
    ]
  },
  { 
    id: 'cmu', 
    name: 'Carnegie Mellon University', 
    location: 'Pittsburgh, PA',
    applicationTypes: [
      { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
      { value: 'rd', label: 'Regular Decision', deadline: 'Jan 3' },
    ]
  },
];

// Default application types for custom colleges
const defaultApplicationTypes: ApplicationType[] = [
  { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
  { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
  { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
  { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
  { value: 'rd', label: 'Regular Decision', deadline: 'Jan 15' },
];

const AddCollegeScreen: React.FC<AddCollegeScreenProps> = ({
  onBack,
  onAddCollege,
  onComplete,
}) => {
  const typedApi = api as any;
  const addCollegeMutation = useMutation(typedApi.colleges.add);
  const ensureSchoolContentAction = useAction(typedApi.ai.ensureSchoolContent.ensure);
  const userProfile = useQuery(api.userProfile.get, {});
  const [isSearchingPrompts, setIsSearchingPrompts] = useState(false);
  const [isSearchingDeadlines, setIsSearchingDeadlines] = useState(false);
  const [deadlineSearchError, setDeadlineSearchError] = useState<string | null>(null);
  const [promptSearchError, setPromptSearchError] = useState<string | null>(null);
  const [qualityStatusMessage, setQualityStatusMessage] = useState<string | null>(null);
  const [isAutoAdding, setIsAutoAdding] = useState(false);
  const [step, setStep] = useState<'select' | 'application-type' | 'prompts'>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColleges, setSelectedColleges] = useState<Set<string>>(new Set());
  const [customColleges, setCustomColleges] = useState<Record<string, CollegeData>>({});
  const [globalColleges, setGlobalColleges] = useState<Record<string, CollegeData>>({});
  const [appTypeOptionsByCollegeId, setAppTypeOptionsByCollegeId] = useState<Record<string, ApplicationType[] | null>>({});
  const [promptsByCollegeId, setPromptsByCollegeId] = useState<Record<string, EssayPrompt[] | null>>({});
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  
  // For multi-college flow: track app types for each selected college
  const [collegeConfigs, setCollegeConfigs] = useState<SelectedCollegeConfig[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  
  // For prompts step (applies to current college being configured)
  const [prompts, setPrompts] = useState<EssayPrompt[]>([
    { id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }
  ]);

  const trimmedSearchQuery = searchQuery.trim();
  const globalSchoolMatches = useQuery(typedApi.globalSchools.searchByName, {
    query: trimmedSearchQuery,
    limit: 20,
  }) as Array<{
    canonicalName: string;
    slug: string;
    status: string;
    qualityStatus: "unverified" | "verified" | "needs_review";
    qualityScore: number;
  }> | undefined;

  useEffect(() => {
    if (!globalSchoolMatches) return;
    setGlobalColleges((prev) => {
      const next = { ...prev };
      for (const school of globalSchoolMatches) {
        const id = toGlobalCollegeId(school.slug);
        next[id] = {
          id,
          name: school.canonicalName,
          location: 'Global school',
          applicationTypes: [],
          schoolSlug: school.slug,
          qualityStatus: school.qualityStatus,
          qualityScore: school.qualityScore,
        };
      }
      return next;
    });
  }, [globalSchoolMatches]);

  const filteredColleges = useMemo(() => {
    const query = trimmedSearchQuery.toLowerCase();
    const popularMatches = popularColleges.filter((college) =>
      !query || college.name.toLowerCase().includes(query)
    );
    const globalMatches = Object.values(globalColleges).filter((college) =>
      !query || college.name.toLowerCase().includes(query)
    );
    const merged = [...popularMatches];
    for (const college of globalMatches) {
      if (!merged.some((item) => item.name.toLowerCase() === college.name.toLowerCase())) {
        merged.push(college);
      }
    }
    return merged;
  }, [globalColleges, trimmedSearchQuery]);

  const showAddCustom = trimmedSearchQuery.length > 0 && !filteredColleges.some(
    (college) => college.name.toLowerCase() === trimmedSearchQuery.toLowerCase()
  );
  const customCollegeId = showAddCustom ? toCustomCollegeId(trimmedSearchQuery) : null;
  const customIsSelected = customCollegeId ? selectedColleges.has(customCollegeId) : false;

  const getCollegeById = (collegeId: string) => {
    return (
      customColleges[collegeId]
      || globalColleges[collegeId]
      || popularColleges.find(c => c.id === collegeId)
      || null
    );
  };

  // Toggle college selection
  const toggleCollegeSelection = (collegeId: string) => {
    setSelectedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collegeId)) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });
  };

  const handleAddCustomCollege = () => {
    const name = trimmedSearchQuery;
    if (!name) return;
    const id = toCustomCollegeId(name);

    setCustomColleges(prev => {
      if (prev[id]) return prev;
      return {
        ...prev,
        [id]: {
          id,
          name,
          location: 'Custom college',
          applicationTypes: [],
        },
      };
    });

    setSelectedColleges(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });

    setSearchQuery('');
  };

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

  const selectedCollegesCount = selectedColleges.size;
  const canProceedToApplicationType = selectedCollegesCount > 0;
  const canProceedToPrompts = currentConfig?.applicationType !== '';
  const validPromptCount = prompts.filter(p => p.promptText.trim() && p.limitValue > 0).length;
  const deadlineSearchAttempted = currentAppTypeOptions !== undefined;
  const noDeadlinesFound = deadlineSearchAttempted && (currentAppTypeOptions?.length ?? 0) === 0;
  const promptSearchAttempted = currentPromptsFromSearch !== undefined;
  const noPromptsFound = promptSearchAttempted && (currentPromptsFromSearch?.length ?? 0) === 0;

  // Filter prompts based on user's interests
  const userInterests = userProfile?.primaryInterests || [];
  const filteredPrompts = filterPromptsForUser(prompts, userInterests);
  const hiddenPromptCount = prompts.length - filteredPrompts.length;
  const displayPrompts = showAllPrompts ? prompts : filteredPrompts;

  const mapFetchedPrompts = useCallback((searchedPrompts: Array<any>) => {
    const mappedPrompts = (searchedPrompts || []).map((p: any, i: number) => ({
      id: `searched-${i}`,
      promptText: p.text,
      promptType: p.promptType || '',
      limitValue: p.wordCountMax || 250,
      isOptional: p.isOptional || false,
      targetProgram: p.targetProgram || undefined,
      relevantMajors: p.relevantMajors || undefined,
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
  ]);

  useEffect(() => {
    if (step !== 'prompts' || !currentCollegeId || !currentCollegeName) return;
    if (currentPromptsFromSearch !== undefined) {
      if (currentPromptsFromSearch.length > 0) {
        setPrompts(currentPromptsFromSearch);
      } else {
        setPrompts([{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]);
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
          : [{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]
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
              setPrompts([{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]);
              setShowAllPrompts(false);
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
          setPrompts([{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]);
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
    userProfile?.primaryInterests,
  ]);

  const handleContinueToApplicationType = () => {
    if (canProceedToApplicationType) {
      // Build initial configs for all selected colleges
      const configs: SelectedCollegeConfig[] = [];
      
      selectedColleges.forEach(collegeId => {
        const college = getCollegeById(collegeId);
        if (college) {
          configs.push({
            collegeId: college.id,
            collegeName: college.name,
            applicationType: '',
            deadline: '',
            schoolSlug: college.schoolSlug,
            sourceQualityStatus: college.qualityStatus,
            sourceQualityScore: college.qualityScore,
          });
        }
      });
      
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

  const addPrompt = () => {
    setPrompts([...prompts, {
      id: Date.now().toString(),
      promptText: '',
      promptType: '',
      limitValue: 250,
      isOptional: false
    }]);
  };

  const removePrompt = (id: string) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter(p => p.id !== id));
    }
  };

  const updatePrompt = (id: string, field: keyof EssayPrompt, value: string | number | boolean) => {
    setPrompts(prompts.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
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
        setPrompts([{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]);
        setShowAllPrompts(false);
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
        setPrompts([{ id: '1', promptText: '', promptType: '', limitValue: 250, isOptional: false }]);
        setShowAllPrompts(false);
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

  // Remove a selected college chip
  const removeSelectedCollege = (collegeId: string) => {
    setSelectedColleges(prev => {
      const newSet = new Set(prev);
      newSet.delete(collegeId);
      return newSet;
    });

    if (collegeId.startsWith('custom:')) {
      setCustomColleges(prev => {
        if (!prev[collegeId]) return prev;
        const next = { ...prev };
        delete next[collegeId];
        return next;
      });
    }
  };

  return (
    <ColleeLayout>
      <div className="space-y-6">
        {/* Top Logo */}
        <motion.div 
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ColleeLogo size="sm" />
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-body-sm">
              {step === 'prompts' 
                ? 'Back' 
                : step === 'application-type' 
                  ? (currentConfigIndex > 0 ? 'Previous college' : 'Back to colleges')
                  : 'Back'}
            </span>
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              {step === 'select' ? (
                <GraduationCap className="w-6 h-6 text-primary" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>
            <h1 className="text-title text-foreground mb-2">
              {step === 'select' 
                ? 'Add colleges' 
                : step === 'application-type'
                  ? 'Select application type'
                  : 'Add essay prompts'}
            </h1>
            <p className="text-body text-muted-foreground">
              {step === 'select' 
                ? 'Select one or more colleges to add to your list'
                : step === 'application-type'
                  ? `Choose how you're applying to ${currentConfig?.collegeName}`
                  : `Add the essay prompts for ${currentConfig?.collegeName}`
              }
            </p>
            {step !== 'select' && collegeConfigs.length > 1 && (
              <p className="text-body-sm text-primary mt-2">
                College {currentConfigIndex + 1} of {collegeConfigs.length}
              </p>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'select' ? (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Selected Colleges Chips */}
              {selectedColleges.size > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedColleges).map(collegeId => {
                    const college = getCollegeById(collegeId);
                    return (
                      <motion.div
                        key={collegeId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30"
                      >
                        <span className="text-body-sm font-medium text-primary">
                          {college?.name || collegeId}
                        </span>
                        <button
                          onClick={() => removeSelectedCollege(collegeId)}
                          className="p-0.5 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search colleges..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 bg-card border-border"
                />
              </div>

              {/* College List */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredColleges.map((college, index) => {
                  const isSelected = selectedColleges.has(college.id);
                  return (
                    <motion.button
                      key={college.id}
                      onClick={() => toggleCollegeSelection(college.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-body font-medium text-foreground">{college.name}</h3>
                          <p className="text-body-sm text-muted-foreground">{college.location}</p>
                          {college.qualityStatus && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {college.qualityStatus === "verified"
                                ? "Verified global data"
                                : college.qualityStatus === "needs_review"
                                  ? "Needs source review"
                                  : "Provisional global data"}
                            </p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground/30'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
                {showAddCustom && (
                  <motion.button
                    key={`add-custom-${customCollegeId}`}
                    onClick={customIsSelected ? undefined : handleAddCustomCollege}
                    disabled={customIsSelected}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      customIsSelected
                        ? 'border-primary bg-primary/5 cursor-default'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-body font-medium text-foreground">
                          Add “{trimmedSearchQuery}”
                        </h3>
                        <p className="text-body-sm text-muted-foreground">Use this custom college</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        customIsSelected
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}>
                        {customIsSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                      </div>
                    </div>
                  </motion.button>
                )}
              </div>
              {/* Continue Button */}
              {canProceedToApplicationType && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4"
                >
                  <Button
                    variant="collee-accent"
                    size="collee"
                    onClick={handleContinueToApplicationType}
                    className="w-full"
                  >
                    Continue with {selectedCollegesCount} college{selectedCollegesCount > 1 ? 's' : ''}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : step === 'application-type' ? (
            <motion.div
              key={`application-type-${currentConfigIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {isSearchingDeadlines && (
                <p className="text-body-sm text-muted-foreground">
                  Searching for application deadlines for {currentConfig?.collegeName}...
                </p>
              )}
              {deadlineSearchError && (
                <p className="text-body-sm text-destructive">
                  {deadlineSearchError}
                </p>
              )}
              {noDeadlinesFound && !deadlineSearchError && !isSearchingDeadlines && (
                <p className="text-body-sm text-muted-foreground">
                  No deadlines found. Showing default options.
                </p>
              )}
              {qualityStatusMessage && (
                <p className="text-body-sm text-muted-foreground">
                  {qualityStatusMessage}
                </p>
              )}

              {/* Application Type Selection */}
              <div className="space-y-3">
                {currentAvailableAppTypes.map((appType, index) => (
                  <motion.button
                    key={appType.value}
                    onClick={() => handleSelectApplicationType(appType.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      currentConfig?.applicationType === appType.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-body font-medium text-foreground">{appType.label}</h3>
                        <p className="text-body-sm text-muted-foreground">Deadline: {appType.deadline}</p>
                      </div>
                      {currentConfig?.applicationType === appType.value && (
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Continue Button */}
              {canProceedToPrompts && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4"
                >
                  <Button
                    variant="collee-accent"
                    size="collee"
                    onClick={handleContinueToPrompts}
                    className="w-full"
                  >
                    {currentConfigIndex < collegeConfigs.length - 1
                      ? `Continue to ${collegeConfigs[currentConfigIndex + 1]?.collegeName}`
                      : 'Continue to prompts'
                    }
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key={`prompts-${currentConfigIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {isAutoAdding && (
                <p className="text-body-sm text-muted-foreground">
                  Adding {currentConfig?.collegeName} with auto-found prompts...
                </p>
              )}
              {isSearchingPrompts && (
                <p className="text-body-sm text-muted-foreground">
                  Searching for prompts for {currentConfig?.collegeName}...
                </p>
              )}
              {promptSearchError && (
                <p className="text-body-sm text-destructive">
                  {promptSearchError}
                </p>
              )}
              {noPromptsFound && !promptSearchError && !isSearchingPrompts && (
                <p className="text-body-sm text-muted-foreground">
                  No prompts found. You can add them manually.
                </p>
              )}
              {qualityStatusMessage && (
                <p className="text-body-sm text-muted-foreground">
                  {qualityStatusMessage}
                </p>
              )}

              {/* Show hidden prompts toggle */}
              {hiddenPromptCount > 0 && !isSearchingPrompts && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-body-sm text-muted-foreground">
                    {hiddenPromptCount} specialized program prompt{hiddenPromptCount > 1 ? 's' : ''} hidden
                  </span>
                  <button
                    onClick={() => setShowAllPrompts(!showAllPrompts)}
                    className="flex items-center gap-1.5 text-body-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {showAllPrompts ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        Show all
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Prompt List */}
              {displayPrompts.map((prompt, index) => (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="p-4 rounded-xl border border-border bg-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium text-foreground">
                        Essay {index + 1}
                      </span>
                      {prompt.targetProgram && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {prompt.targetProgram}
                        </span>
                      )}
                    </div>
                    {prompts.length > 1 && (
                      <button
                        onClick={() => removePrompt(prompt.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Prompt Text */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Prompt text
                    </label>
                    <Textarea
                      placeholder="Paste or type the essay prompt here..."
                      value={prompt.promptText}
                      onChange={(e) => updatePrompt(prompt.id, 'promptText', e.target.value)}
                      className="min-h-[80px] bg-background resize-none"
                    />
                  </div>

                  {/* Prompt Type */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Prompt type (optional)
                    </label>
                    <Select
                      value={prompt.promptType}
                      onValueChange={(value) => updatePrompt(prompt.id, 'promptType', value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Max Word Limit */}
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                      Max words
                    </label>
                    <Input
                      type="number"
                      placeholder="250"
                      value={prompt.limitValue || ''}
                      onChange={(e) => updatePrompt(prompt.id, 'limitValue', parseInt(e.target.value) || 0)}
                      className="bg-background"
                    />
                  </div>

                  {/* Optional Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updatePrompt(prompt.id, 'isOptional', !prompt.isOptional)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        prompt.isOptional
                          ? 'bg-primary border-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {prompt.isOptional && <Check className="w-3 h-3 text-primary-foreground" />}
                    </button>
                    <span className="text-xs text-muted-foreground">This prompt is optional</span>
                  </div>
                </motion.div>
              ))}

              {/* Add Another Prompt Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={addPrompt}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add another prompt
              </Button>

              {/* Add College Button */}
              {canAddCollege && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pt-4"
                >
                  <Button
                    variant="collee-accent"
                    size="collee"
                    onClick={handleAddCollegeAndContinue}
                    className="w-full"
                  >
                    {currentConfigIndex < collegeConfigs.length - 1
                      ? `Add ${currentConfig?.collegeName} and continue`
                      : `Add ${currentConfig?.collegeName} to my list`
                    }
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ColleeLayout>
  );
};

export default AddCollegeScreen;
