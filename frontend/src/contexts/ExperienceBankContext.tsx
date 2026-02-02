import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ExperienceUsage {
  essayId: string;
  essayTitle: string;
  collegeId: string;
  collegeName: string;
}

export interface Experience {
  id: string;
  name: string;
  storyPillar: string;
  description?: string;
  tags: string[];
}

export interface StorySuggestion {
  id: string;
  experienceId: string;
  experienceName: string;
  storyPillar: string;
  usedIn: ExperienceUsage[];
  matchStrength: 'strong' | 'moderate';
  whyItFitsThisPrompt: string;
  framingGuidance: string[];
  caution?: string;
  // Actionable guidance fields
  startWith?: string;
  focusOn?: string;
  avoidFocus?: string;
  starterSentences?: string[];
}

// Smart Reuse: Excerpts from written essays
export interface EssayExcerpt {
  id: string;
  essayId: string;
  essayTitle: string;
  collegeId: string;
  collegeName: string;
  excerpt: string;
  themes: string[]; // Thematic tags for matching
  promptType?: string; // e.g., 'why-major', 'contribution', 'extracurricular'
}

// Track where excerpts have been reused
export interface ExcerptUsage {
  excerptId: string;
  targetEssayId: string;
  targetEssayTitle: string;
  targetCollegeId: string;
  targetCollegeName: string;
}

// Reuse suggestion shown to user
export interface ReuseSuggestion {
  id: string;
  excerpt: EssayExcerpt;
  whyItWorks: string;
  sameSchoolWarning?: string; // Only if already reused at same school
}

interface ExperienceBankContextType {
  experiences: Experience[];
  experienceUsages: Map<string, ExperienceUsage[]>;

  // Essay excerpts for Smart Reuse
  essayExcerpts: EssayExcerpt[];
  excerptUsages: ExcerptUsage[];
  dismissedExcerpts: Set<string>; // excerptId + essayId combo

  // Experience Actions
  addExperienceUsage: (experienceId: string, usage: ExperienceUsage) => void;
  removeExperienceUsage: (experienceId: string, essayId: string) => void;
  getExperienceUsages: (experienceId: string) => ExperienceUsage[];
  isUsedAtSchool: (experienceId: string, collegeId: string, excludeEssayId?: string) => ExperienceUsage | null;
  getSuggestionsForPrompt: (collegeId: string, essayId: string, promptText: string, essayContent: string) => Promise<StorySuggestion[]>;

  // Smart Reuse Actions
  getReuseSuggestions: (collegeId: string, essayId: string, promptThemes: string[], promptType?: string) => ReuseSuggestion[];
  insertExcerptAsReference: (excerptId: string, targetCollegeId: string, targetCollegeName: string, targetEssayId: string, targetEssayTitle: string) => void;
  dismissExcerpt: (excerptId: string, essayId: string) => void;
  isExcerptDismissed: (excerptId: string, essayId: string) => boolean;
  getExcerptSameSchoolReuse: (excerptId: string, collegeId: string, excludeEssayId: string) => ExcerptUsage | null;
}

const ExperienceBankContext = createContext<ExperienceBankContextType | undefined>(undefined);

// Initial experiences from onboarding (would come from backend/storage)
// These examples intentionally prioritize everyday moments over achievements
const initialExperiences: Experience[] = [
  {
    id: 'exp1',
    name: 'Teaching Grandma Technology',
    storyPillar: 'Patient Connector',
    description: 'Spent 3 hours teaching grandma to use her new smartphone',
    tags: ['empathy', 'patience', 'family', 'quiet commitment']
  },
  {
    id: 'exp2',
    name: 'Walking the Dog After School',
    storyPillar: 'Quiet Responsibility',
    description: 'Took care of the family dog every day, noticing how the routine changed me',
    tags: ['responsibility', 'routine', 'observation', 'care']
  },
  {
    id: 'exp3',
    name: 'Late-Night Homework Help',
    storyPillar: 'Supportive Sibling',
    description: 'Helped younger sibling with homework every night even when exhausted',
    tags: ['family', 'patience', 'sacrifice', 'teaching']
  },
  {
    id: 'exp4',
    name: 'Noticing Things Others Miss',
    storyPillar: 'Curious Observer',
    description: 'Started paying attention to how people in my neighborhood interact',
    tags: ['observation', 'curiosity', 'community', 'perspective']
  }
];

// Initial usages (simulating existing essay assignments)
const initialUsages = new Map<string, ExperienceUsage[]>([
  ['exp2', [
    { essayId: 'e3', essayTitle: 'Meaningful Experience', collegeId: '1', collegeName: 'Stanford University' }
  ]],
  ['exp3', [
    { essayId: 'e4', essayTitle: 'Describe the world you come from', collegeId: '2', collegeName: 'MIT' }
  ]]
]);

// Mock essay excerpts from previously written essays
const initialExcerpts: EssayExcerpt[] = [
  {
    id: 'exc1',
    essayId: 'e5',
    essayTitle: 'Challenge or setback',
    collegeId: '2',
    collegeName: 'MIT',
    excerpt: "Building CardioCatch taught me that engineering isn't just about solving problems, but about choosing problems that matter to real people.",
    themes: ['responsibility', 'impact', 'engineering', 'purpose', 'decision', 'growth'],
    promptType: 'challenge'
  },
  {
    id: 'exc2',
    essayId: 'e5',
    essayTitle: 'Challenge or setback',
    collegeId: '2',
    collegeName: 'MIT',
    excerpt: "When our first prototype failed in front of the judges, I felt the weight of my team's months of work crumbling. But in that moment of failure, I discovered something unexpected: the freedom to rebuild from scratch.",
    themes: ['failure', 'resilience', 'leadership', 'growth', 'decision'],
    promptType: 'challenge'
  },
  {
    id: 'exc3',
    essayId: 'e6',
    essayTitle: 'Why Yale?',
    collegeId: '3',
    collegeName: 'Yale University',
    excerpt: "I realized that true innovation doesn't come from avoiding mistakes—it comes from treating each failure as data, each setback as a pivot point toward something better.",
    themes: ['innovation', 'failure', 'growth', 'learning', 'responsibility'],
    promptType: 'why-college'
  },
  {
    id: 'exc4',
    essayId: 'e7',
    essayTitle: 'Why Computer Science?',
    collegeId: '4',
    collegeName: 'Stanford University',
    excerpt: "I chose computer science not because I love coding, but because I realized it's the most powerful tool I have to bridge the gap between complex systems and the people who need them.",
    themes: ['purpose', 'impact', 'technology', 'accessibility'],
    promptType: 'why-major'
  },
  {
    id: 'exc5',
    essayId: 'e8',
    essayTitle: 'Why Engineering?',
    collegeId: '5',
    collegeName: 'Cornell University',
    excerpt: "My fascination with engineering began not in a lab, but at my grandmother's kitchen table, watching her solve everyday problems with tools she'd fashioned herself.",
    themes: ['curiosity', 'family', 'engineering', 'innovation'],
    promptType: 'why-major'
  }
];

// Mock: excerpts already reused somewhere
const initialExcerptUsages: ExcerptUsage[] = [];

export const ExperienceBankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [experiences] = useState<Experience[]>(initialExperiences);
  const [experienceUsages, setExperienceUsages] = useState<Map<string, ExperienceUsage[]>>(initialUsages);

  // Smart Reuse state
  const [essayExcerpts] = useState<EssayExcerpt[]>(initialExcerpts);
  const [excerptUsages, setExcerptUsages] = useState<ExcerptUsage[]>(initialExcerptUsages);
  const [dismissedExcerpts, setDismissedExcerpts] = useState<Set<string>>(new Set());

  // Experience usage functions
  const addExperienceUsage = useCallback((experienceId: string, usage: ExperienceUsage) => {
    setExperienceUsages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(experienceId) || [];
      if (!existing.some(u => u.essayId === usage.essayId)) {
        newMap.set(experienceId, [...existing, usage]);
      }
      return newMap;
    });
  }, []);

  const removeExperienceUsage = useCallback((experienceId: string, essayId: string) => {
    setExperienceUsages(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(experienceId) || [];
      newMap.set(experienceId, existing.filter(u => u.essayId !== essayId));
      return newMap;
    });
  }, []);

  const getExperienceUsages = useCallback((experienceId: string): ExperienceUsage[] => {
    return experienceUsages.get(experienceId) || [];
  }, [experienceUsages]);

  const isUsedAtSchool = useCallback((
    experienceId: string,
    collegeId: string,
    excludeEssayId?: string
  ): ExperienceUsage | null => {
    const usages = experienceUsages.get(experienceId) || [];
    return usages.find(u =>
      u.collegeId === collegeId && u.essayId !== excludeEssayId
    ) || null;
  }, [experienceUsages]);

  /* MODIFIED: Fetch suggestions from backend AI */
  const getSuggestionsForPrompt = useCallback(async (collegeId: string, essayId: string, promptText: string, essayContent: string): Promise<StorySuggestion[]> => {
    try {
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: promptText,
          essay_content: essayContent
        })
      });

      if (!response.ok) throw new Error('Failed to fetch suggestions');
      const aiSuggestion = await response.json();

      // Parse the JSON string from the "content" field
      let parsedContent;
      try {
        // The backend returns the stringified JSON in the "content" field
        parsedContent = JSON.parse(aiSuggestion.content);
      } catch (e) {
        console.error("Failed to parse AI JSON", e);
        // Fallback if parsing fails
        parsedContent = {
          experience_name: 'AI Insight',
          why_it_fits: aiSuggestion.content,
          story_pillar: 'General Guidance',
          framing_guidance: ['Could not parse specific details'],
          start_with: '',
          focus_on: '',
          avoid_focus: ''
        };
      }

      return [{
        id: `ai-${Date.now()}`,
        experienceId: 'ai-generated',
        experienceName: parsedContent.experience_name || 'AI Insight',
        storyPillar: parsedContent.story_pillar || 'Personal Growth',
        usedIn: [],
        matchStrength: 'strong',
        whyItFitsThisPrompt: parsedContent.why_it_fits || 'No explanation provided.',
        framingGuidance: parsedContent.framing_guidance || [],
        startWith: parsedContent.start_with,
        focusOn: parsedContent.focus_on,
        avoidFocus: parsedContent.avoid_focus,
        starterSentences: [] // Not yet in backend prompt, optional
      }];
    } catch (e) {
      console.error("AI Error:", e);
      return [];
    }
  }, []);



  // Smart Reuse functions
  const isExcerptDismissed = useCallback((excerptId: string, essayId: string): boolean => {
    return dismissedExcerpts.has(`${excerptId}-${essayId}`);
  }, [dismissedExcerpts]);

  const dismissExcerpt = useCallback((excerptId: string, essayId: string) => {
    setDismissedExcerpts(prev => new Set(prev).add(`${excerptId}-${essayId}`));
  }, []);

  const getExcerptSameSchoolReuse = useCallback((
    excerptId: string,
    collegeId: string,
    excludeEssayId: string
  ): ExcerptUsage | null => {
    // Check if this excerpt was already reused for another essay at the SAME school
    return excerptUsages.find(u =>
      u.excerptId === excerptId &&
      u.targetCollegeId === collegeId &&
      u.targetEssayId !== excludeEssayId
    ) || null;
  }, [excerptUsages]);

  const getReuseSuggestions = useCallback((
    collegeId: string,
    essayId: string,
    promptThemes: string[],
    promptType?: string
  ): ReuseSuggestion[] => {
    // Only show excerpts from DIFFERENT schools (cross-school reuse is encouraged)
    const crossSchoolExcerpts = essayExcerpts.filter(exc =>
      exc.collegeId !== collegeId && // From a different school
      exc.essayId !== essayId && // Not the current essay
      !isExcerptDismissed(exc.id, essayId) // Not dismissed for this essay
    );

    // Find excerpts with thematic overlap
    const suggestions: ReuseSuggestion[] = [];

    for (const excerpt of crossSchoolExcerpts) {
      const themeOverlap = excerpt.themes.filter(t =>
        promptThemes.some(pt => t.includes(pt) || pt.includes(t))
      );

      if (themeOverlap.length > 0) {
        // Check if already reused at this same school (different prompt)
        const sameSchoolReuse = getExcerptSameSchoolReuse(excerpt.id, collegeId, essayId);

        suggestions.push({
          id: `reuse-${excerpt.id}`,
          excerpt,
          whyItWorks: generateWhyItWorks(themeOverlap),
          sameSchoolWarning: sameSchoolReuse
            ? `You've already reused a similar passage for "${sameSchoolReuse.targetEssayTitle}". Consider focusing on a different moment or insight here.`
            : undefined
        });
      }
    }

    // Sort: prioritize same prompt type from other colleges, then deprioritize same-school warnings
    return suggestions.sort((a, b) => {
      // First priority: same prompt type (from other colleges)
      if (promptType) {
        const aMatchesType = a.excerpt.promptType === promptType;
        const bMatchesType = b.excerpt.promptType === promptType;

        if (aMatchesType && !bMatchesType) return -1;
        if (!aMatchesType && bMatchesType) return 1;
      }

      // Second priority: deprioritize same-school warnings
      if (a.sameSchoolWarning && !b.sameSchoolWarning) return 1;
      if (!a.sameSchoolWarning && b.sameSchoolWarning) return -1;

      return 0;
    });
  }, [essayExcerpts, isExcerptDismissed, getExcerptSameSchoolReuse]);

  const insertExcerptAsReference = useCallback((
    excerptId: string,
    targetCollegeId: string,
    targetCollegeName: string,
    targetEssayId: string,
    targetEssayTitle: string
  ) => {
    // Track that this excerpt was reused
    setExcerptUsages(prev => [
      ...prev,
      {
        excerptId,
        targetEssayId,
        targetEssayTitle,
        targetCollegeId,
        targetCollegeName
      }
    ]);
  }, []);

  return (
    <ExperienceBankContext.Provider value={{
      experiences,
      experienceUsages,
      essayExcerpts,
      excerptUsages,
      dismissedExcerpts,
      addExperienceUsage,
      removeExperienceUsage,
      getExperienceUsages,
      isUsedAtSchool,
      getSuggestionsForPrompt,
      getReuseSuggestions,
      insertExcerptAsReference,
      dismissExcerpt,
      isExcerptDismissed,
      getExcerptSameSchoolReuse
    }}>
      {children}
    </ExperienceBankContext.Provider>
  );
};

// Helper to generate "why it works" text based on theme overlap
function generateWhyItWorks(themes: string[]): string {
  const themeDescriptions: Record<string, string> = {
    'responsibility': 'responsibility and ownership',
    'impact': 'meaningful impact',
    'engineering': 'technical problem-solving',
    'purpose': 'sense of purpose',
    'failure': 'learning from setbacks',
    'resilience': 'resilience and persistence',
    'leadership': 'leadership qualities',
    'growth': 'personal growth',
    'innovation': 'innovative thinking',
    'growth-mindset': 'a growth mindset',
    'learning': 'continuous learning'
  };

  const descriptions = themes
    .map(t => themeDescriptions[t] || t)
    .slice(0, 2);

  if (descriptions.length === 1) {
    return `This excerpt reflects ${descriptions[0]}, which aligns with what this prompt is asking.`;
  }
  return `This excerpt reflects ${descriptions.join(' and ')}, which aligns with what this prompt is asking.`;
}

export const useExperienceBank = () => {
  const context = useContext(ExperienceBankContext);
  if (context === undefined) {
    throw new Error('useExperienceBank must be used within an ExperienceBankProvider');
  }
  return context;
};
