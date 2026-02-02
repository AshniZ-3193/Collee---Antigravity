import React, { useState, useEffect } from 'react';
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
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Check,
  Settings,
  History,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Share2,
  Lightbulb,
  Target,
  FileText,
  X,
  RotateCcw,
  Mail,
  Send,
  CheckCircle,
  Eye,
  Users,
  Shield,
  GraduationCap,
  Pencil,
  MapPin,
  Plus,
  BookOpen,
  Rocket,
  User,
  LogOut,
  Minimize2,
  Maximize2,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Quote,
  Copy,
  XCircle,
  Trash2,
  ArrowLeft,
  HelpCircle,
  Heart,
  PenLine,
  Calendar,
  Wand2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ColleeLogo from '@/components/ColleeLogo';
import { Pencil as EditIcon, Link2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OnboardingWalkthrough, { useOnboardingState } from '@/components/OnboardingWalkthrough';

// ===== PERSONAL LENS TYPES =====
interface PersonalLensNote {
  id: string;
  content: string;
  category: 'moment' | 'observation' | 'responsibility' | 'realization' | 'value' | 'shift';
  createdAt: Date;
}

const PERSONAL_LENS_CATEGORIES = [
  { value: 'moment', label: 'A moment', placeholder: 'Describe a specific moment that stuck with you...' },
  { value: 'observation', label: 'Something I noticed', placeholder: 'What have you observed that others might miss?' },
  { value: 'responsibility', label: 'A responsibility', placeholder: 'A duty or commitment you carry...' },
  { value: 'realization', label: 'A realization', placeholder: 'Something you came to understand...' },
  { value: 'value', label: 'What matters to me', placeholder: 'A value or belief that guides you...' },
  { value: 'shift', label: 'A shift in perspective', placeholder: 'How your thinking changed...' },
] as const;

const promptTypes = [
  { value: 'contribution', label: 'Contribution' },
  { value: 'why-major', label: 'Why Major' },
  { value: 'why-college', label: 'Why This College' },
  { value: 'extracurricular', label: 'Extracurricular' },
  { value: 'identity', label: 'Identity' },
  { value: 'challenge', label: 'Challenge/Setback' },
  { value: 'other', label: 'Other' },
];

// ===== TYPES =====
interface Essay {
  id: string;
  title: string;
  prompt: string;
  status: 'not-started' | 'in-progress' | 'complete';
  wordCount: number;
  wordLimit: number;
  content: string;
  promptType?: string; // e.g., 'why-college', 'why-major', 'challenge', 'identity'
}

interface College {
  id: string;
  name: string;
  applicationType?: string;
  deadline?: string;
  essays: Essay[];
}

interface Version {
  id: string;
  timestamp: string;
  wordCount: number;
  preview: string;
  isCurrent?: boolean;
}

interface LaunchPadWorkspaceProps {
  onAddCollege: () => void;
  onExport: () => void;
  onEditStoryIdentity?: () => void;
  onLogoClick?: () => void;
  onLogout?: () => void;
}

// ===== MOCK DATA =====
const mockColleges: College[] = [
  {
    id: '1',
    name: 'Stanford University',
    applicationType: 'Common App',
    deadline: 'Jan 15',
    essays: [
      {
        id: 'e1',
        title: 'Personal Statement',
        prompt: 'Describe an experience where you had to make a difficult choice. What did you decide and what did you learn?',
        status: 'in-progress',
        wordCount: 542,
        wordLimit: 650,
        content: 'The moment I realized I wanted to pursue computer science was not in a classroom — it was in my grandmother\'s kitchen.\n\nShe had just received a new smartphone from my parents, and the look of confusion and frustration on her face was something I\'ll never forget.\n\nI spent the next three hours walking her through every feature, translating the cold, technical language into something that made sense to her.'
      },
      {
        id: 'e2',
        title: 'Why Stanford?',
        prompt: 'What is it about Stanford that has led you to apply?',
        status: 'not-started',
        wordCount: 0,
        wordLimit: 250,
        content: '',
        promptType: 'why-college'
      },
      {
        id: 'e3',
        title: 'Meaningful Experience',
        prompt: 'Tell us about something that has been meaningful to your identity.',
        status: 'complete',
        wordCount: 248,
        wordLimit: 350,
        content: 'Growing up in two cultures taught me the art of translation—not just of language, but of meaning.'
      },
    ]
  },
  {
    id: '2',
    name: 'MIT',
    applicationType: 'Common App',
    deadline: 'Jan 20',
    essays: [
      {
        id: 'e4',
        title: 'Describe the world you come from',
        prompt: 'Describe the world you come from; for example, your family, clubs, school, community, city, or town.',
        status: 'not-started',
        wordCount: 0,
        wordLimit: 250,
        content: ''
      },
      {
        id: 'e5',
        title: 'Challenge or setback',
        prompt: 'Tell us about a significant challenge you\'ve faced or something that didn\'t go according to plan.',
        status: 'in-progress',
        wordCount: 180,
        wordLimit: 250,
        content: 'The first time I failed publicly was at the state robotics competition.'
      },
    ]
  },
  {
    id: '3',
    name: 'Yale University',
    applicationType: 'Coalition App',
    deadline: 'Jan 12',
    essays: [
      {
        id: 'e6',
        title: 'Why Yale?',
        prompt: 'What is it about Yale that has led you to apply?',
        status: 'in-progress',
        wordCount: 120,
        wordLimit: 125,
        content: 'Yale\'s unique combination of intimate residential colleges and world-class research opportunities draws me in. I see myself thriving in an environment where intellectual curiosity is celebrated across disciplines.',
        promptType: 'why-college'
      },
      {
        id: 'e7',
        title: 'Reflect on something',
        prompt: 'Reflect on a time when you questioned or challenged a belief or idea.',
        status: 'not-started',
        wordCount: 0,
        wordLimit: 650,
        content: ''
      },
    ]
  },
  {
    id: '4',
    name: 'UC Berkeley',
    applicationType: 'UC Application',
    deadline: 'Mar 15',
    essays: [
      {
        id: 'e8',
        title: 'Leadership Experience',
        prompt: 'Describe an example of your leadership experience.',
        status: 'complete',
        wordCount: 350,
        wordLimit: 350,
        content: 'When I founded the coding club at my high school, I had no idea it would grow into a community of over 50 members.'
      },
    ]
  },
];

const mockVersions: Version[] = [
  { id: 'v1', timestamp: 'Today, 3:42 PM', wordCount: 542, preview: 'The moment I realized I wanted to pursue computer science...', isCurrent: true },
  { id: 'v2', timestamp: 'Today, 2:15 PM', wordCount: 487, preview: 'The moment I realized I wanted to pursue computer science...' },
  { id: 'v3', timestamp: 'Today, 11:30 AM', wordCount: 320, preview: 'I never expected to find my passion for technology...' },
  { id: 'v4', timestamp: 'Yesterday, 8:45 PM', wordCount: 156, preview: 'Growing up, I always thought technology was cold...' },
];

// Story Identity - Experience Bank
interface StoryExperience {
  id: string;
  name: string;
  tags: string[];
  usedIn: string[];
}

// Full Experience Bank - all student experiences
const experienceBank: StoryExperience[] = [
  { id: 'exp1', name: 'Teaching Grandma Technology', tags: ['empathy', 'bridge-building', 'patience', 'family', 'decision'], usedIn: [] },
  { id: 'exp2', name: 'Robotics Competition Failure', tags: ['resilience', 'leadership', 'iteration', 'teamwork', 'challenge', 'setback'], usedIn: ['e3'] },
  { id: 'exp3', name: 'Starting the Coding Club', tags: ['leadership', 'community', 'initiative', 'passion'], usedIn: ['e8'] },
  { id: 'exp4', name: 'Immigrant Family Dinners', tags: ['identity', 'culture', 'family', 'belonging', 'world'], usedIn: [] },
  { id: 'exp5', name: 'Questioning Religious Traditions', tags: ['belief', 'questioning', 'growth', 'identity'], usedIn: [] },
  { id: 'exp6', name: 'First Hackathon All-Nighter', tags: ['passion', 'perseverance', 'discovery', 'teamwork'], usedIn: [] },
  { id: 'exp7', name: 'Tutoring ESL Students', tags: ['empathy', 'community', 'bridge-building', 'communication'], usedIn: [] },
  { id: 'exp8', name: 'Climate Strike Organizer', tags: ['society', 'challenge', 'leadership', 'conviction'], usedIn: [] },
];

// Prompt-specific guidance for each experience (keyed by essayId -> experienceId)
interface PromptFitGuidance {
  matchStrength: 'strong' | 'moderate';
  whyItFits: string;
  framingTips: string[];
  caution?: string;
  // Actionable guidance fields
  startWith?: string;
  focusOn?: string;
  avoidFocus?: string;
  starterSentences?: string[];
}

// Prompt approach guidance - 2-3 line summaries of what each prompt is really asking
const promptApproachMap: Record<string, string> = {
  'e1': 'This prompt is asking about your decision-making process. Focus on the internal conflict and what values drove your choice—not just the outcome.',
  'e2': 'Show that you don\'t just identify problems—you try to solve them. Ground your answer in personal experience, not abstract opinions.',
  'e3': 'This is about identity formation. Focus on moments that shaped who you are, not just what you\'ve done.',
  'e4': 'Paint a vivid picture of your everyday world. Show how your environment shaped your perspective and values.',
  'e5': 'They want to see resilience and self-awareness. Sit in the discomfort of failure before rushing to the lesson.',
  'e6': 'Be specific about Yale, not generic. Show what you\'ll contribute, not just what you\'ll take.',
  'e7': 'Intellectual honesty matters here. Show the process of questioning, not just the conclusion you reached.',
  'e8': 'Focus on how you lead, not just that you led. Show your style, adaptations, and what you learned about leadership.',
};

// Story Pillars - themes that define the student's narrative
const storyPillars = [
  { id: 'p1', theme: 'Bridging worlds through technology', description: 'Making tech accessible across generations and communities' },
  { id: 'p2', theme: 'Learning through failure', description: 'Embracing setbacks as catalysts for growth' },
  { id: 'p3', theme: 'Community building', description: 'Creating spaces where people can learn and grow together' },
  { id: 'p4', theme: 'Cultural navigation', description: 'Moving between identities while staying authentic' },
];

// Writing reminders based on student's voice preferences
const writingReminders = [
  'Show, don\'t tell—use specific moments over abstract claims',
  'Emphasize learning and growth over achievements',
  'Let your authentic voice come through, not what you think they want to hear',
  'One vivid story beats multiple surface-level examples',
];

// Related essays for overlap awareness
interface RelatedEssay {
  collegeId: string;
  collegeName: string;
  essayId: string;
  essayTitle: string;
  overlapReason: string;
}

// Which essays share thematic overlap (for awareness, not automation)
const essayOverlapMap: Record<string, RelatedEssay[]> = {
  'e1': [
    { collegeId: '2', collegeName: 'MIT', essayId: 'e5', essayTitle: 'Challenge or setback', overlapReason: 'Both explore decision-making under pressure' },
  ],
  'e2': [
    { collegeId: '4', collegeName: 'UC Berkeley', essayId: 'e8', essayTitle: 'Leadership Experience', overlapReason: 'Both could highlight your community impact work' },
  ],
  'e5': [
    { collegeId: '1', collegeName: 'Stanford', essayId: 'e1', essayTitle: 'Personal Statement', overlapReason: 'Setback themes overlap with difficult choice narrative' },
  ],
  'e7': [
    { collegeId: '1', collegeName: 'Stanford', essayId: 'e3', essayTitle: 'Meaningful Experience', overlapReason: 'Both explore identity and belief formation' },
  ],
};

// ===== SMART REUSE: Reusable Excerpts from Other Essays =====
interface ReusableExcerpt {
  id: string;
  sourceEssayId: string;
  sourceEssayTitle: string;
  sourceCollegeId: string;
  sourceCollegeName: string;
  excerpt: string;
  themes: string[];
}

// ===== SMART REUSE: Reusable Excerpts from Other Essays =====
interface ReusableExcerpt {
  id: string;
  sourceEssayId: string;
  sourceEssayTitle: string;
  sourceCollegeId: string;
  sourceCollegeName: string;
  excerpt: string;
  themes: string[];
  promptType?: string; // For prioritizing same-type suggestions
}

// Mock excerpts from completed essays (cross-school reuse encouraged)
const reusableExcerpts: ReusableExcerpt[] = [
  {
    id: 'exc1',
    sourceEssayId: 'e5',
    sourceEssayTitle: 'Challenge or setback',
    sourceCollegeId: '2',
    sourceCollegeName: 'MIT',
    excerpt: "Building CardioCatch taught me that engineering isn't just about solving problems, but about choosing problems that matter to real people.",
    themes: ['responsibility', 'impact', 'decision', 'growth', 'purpose'],
    promptType: 'challenge'
  },
  {
    id: 'exc2',
    sourceEssayId: 'e5',
    sourceEssayTitle: 'Challenge or setback',
    sourceCollegeId: '2',
    sourceCollegeName: 'MIT',
    excerpt: "When our first prototype failed in front of the judges, I felt the weight of my team's months of work crumbling. But in that moment of failure, I discovered something unexpected: the freedom to rebuild from scratch.",
    themes: ['failure', 'resilience', 'leadership', 'growth', 'decision', 'setback', 'challenge'],
    promptType: 'challenge'
  },
  {
    id: 'exc3',
    sourceEssayId: 'e6',
    sourceEssayTitle: 'Why Yale?',
    sourceCollegeId: '3',
    sourceCollegeName: 'Yale University',
    excerpt: "What draws me most isn't just the name or prestige—it's the genuine intellectual community where debates spill from classrooms into dining halls, and where diverse perspectives sharpen everyone's thinking.",
    themes: ['community', 'contribution', 'purpose', 'intellectual', 'growth'],
    promptType: 'why-college'
  },
  {
    id: 'exc4',
    sourceEssayId: 'e8',
    sourceEssayTitle: 'Leadership Experience',
    sourceCollegeId: '4',
    sourceCollegeName: 'UC Berkeley',
    excerpt: "Leadership, I learned, isn't about having all the answers—it's about creating space for others to find theirs.",
    themes: ['leadership', 'community', 'growth', 'empathy'],
    promptType: 'leadership'
  },
  {
    id: 'exc5',
    sourceEssayId: 'e6',
    sourceEssayTitle: 'Why Yale?',
    sourceCollegeId: '3',
    sourceCollegeName: 'Yale University',
    excerpt: "I want to be somewhere that challenges me to connect my technical skills with humanistic questions—where building a robot and discussing Dostoevsky happen in the same week, sometimes in the same conversation.",
    themes: ['interdisciplinary', 'purpose', 'contribution', 'intellectual', 'curiosity'],
    promptType: 'why-college'
  }
];

// Prompt theme mapping for matching excerpts
const promptThemeMap: Record<string, string[]> = {
  'e1': ['decision', 'growth', 'responsibility', 'impact', 'choice'],
  'e2': ['purpose', 'community', 'contribution', 'intellectual', 'curiosity', 'growth'], // Why Stanford - matches why-college themes
  'e3': ['identity', 'meaning', 'growth', 'experience'],
  'e4': ['identity', 'background', 'community', 'world'],
  'e5': ['failure', 'resilience', 'growth', 'setback', 'challenge'],
  'e6': ['purpose', 'community', 'contribution'],
  'e7': ['reflection', 'growth', 'belief', 'questioning'],
  'e8': ['leadership', 'community', 'impact'],
};

// Track where excerpts have been reused
interface ExcerptUsageRecord {
  excerptId: string;
  targetCollegeId: string;
  targetCollegeName: string;
  targetEssayId: string;
  targetEssayTitle: string;
}

// Pillars relevant to each prompt
const promptPillarMap: Record<string, string[]> = {
  'e1': ['p1', 'p2'],
  'e2': ['p3', 'p1'],
  'e3': ['p4', 'p2'],
  'e4': ['p4', 'p3'],
  'e5': ['p2', 'p3'],
  'e6': ['p3', 'p1'],
  'e7': ['p4', 'p2'],
  'e8': ['p3', 'p2'],
};

// Dynamic mapping: which experiences fit which prompts and how
const promptExperienceMap: Record<string, Record<string, PromptFitGuidance>> = {
  // e1: Difficult choice prompt
  'e1': {
    'exp1': {
      matchStrength: 'strong',
      whyItFits: 'Shows a genuine moment of choice: taking 3 hours to help vs. giving up. Reveals your values through action.',
      framingTips: [
        'Focus on the internal tension — your impatience vs. her frustration',
        'Show the moment you decided to slow down',
        'End with what you learned about communication, not just tech'
      ],
      caution: 'Avoid making grandma a prop — she should feel real',
      startWith: "The moment of frustration when grandma couldn't swipe properly for the tenth time",
      focusOn: "How you chose patience over giving up — and what that revealed about yourself",
      avoidFocus: "Listing all the features you taught her or focusing on outcomes",
      starterSentences: [
        "My grandmother held the phone like it might shatter in her hands.",
        "After the tenth failed swipe, I felt my patience wearing thin.",
        "That afternoon, I learned that teaching isn't about knowing more — it's about caring more."
      ]
    },
    'exp2': {
      matchStrength: 'moderate',
      whyItFits: 'Demonstrates decision-making under pressure and learning from setbacks.',
      framingTips: [
        'Highlight a specific pivotal decision, not the whole competition',
        'Focus on the internal debate — what you almost did vs. what you chose'
      ],
      caution: 'Already used in "Meaningful Experience" — consider angle variation',
      startWith: "The exact moment you realized the robot wasn't going to work",
      focusOn: "The internal debate between playing it safe and starting over",
      avoidFocus: "Technical specs or competition results",
      starterSentences: [
        "The robot's arm twitched once, then went still.",
        "I remember looking at my team — exhausted, frustrated — and knowing we had a choice to make."
      ]
    }
  },
  // e2: Society challenge prompt
  'e2': {
    'exp8': {
      matchStrength: 'strong',
      whyItFits: 'Directly connects to societal action. Shows you don\'t just identify problems—you try to solve them.',
      framingTips: [
        'Ground it in a specific moment, not the whole movement',
        'Show the human cost you witnessed firsthand',
        'Connect to why Stanford\'s resources matter for this fight'
      ]
    },
    'exp7': {
      matchStrength: 'moderate',
      whyItFits: 'Shows how language barriers create systemic inequity—a societal challenge you\'ve witnessed up close.',
      framingTips: [
        'Focus on one student\'s story to make it personal',
        'Zoom out to the broader access gap',
        'Avoid savior framing—emphasize mutual learning'
      ]
    }
  },
  // e3: Identity prompt
  'e3': {
    'exp4': {
      matchStrength: 'strong',
      whyItFits: 'Family dinners are the perfect lens for exploring cultural identity and belonging.',
      framingTips: [
        'Use sensory details—smells, sounds, languages',
        'Show the tension between two worlds, not just celebration',
        'End with how this shaped who you are, not just what you do'
      ]
    },
    'exp5': {
      matchStrength: 'moderate',
      whyItFits: 'Questioning traditions reveals deep identity formation and intellectual honesty.',
      framingTips: [
        'Be specific about what you questioned and why',
        'Show respect for the tradition even as you diverged',
        'Focus on what you built, not just what you left'
      ],
      caution: 'Handle with care—admissions readers come from all backgrounds'
    }
  },
  // e4: World you come from prompt
  'e4': {
    'exp4': {
      matchStrength: 'strong',
      whyItFits: 'Immigrant family dinners literally describe the world you come from—culture, language, values.',
      framingTips: [
        'Paint the scene vividly—who\'s there, what\'s cooking, what language',
        'Show how this world shaped your perspective',
        'Connect the intimacy of home to the broader community'
      ]
    },
    'exp3': {
      matchStrength: 'moderate',
      whyItFits: 'The coding club became part of your world—a community you built.',
      framingTips: [
        'Focus on the people, not the code',
        'Show how the club changed the school\'s culture',
        'Highlight unexpected connections you made'
      ],
      caution: 'Already used for Berkeley essay—vary the angle significantly'
    }
  },
  // e5: Challenge/setback prompt
  'e5': {
    'exp2': {
      matchStrength: 'strong',
      whyItFits: 'A robotics failure is the perfect challenge story—concrete, stakes are clear, growth is visible.',
      framingTips: [
        'Don\'t skip the failure—sit in the discomfort',
        'Show what you tried, what didn\'t work, what you learned',
        'End with how this changed your approach, not just the outcome'
      ]
    },
    'exp6': {
      matchStrength: 'moderate',
      whyItFits: 'The all-nighter likely had setbacks—code breaking, team friction, exhaustion.',
      framingTips: [
        'Focus on a specific moment things went wrong',
        'Show how you adapted under pressure',
        'Connect to your growth as a collaborator'
      ]
    }
  },
  // e6: Why Yale prompt
  'e6': {
    'exp3': {
      matchStrength: 'strong',
      whyItFits: 'Your club-building experience shows you\'ll contribute to Yale\'s community.',
      framingTips: [
        'Research a specific Yale program or club to connect to',
        'Show what you\'ll bring, not just what you\'ll take',
        'Keep it genuine—don\'t force connections'
      ]
    },
    'exp7': {
      matchStrength: 'moderate',
      whyItFits: 'Your tutoring shows values that align with Yale\'s mission.',
      framingTips: [
        'Connect to specific Yale resources or programs',
        'Show how Yale will amplify your impact',
        'Be specific about what draws you there'
      ]
    }
  },
  // e7: Questioned a belief prompt
  'e7': {
    'exp5': {
      matchStrength: 'strong',
      whyItFits: 'This is literally about questioning beliefs—your most authentic answer.',
      framingTips: [
        'Be honest about the internal conflict',
        'Show the process of questioning, not just the conclusion',
        'Demonstrate intellectual humility and curiosity'
      ]
    },
    'exp1': {
      matchStrength: 'moderate',
      whyItFits: 'Teaching grandma challenged your belief that tech skills are what matter most.',
      framingTips: [
        'Frame it as a belief you held: "I used to think being good at tech was enough"',
        'Show how human connection changed your perspective',
        'Connect to how you approach problems now'
      ]
    }
  },
  // e8: Leadership prompt
  'e8': {
    'exp3': {
      matchStrength: 'strong',
      whyItFits: 'Founding a club is direct leadership evidence with clear impact.',
      framingTips: [
        'Focus on a specific leadership challenge you faced',
        'Show how you adapted your style for different people',
        'Quantify impact if possible, but keep it human'
      ]
    },
    'exp2': {
      matchStrength: 'moderate',
      whyItFits: 'Competition failure can show leadership in adversity.',
      framingTips: [
        'Focus on leading your team through the setback',
        'Show vulnerability—leaders don\'t have all answers',
        'Highlight what you learned about leading under pressure'
      ],
      caution: 'Already used in another essay—vary the leadership angle'
    }
  }
};

// Get experiences that match the current prompt
const getExperiencesForPrompt = (essayId: string): (StoryExperience & { guidance: PromptFitGuidance })[] => {
  const promptMapping = promptExperienceMap[essayId];
  if (!promptMapping) return [];

  return Object.entries(promptMapping).map(([expId, guidance]) => {
    const experience = experienceBank.find(e => e.id === expId);
    if (!experience) return null;
    return { ...experience, guidance };
  }).filter(Boolean) as (StoryExperience & { guidance: PromptFitGuidance })[];
};

// ===== HELPER FUNCTIONS =====
const getEssaySnapshot = (essays: Essay[]): string => {
  const inProgress = essays.filter(e => e.status === 'in-progress').length;
  const complete = essays.filter(e => e.status === 'complete').length;
  const notStarted = essays.filter(e => e.status === 'not-started').length;
  const total = essays.length;

  if (complete === total) return 'All essays drafted';
  if (notStarted === total) return `${total} essays • not started yet`;
  if (inProgress > 0) return `${total} essays • ${inProgress} in progress`;
  return `${total} essays • ${complete} complete`;
};

const getStatusDot = (status: Essay['status']) => {
  switch (status) {
    case 'complete': return 'bg-emerald-500';
    case 'in-progress': return 'bg-primary';
    default: return 'bg-muted-foreground/30';
  }
};

// Check if deadline is approaching (within 14 days)
const isDeadlineApproaching = (deadline?: string): boolean => {
  if (!deadline) return false;
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  const parts = deadline.split(' ');
  if (parts.length !== 2) return false;
  const month = months[parts[0]];
  const day = parseInt(parts[1]);
  if (month === undefined || isNaN(day)) return false;
  const currentYear = new Date().getFullYear();
  const deadlineDate = new Date(currentYear, month, day);
  const now = new Date();
  // If deadline is in the past this year, assume next year
  if (deadlineDate < now) {
    deadlineDate.setFullYear(currentYear + 1);
  }
  const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntil <= 14 && daysUntil >= 0;
};

// ===== MAIN COMPONENT =====
const LaunchPadWorkspace: React.FC<LaunchPadWorkspaceProps> = ({
  onAddCollege,
  onExport,
  onEditStoryIdentity,
  onLogoClick,
  onLogout,
}) => {
  // State
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());
  const [activeEssay, setActiveEssay] = useState<{ collegeId: string; essayId: string } | null>(null);
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareRecipientType, setShareRecipientType] = useState<'parent' | 'counselor'>('parent');
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [isShareSent, setIsShareSent] = useState(false);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [lockedExperience, setLockedExperience] = useState<string | null>(null);

  // Smart Reuse state
  const [excerptUsages, setExcerptUsages] = useState<ExcerptUsageRecord[]>([]);
  const [dismissedExcerpts, setDismissedExcerpts] = useState<Set<string>>(new Set());
  const [insertedReferences, setInsertedReferences] = useState<{ id: string; excerptId: string; text: string; sourceName: string }[]>([]);

  // Starter text state - tracks when starter sentences were added
  const [showStarterHelper, setShowStarterHelper] = useState(false);

  // Prompt editing state
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editedPromptText, setEditedPromptText] = useState('');
  const [editedWordLimit, setEditedWordLimit] = useState(250);
  const [showDeletePromptDialog, setShowDeletePromptDialog] = useState(false);

  // Workspace tab state: 'write' or 'personal-lens'
  const [workspaceTab, setWorkspaceTab] = useState<'write' | 'personal-lens'>('write');

  // Personal Lens notes state
  const [personalLensNotes, setPersonalLensNotes] = useState<PersonalLensNote[]>([
    { id: 'pl1', content: 'The way my dad hums while cooking—it reminds me that joy doesn\'t need an audience.', category: 'observation', createdAt: new Date() },
    { id: 'pl2', content: 'Translating for my grandmother at the doctor\'s office made me realize how much trust she places in me.', category: 'responsibility', createdAt: new Date() },
  ]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<PersonalLensNote['category']>('moment');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');

  // Generated story suggestions from Personal Lens notes
  interface GeneratedSuggestion {
    id: string;
    noteId: string;
    noteContent: string;
    suggestion: string;
    matchStrength: 'strong' | 'moderate';
  }
  const [generatedSuggestions, setGeneratedSuggestions] = useState<GeneratedSuggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Calendar view state
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');

  // Onboarding state
  const { showOnboarding, setShowOnboarding, completeOnboarding, resetOnboarding } = useOnboardingState();

  // Derived state
  const currentCollege = activeEssay ? mockColleges.find(c => c.id === activeEssay.collegeId) : null;
  const currentEssay = currentCollege?.essays.find(e => e.id === activeEssay?.essayId);
  const wordLimit = currentEssay?.wordLimit || 650;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const isOverLimit = wordCount > wordLimit;

  // Load essay content when active essay changes
  useEffect(() => {
    if (currentEssay) {
      setContent(currentEssay.content);
    }
  }, [activeEssay?.essayId]);

  // Simulated autosave
  useEffect(() => {
    if (content && activeEssay) {
      setIsSaving(true);
      const timer = setTimeout(() => {
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [content, activeEssay]);

  // Handlers
  const toggleCollegeExpanded = (collegeId: string) => {
    setExpandedColleges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(collegeId)) {
        newSet.delete(collegeId);
      } else {
        newSet.add(collegeId);
      }
      return newSet;
    });
  };

  const handleSelectEssay = (collegeId: string, essayId: string) => {
    setActiveEssay({ collegeId, essayId });
  };

  const toggleFormat = (format: string) => {
    setActiveFormats(prev => {
      const newSet = new Set(prev);
      if (newSet.has(format)) {
        newSet.delete(format);
      } else {
        newSet.add(format);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleShareSubmit = () => {
    if (shareEmail.trim()) {
      setIsShareSent(true);
      setTimeout(() => {
        setShowShareDialog(false);
        setIsShareSent(false);
        setShareEmail('');
        setSharePermission('view');
      }, 2000);
    }
  };

  // Handler for minimizing editor and returning to College Map view
  const handleMinimizeEditor = () => {
    setIsEditorMinimized(true);
  };

  const handleMaximizeEditor = () => {
    setIsEditorMinimized(false);
  };

  // Smart Reuse: Get matching excerpts for current prompt (cross-school only)
  const getSmartReuseExcerpts = () => {
    if (!currentEssay || !currentCollege) return [];

    const promptThemes = promptThemeMap[currentEssay.id] || [];
    const currentPromptType = currentEssay.promptType; // e.g., 'why-college'

    // Filter: only from DIFFERENT schools, not dismissed, has theme overlap OR same prompt type
    return reusableExcerpts
      .filter(exc => {
        // Must be from different school
        if (exc.sourceCollegeId === currentCollege.id) return false;
        // Must not be dismissed for this essay
        if (dismissedExcerpts.has(`${exc.id}-${currentEssay.id}`)) return false;
        // Has thematic overlap OR same prompt type
        const hasOverlap = exc.themes.some(t =>
          promptThemes.some(pt => t.includes(pt) || pt.includes(t))
        );
        const hasSamePromptType = currentPromptType && exc.promptType === currentPromptType;
        return hasOverlap || hasSamePromptType;
      })
      .map(exc => {
        // Check if already reused at this same school (different essay)
        const sameSchoolReuse = excerptUsages.find(u =>
          u.excerptId === exc.id &&
          u.targetCollegeId === currentCollege.id &&
          u.targetEssayId !== currentEssay.id
        );

        // Generate "why it works" based on overlapping themes
        const overlappingThemes = exc.themes.filter(t =>
          promptThemes.some(pt => t.includes(pt) || pt.includes(t))
        );
        const themeLabels: Record<string, string> = {
          'responsibility': 'responsibility',
          'impact': 'meaningful impact',
          'decision': 'decision-making',
          'growth': 'personal growth',
          'failure': 'learning from setbacks',
          'resilience': 'resilience',
          'leadership': 'leadership',
          'challenge': 'facing challenges',
          'setback': 'overcoming setbacks',
          'community': 'community focus',
          'contribution': 'contribution',
          'purpose': 'sense of purpose',
          'intellectual': 'intellectual curiosity',
          'curiosity': 'curiosity',
          'interdisciplinary': 'interdisciplinary thinking'
        };

        // For same prompt type from other colleges, create a more specific message
        const hasSamePromptType = currentPromptType && exc.promptType === currentPromptType;
        let whyItWorks: string;

        if (hasSamePromptType) {
          whyItWorks = `This is from another "${exc.promptType === 'why-college' ? 'Why This School' : exc.promptType}" essay. The framing and insights may transfer well.`;
        } else {
          const descriptions = overlappingThemes.slice(0, 2).map(t => themeLabels[t] || t);
          whyItWorks = descriptions.length === 1
            ? `This excerpt reflects ${descriptions[0]}, which aligns with what this prompt is asking.`
            : `This excerpt reflects ${descriptions.join(' and ')}, which aligns with what this prompt is asking.`;
        }

        return {
          ...exc,
          whyItWorks,
          sameSchoolWarning: sameSchoolReuse
            ? `You've already reused a similar passage for "${sameSchoolReuse.targetEssayTitle}". Consider focusing on a different moment or insight here.`
            : undefined,
          matchesSamePromptType: hasSamePromptType
        };
      })
      // Prioritize: same prompt type first, then deprioritize same-school warnings
      .sort((a, b) => {
        // First priority: same prompt type (from other colleges)
        if (a.matchesSamePromptType && !b.matchesSamePromptType) return -1;
        if (!a.matchesSamePromptType && b.matchesSamePromptType) return 1;

        // Second priority: deprioritize same-school warnings
        if (a.sameSchoolWarning && !b.sameSchoolWarning) return 1;
        if (!a.sameSchoolWarning && b.sameSchoolWarning) return -1;
        return 0;
      });
  };

  // Handle inserting excerpt as reference
  const handleInsertAsReference = (excerpt: ReusableExcerpt & { whyItWorks: string }) => {
    if (!currentCollege || !currentEssay) return;

    // Track the usage
    setExcerptUsages(prev => [
      ...prev,
      {
        excerptId: excerpt.id,
        targetCollegeId: currentCollege.id,
        targetCollegeName: currentCollege.name,
        targetEssayId: currentEssay.id,
        targetEssayTitle: currentEssay.title
      }
    ]);

    // Add to inserted references
    setInsertedReferences(prev => [
      ...prev,
      {
        id: `ref-${Date.now()}`,
        excerptId: excerpt.id,
        text: excerpt.excerpt,
        sourceName: `${excerpt.sourceCollegeName} — ${excerpt.sourceEssayTitle}`
      }
    ]);
  };

  // Handle dismissing an excerpt
  const handleDismissExcerpt = (excerptId: string) => {
    if (!currentEssay) return;
    setDismissedExcerpts(prev => new Set(prev).add(`${excerptId}-${currentEssay.id}`));
  };

  // Remove an inserted reference
  const handleRemoveReference = (refId: string) => {
    setInsertedReferences(prev => prev.filter(r => r.id !== refId));
  };

  // Personal Lens handlers
  const handleAddPersonalLensNote = () => {
    if (!newNoteContent.trim()) return;
    const newNote: PersonalLensNote = {
      id: `pl-${Date.now()}`,
      content: newNoteContent.trim(),
      category: newNoteCategory,
      createdAt: new Date()
    };
    setPersonalLensNotes(prev => [newNote, ...prev]);
    setNewNoteContent('');
    setNewNoteCategory('moment');
  };

  const handleDeletePersonalLensNote = (noteId: string) => {
    setPersonalLensNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const handleEditPersonalLensNote = (noteId: string) => {
    const note = personalLensNotes.find(n => n.id === noteId);
    if (note) {
      setEditingNoteId(noteId);
      setEditingNoteContent(note.content);
    }
  };

  const handleSaveEditedNote = () => {
    if (!editingNoteId || !editingNoteContent.trim()) return;
    setPersonalLensNotes(prev => prev.map(n =>
      n.id === editingNoteId ? { ...n, content: editingNoteContent.trim() } : n
    ));
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleOpenPersonalLens = () => {
    setWorkspaceTab('personal-lens');
  };

  const getCategoryLabel = (category: PersonalLensNote['category']) => {
    return PERSONAL_LENS_CATEGORIES.find(c => c.value === category)?.label || category;
  };

  // Generate story suggestions from a Personal Lens note
  // Generate story suggestions from a Personal Lens note
  const handleGenerateSuggestionsFromNote = async (note: PersonalLensNote) => {
    // Determine the current essay prompt if available, otherwise generic
    const promptText = currentEssay?.prompt || "How does your background shape your story?";

    // Optimistic UI or Loading state could be added here
    try {
      const response = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt_text: promptText,
          essay_content: `Context: This user has a personal lens note about: ${note.content} (Category: ${note.category})`
        })
      });

      if (!response.ok) throw new Error("Failed to fetch suggestion");

      const aiResponse = await response.json();
      let parsedContent;
      try {
        parsedContent = JSON.parse(aiResponse.content);
      } catch (e) {
        parsedContent = { why_it_fits: aiResponse.content };
      }

      const newSuggestion: GeneratedSuggestion = {
        id: `gen-${Date.now()}`,
        noteId: note.id,
        noteContent: note.content,
        suggestion: parsedContent.why_it_fits || "No suggestion generated.",
        matchStrength: 'strong'
      };

      setGeneratedSuggestions(prev => [...prev, newSuggestion]);

    } catch (e) {
      console.error("Failed to generate suggestion", e);
    }
  };

  // Dismiss a story suggestion
  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(suggestionId));
  };

  // Dismiss an experience-based suggestion
  const handleDismissExperienceSuggestion = (experienceId: string) => {
    if (!currentEssay) return;
    setDismissedSuggestions(prev => new Set(prev).add(`exp-${experienceId}-${currentEssay.id}`));
  };

  // Get Smart Reuse suggestions
  const smartReuseExcerpts = getSmartReuseExcerpts();
  // Show smart reuse when there are suggestions (for essays with same prompt type, we show early)
  const hasWrittenContent = content.trim().length > 50;
  const hasSameTypeExcerpts = smartReuseExcerpts.some(e => e.matchesSamePromptType);
  const showSmartReuse = (hasWrittenContent || hasSameTypeExcerpts) && smartReuseExcerpts.length > 0;

  // Prompt editing handlers
  const handleStartEditingPrompt = () => {
    if (currentEssay) {
      setEditedPromptText(currentEssay.prompt);
      setEditedWordLimit(currentEssay.wordLimit);
      setIsEditingPrompt(true);
    }
  };

  const handleSavePromptEdit = () => {
    // In a real app, this would update the backend
    // For now, we just close the editing mode
    setIsEditingPrompt(false);
  };

  const handleCancelPromptEdit = () => {
    setIsEditingPrompt(false);
    setEditedPromptText('');
    setEditedWordLimit(250);
  };

  const handleDeletePrompt = () => {
    // In a real app, this would delete the prompt from the backend
    // For now, close the dialog and deselect the essay
    setShowDeletePromptDialog(false);
    setActiveEssay(null);
    setIsEditorMinimized(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* GLOBAL HEADER - Lightweight, persistent */}
      <header className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-30">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: LaunchPad logo/name - clicking returns to College Map */}
          <ColleeLogo
            size="sm"
            onClick={onLogoClick || (() => {
              setActiveEssay(null);
              setIsEditorMinimized(false);
            })}
          />

          {/* Center: Context label (only when writing) */}
          {activeEssay && currentCollege && !isEditorMinimized && (
            <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground">
              <span>Writing</span>
              <span className="text-muted-foreground/50">·</span>
              <span className="font-medium text-foreground">{currentCollege.name}</span>
            </div>
          )}

          {/* Right: Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <User className="w-4 h-4 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem className="cursor-pointer" onClick={resetOnboarding}>
                <HelpCircle className="w-4 h-4 mr-2" />
                How LaunchPad works
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={onEditStoryIdentity}>
                <EditIcon className="w-4 h-4 mr-2" />
                Edit Story Identity
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Editor preferences
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setShowShareDialog(true)}>
                <Share2 className="w-4 h-4 mr-2" />
                Sharing
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-muted-foreground" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL - College Map (collapsible when editing) */}
        <AnimatePresence initial={false}>
          {(showLeftPanel || isEditorMinimized || !activeEssay) && (
            <motion.aside
              className={`border-r border-border bg-card/50 flex flex-col overflow-hidden ${isEditorMinimized || !activeEssay ? 'flex-1' : 'w-80 flex-shrink-0'
                }`}
              initial={{ width: 0, opacity: 0 }}
              animate={{
                width: isEditorMinimized || !activeEssay ? '100%' : 320,
                opacity: 1
              }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {/* Sidebar Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {viewMode === 'cards' ? (
                        <MapPin className="w-4 h-4 text-primary" />
                      ) : (
                        <Calendar className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <h1 className="text-body font-semibold text-foreground">
                        {viewMode === 'cards' ? 'Your Colleges' : 'Deadline Calendar'}
                      </h1>
                      <p className="text-body-sm text-muted-foreground">
                        {viewMode === 'cards' ? 'Click to expand • click essay to write' : 'Overview of upcoming deadlines'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-0.5 mr-1">
                      <button
                        onClick={() => setViewMode('cards')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        title="Card view"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                          }`}
                        title="Calendar view"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {/* Maximize button when editor minimized */}
                    {isEditorMinimized && activeEssay && (
                      <button
                        onClick={handleMaximizeEditor}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Return to writing"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* Collapse button - only show when editor is open */}
                    {activeEssay && !isEditorMinimized && (
                      <button
                        onClick={() => setShowLeftPanel(false)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title="Collapse panel"
                      >
                        <PanelLeftClose className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* College List with Card Layout OR Calendar View */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {viewMode === 'calendar' ? (
                  /* Calendar View */
                  <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Simple calendar grid showing deadlines */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Generate calendar days - showing a month view */}
                      {Array.from({ length: 35 }, (_, i) => {
                        const dayNumber = i - 3; // Offset to start on correct weekday
                        const isValidDay = dayNumber >= 1 && dayNumber <= 31;

                        // Find colleges with deadlines on this day
                        const collegesOnDay = mockColleges.filter(c => {
                          if (!c.deadline) return false;
                          const dayMatch = c.deadline.match(/\d+/);
                          return dayMatch && parseInt(dayMatch[0]) === dayNumber;
                        });

                        return (
                          <div
                            key={i}
                            className={`min-h-[80px] p-1.5 rounded-lg border transition-colors ${isValidDay
                                ? collegesOnDay.length > 0
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-border bg-card hover:bg-muted/50'
                                : 'border-transparent bg-transparent'
                              }`}
                          >
                            {isValidDay && (
                              <>
                                <span className={`text-xs font-medium ${collegesOnDay.length > 0 ? 'text-primary' : 'text-muted-foreground'
                                  }`}>
                                  {dayNumber}
                                </span>
                                {collegesOnDay.length > 0 && (
                                  <div className="mt-1 space-y-1">
                                    {collegesOnDay.map(college => (
                                      <div
                                        key={college.id}
                                        className="px-1.5 py-0.5 rounded bg-primary/20 text-xs text-primary truncate"
                                        title={college.name}
                                      >
                                        {college.name.length > 10 ? college.name.substring(0, 10) + '...' : college.name}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
                        <span>Deadline</span>
                      </div>
                    </div>

                    {/* Upcoming list */}
                    <div className="mt-8">
                      <h3 className="text-body-sm font-medium text-foreground mb-3">Upcoming Deadlines</h3>
                      <div className="space-y-2">
                        {mockColleges
                          .filter(c => c.deadline)
                          .sort((a, b) => {
                            const aDay = parseInt(a.deadline?.match(/\d+/)?.[0] || '99');
                            const bDay = parseInt(b.deadline?.match(/\d+/)?.[0] || '99');
                            return aDay - bDay;
                          })
                          .map(college => (
                            <div
                              key={college.id}
                              className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${isDeadlineApproaching(college.deadline) ? 'bg-amber-500' : 'bg-primary'
                                  }`} />
                                <span className="text-body-sm font-medium text-foreground">{college.name}</span>
                              </div>
                              <span className={`text-body-sm ${isDeadlineApproaching(college.deadline) ? 'text-amber-600 font-medium' : 'text-muted-foreground'
                                }`}>
                                {college.deadline}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Card View */
                  <div className={`${isEditorMinimized || !activeEssay
                      ? 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto'
                      : 'space-y-3'
                    }`}>
                    {mockColleges.map((college) => {
                      const deadlineApproaching = isDeadlineApproaching(college.deadline);
                      const essaySnapshot = getEssaySnapshot(college.essays);
                      const [essayCount, essayStatus] = essaySnapshot.split(' • ');

                      return (
                        <div
                          key={college.id}
                          className={`rounded-2xl border overflow-hidden transition-all ${deadlineApproaching
                              ? 'border-amber-200/80 dark:border-amber-800/40'
                              : 'border-border hover:border-primary/30 hover:shadow-md'
                            } bg-card ${isEditorMinimized || !activeEssay ? 'h-fit' : ''}`}
                        >
                          {/* College Card Content */}
                          {isEditorMinimized || !activeEssay ? (
                            // Expanded Card View
                            <div className="p-5">
                              {/* College Name */}
                              <h3 className="text-lg font-semibold text-foreground mb-1">
                                {college.name}
                              </h3>

                              {/* Deadline */}
                              {college.deadline && (
                                <div className={`flex items-center gap-2 mb-3 ${deadlineApproaching ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                  {deadlineApproaching ? (
                                    <>
                                      <div className="relative flex items-center justify-center">
                                        <Clock className="w-4 h-4" />
                                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                                      </div>
                                      <span className="text-body-sm font-medium">
                                        Due soon · {college.deadline}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4 text-muted-foreground/60" />
                                      <span className="text-body-sm">
                                        Due {college.deadline}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}

                              {/* Essay Summary */}
                              <p className="text-body text-muted-foreground mb-5">
                                {essayCount} • {essayStatus}
                              </p>

                              {/* Action Button */}
                              <Button
                                variant="collee"
                                size="sm"
                                onClick={() => {
                                  toggleCollegeExpanded(college.id);
                                  // Select first essay and open editor
                                  if (college.essays.length > 0) {
                                    handleSelectEssay(college.id, college.essays[0].id);
                                    setIsEditorMinimized(false);
                                  }
                                }}
                                className="w-full"
                              >
                                Open essays
                              </Button>
                            </div>
                          ) : (
                            // Compact Sidebar View (when editor is open)
                            <>
                              <button
                                onClick={() => toggleCollegeExpanded(college.id)}
                                className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-body-sm font-medium text-foreground truncate">
                                      {college.name}
                                    </h3>
                                    <div className={`flex items-center gap-1.5 text-xs mt-0.5 ${deadlineApproaching ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
                                      {deadlineApproaching && (
                                        <div className="relative flex items-center justify-center">
                                          <Clock className="w-3 h-3" />
                                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                                        </div>
                                      )}
                                      {college.deadline && (
                                        <span className={deadlineApproaching ? 'font-medium' : ''}>
                                          {deadlineApproaching ? `Due soon · ${college.deadline}` : `Due ${college.deadline}`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">
                                      {essayCount}
                                    </span>
                                    {expandedColleges.has(college.id) ? (
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                {!expandedColleges.has(college.id) && (
                                  <p className="text-xs text-muted-foreground/70 mt-1">
                                    {essayStatus}
                                  </p>
                                )}
                              </button>

                              {/* Expanded Essays - Inline */}
                              <AnimatePresence>
                                {expandedColleges.has(college.id) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-2">
                                      {college.essays.map((essay) => (
                                        <button
                                          key={essay.id}
                                          onClick={() => {
                                            handleSelectEssay(college.id, essay.id);
                                            setIsEditorMinimized(false);
                                          }}
                                          className={`w-full p-2.5 rounded-lg text-left transition-all ${activeEssay?.essayId === essay.id
                                              ? 'bg-primary/10 border border-primary/30'
                                              : 'hover:bg-muted/50 border border-transparent'
                                            }`}
                                        >
                                          <div className="flex items-start gap-2">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getStatusDot(essay.status)}`} />
                                            <div className="flex-1 min-w-0">
                                              <p className={`text-body-sm font-medium truncate ${activeEssay?.essayId === essay.id ? 'text-primary' : 'text-foreground'
                                                }`}>
                                                {essay.title}
                                              </p>
                                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                {essay.prompt}
                                              </p>
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </>
                          )}
                        </div>
                      );
                    })}

                    {/* Add College Button */}
                    <div className={isEditorMinimized || !activeEssay ? 'md:col-span-2 max-w-md mx-auto w-full' : ''}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onAddCollege}
                        className="w-full mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add a college
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-border">
                <p className="text-xs text-center text-muted-foreground/60">
                  Take your time. You're making progress.
                </p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Collapsed Left Panel - expand button */}
        {!showLeftPanel && activeEssay && !isEditorMinimized && (
          <div className="flex-shrink-0 border-r border-border bg-card/50">
            <button
              onClick={() => setShowLeftPanel(true)}
              className="p-3 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Show colleges"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CENTER - Essay Workspace (hidden when minimized) */}
        {activeEssay && currentEssay && !isEditorMinimized && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header Bar with Tabs */}
            <motion.header
              className="border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0 z-20"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Back to colleges button - prominent and clear */}
                  <button
                    onClick={() => {
                      setActiveEssay(null);
                      setIsEditorMinimized(false);
                      setWorkspaceTab('write');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground border border-border"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-body-sm font-medium">Your Colleges</span>
                  </button>
                  <div className="h-5 w-px bg-border" />
                  <div>
                    <p className="text-body font-medium text-foreground">{currentEssay?.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Save Status - only show in Write tab */}
                  {workspaceTab === 'write' && (
                    <div className="hidden sm:flex items-center gap-2 text-body-sm text-muted-foreground mr-2">
                      {isSaving ? (
                        <span className="animate-pulse">Saving...</span>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span>Saved {formatTime(lastSaved)}</span>
                        </>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => setShowVersionHistory(true)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Version history"
                  >
                    <History className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={onExport}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Export"
                  >
                    <Download className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Workspace Tabs - Write / Personal Lens */}
              <div className="px-4 pb-0">
                <Tabs value={workspaceTab} onValueChange={(v) => setWorkspaceTab(v as 'write' | 'personal-lens')}>
                  <TabsList className="bg-transparent p-0 h-auto gap-4">
                    <TabsTrigger
                      value="write"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                    >
                      <PenLine className="w-4 h-4 mr-1.5" />
                      Write
                    </TabsTrigger>
                    <TabsTrigger
                      value="personal-lens"
                      className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary text-muted-foreground data-[state=active]:text-foreground"
                    >
                      <Heart className="w-4 h-4 mr-1.5" />
                      Personal Lens
                      {personalLensNotes.length > 0 && (
                        <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">{personalLensNotes.length}</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </motion.header>

            {/* Main Content Area - Switch between Write and Personal Lens */}
            <div className="flex-1 flex overflow-hidden">
              {/* PERSONAL LENS TAB CONTENT */}
              {workspaceTab === 'personal-lens' && (
                <main className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-2xl mx-auto">
                      {/* Personal Lens Header */}
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h2 className="text-heading-sm text-foreground">Personal Lens</h2>
                            <p className="text-body-sm text-muted-foreground">What makes your story yours</p>
                          </div>
                        </div>

                        {/* Value proposition - calm framing */}
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <p className="text-body-sm text-foreground leading-relaxed">
                            The more you share here, the more personal and specific your story suggestions will be.
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            These notes are optional. Add what feels right — there's no wrong answer.
                          </p>
                        </div>
                      </div>

                      {/* Add New Note */}
                      <div className="mb-8 p-4 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-2 mb-3">
                          <Plus className="w-4 h-4 text-primary" />
                          <span className="text-body-sm font-medium text-foreground">Add a note</span>
                        </div>

                        {/* Category Selection */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PERSONAL_LENS_CATEGORIES.map(cat => (
                            <button
                              key={cat.value}
                              onClick={() => setNewNoteCategory(cat.value as PersonalLensNote['category'])}
                              className={`px-3 py-1.5 rounded-full text-xs transition-colors ${newNoteCategory === cat.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Note Input */}
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder={PERSONAL_LENS_CATEGORIES.find(c => c.value === newNoteCategory)?.placeholder || 'Write a short note...'}
                          className="min-h-[80px] resize-none mb-3"
                        />

                        <div className="flex justify-end">
                          <Button
                            variant="collee"
                            size="sm"
                            onClick={handleAddPersonalLensNote}
                            disabled={!newNoteContent.trim()}
                          >
                            <Plus className="w-4 h-4 mr-1.5" />
                            Add Note
                          </Button>
                        </div>
                      </div>

                      {/* Existing Notes */}
                      <div className="space-y-3">
                        <h3 className="text-body-sm font-medium text-muted-foreground uppercase tracking-wide">
                          Your Notes ({personalLensNotes.length})
                        </h3>

                        {personalLensNotes.length === 0 ? (
                          <div className="text-center py-12">
                            <Heart className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-body-sm text-muted-foreground">No notes yet.</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              Start by capturing a moment, observation, or value that matters to you.
                            </p>
                          </div>
                        ) : (
                          <AnimatePresence>
                            {personalLensNotes.map((note) => (
                              <motion.div
                                key={note.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl border border-border bg-card group"
                              >
                                {editingNoteId === note.id ? (
                                  <div className="space-y-3">
                                    <Textarea
                                      value={editingNoteContent}
                                      onChange={(e) => setEditingNoteContent(e.target.value)}
                                      className="min-h-[60px] resize-none"
                                    />
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditingNoteId(null);
                                          setEditingNoteContent('');
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="collee"
                                        size="sm"
                                        onClick={handleSaveEditedNote}
                                      >
                                        Save
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground mb-2">
                                          {getCategoryLabel(note.category)}
                                        </span>
                                        <p className="text-body-sm text-foreground leading-relaxed">
                                          {note.content}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => handleEditPersonalLensNote(note.id)}
                                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                          title="Edit"
                                        >
                                          <EditIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePersonalLensNote(note.id)}
                                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Generate Story Suggestions Button */}
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <button
                                        onClick={() => handleGenerateSuggestionsFromNote(note)}
                                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                      >
                                        <Wand2 className="w-3.5 h-3.5" />
                                        Generate story suggestions from this note
                                      </button>
                                      {generatedSuggestions.some(s => s.noteId === note.id) && (
                                        <p className="text-xs text-muted-foreground text-center mt-2 italic">
                                          ✓ Suggestions generated — view them in the Write tab
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>

                      {/* How it helps - subtle footer */}
                      {personalLensNotes.length > 0 && (
                        <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-body-sm font-medium text-foreground mb-1">
                                These notes improve your suggestions
                              </p>
                              <p className="text-xs text-muted-foreground">
                                When you write essays, we'll reference these notes to give you more tailored story ideas and starting points. You're always in control of what you share.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </main>
              )}

              {/* WRITE TAB CONTENT */}
              {workspaceTab === 'write' && (
                <>
                  {/* Editor */}
                  <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Formatting Toolbar */}
                    <div className="border-b border-border bg-card/50 px-4 py-2 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleFormat('bold')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('bold')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('italic')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('italic')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('underline')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('underline')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <Underline className="w-4 h-4" />
                        </button>
                        <div className="w-px h-5 bg-border mx-1" />
                        <button
                          onClick={() => toggleFormat('bullet')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('bullet')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleFormat('numbered')}
                          className={`p-2 rounded-lg transition-colors ${activeFormats.has('numbered')
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted text-muted-foreground'
                            }`}
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                        title={showRightPanel ? 'Hide guidance' : 'Show guidance'}
                      >
                        {showRightPanel ? (
                          <PanelRightClose className="w-4 h-4" />
                        ) : (
                          <PanelRightOpen className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 overflow-y-auto px-6 py-8">
                      <div className="max-w-2xl mx-auto">
                        {/* Prompt Display - Above Editor */}
                        <div className="mb-6 p-4 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Prompt</span>
                              </div>
                              <p className="text-body text-foreground leading-relaxed">
                                {currentEssay?.prompt}
                              </p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {currentEssay?.wordLimit} words max
                              </span>
                              <button
                                onClick={handleStartEditingPrompt}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit prompt"
                              >
                                <EditIcon className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {insertedReferences.map((ref) => (
                            <motion.div
                              key={ref.id}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20 relative group"
                            >
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleRemoveReference(ref.id)}
                                  className="p-1.5 rounded-lg bg-background/80 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Remove reference"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-start gap-3">
                                <Quote className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-foreground/80 italic leading-relaxed mb-2">
                                    "{ref.text}"
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    From: {ref.sourceName}
                                  </p>
                                  <p className="text-xs text-primary mt-2 flex items-center gap-1.5">
                                    <Lightbulb className="w-3 h-3" />
                                    This is a starting point — revise or delete freely.
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {/* Starter Text Helper */}
                        <AnimatePresence>
                          {showStarterHelper && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20"
                            >
                              <p className="text-xs text-primary flex items-center gap-1.5">
                                <Lightbulb className="w-3 h-3" />
                                This is just a starting point — revise freely or delete.
                              </p>
                              <button
                                onClick={() => setShowStarterHelper(false)}
                                className="p-1 rounded hover:bg-primary/10 text-primary/60 hover:text-primary transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Start writing your essay..."
                          className="w-full min-h-[500px] bg-transparent text-foreground text-lg leading-relaxed resize-none focus:outline-none placeholder:text-muted-foreground/50"
                          style={{
                            fontWeight: activeFormats.has('bold') ? 600 : 400,
                            fontStyle: activeFormats.has('italic') ? 'italic' : 'normal',
                            textDecoration: activeFormats.has('underline') ? 'underline' : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer - Word Count */}
                    <div className="border-t border-border bg-card/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-body font-medium ${isOverLimit ? 'text-destructive' : 'text-foreground'}`}>
                          {wordCount}
                        </span>
                        <span className="text-body text-muted-foreground">/ {wordLimit} words</span>
                      </div>
                    </div>
                  </main>

                  {/* RIGHT PANEL - Context & Guidance (Collapsible) */}
                  <AnimatePresence>
                    {showRightPanel && (
                      <motion.aside
                        className="w-80 border-l border-border bg-card/50 flex-shrink-0 overflow-y-auto hidden lg:block"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 320 }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-4 space-y-4">
                          {/* Personal Lens Generated Suggestions */}
                          {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length > 0 && (
                            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                              <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                <Heart className="w-4 h-4 text-primary" />
                                Based on your Personal Lens
                              </h3>
                              <div className="space-y-3">
                                {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).map((suggestion) => (
                                  <div key={suggestion.id} className="p-3 rounded-lg bg-background border border-border group">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className="text-xs text-foreground leading-relaxed flex-1">
                                        {suggestion.suggestion}
                                      </p>
                                      <button
                                        onClick={() => handleDismissSuggestion(suggestion.id)}
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                        title="Dismiss suggestion"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 italic">
                                      From: "{suggestion.noteContent.substring(0, 40)}..."
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedSuggestions.filter(s => !dismissedSuggestions.has(s.id)).length > 0 && (
                            <div className="my-4">
                              <Separator className="bg-border/60" />
                            </div>
                          )}

                          {/* Section 3: Story Suggestions for This Prompt */}
                          {(() => {
                            const experienceSuggestions = currentEssay ? getExperiencesForPrompt(currentEssay.id) : [];
                            const lockedExp = lockedExperience ? experienceSuggestions.find(e => e.id === lockedExperience) : null;

                            // If experience is locked in, show Section 4: Selected Angle
                            if (lockedExp) {
                              return (
                                <div className="rounded-lg bg-muted/20 p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                      Selected Angle
                                    </h3>
                                    <button
                                      onClick={() => {
                                        setLockedExperience(null);
                                        setSelectedExperience(null);
                                      }}
                                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      Change
                                    </button>
                                  </div>

                                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                      <BookOpen className="w-4 h-4 text-emerald-600" />
                                      <span className="text-body-sm font-medium text-foreground">{lockedExp.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-6">
                                      Using {lockedExp.name} to show {lockedExp.guidance.whyItFits.toLowerCase().includes('shows')
                                        ? lockedExp.guidance.whyItFits.toLowerCase().split('shows')[1]?.trim()
                                        : 'your growth and values.'}
                                    </p>
                                  </div>

                                  {/* Actionable Guidance - Start with, Focus on, Avoid */}
                                  {(lockedExp.guidance.startWith || lockedExp.guidance.focusOn || lockedExp.guidance.avoidFocus) && (
                                    <div className="mt-4 space-y-2.5">
                                      {lockedExp.guidance.startWith && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">Start with</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.startWith}</p>
                                        </div>
                                      )}
                                      {lockedExp.guidance.focusOn && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Focus on</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.focusOn}</p>
                                        </div>
                                      )}
                                      {lockedExp.guidance.avoidFocus && (
                                        <div className="flex items-start gap-2">
                                          <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Avoid</span>
                                          <p className="text-xs text-muted-foreground leading-relaxed">{lockedExp.guidance.avoidFocus}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  <h4 className="text-xs font-medium text-foreground mb-2 mt-4 flex items-center gap-1.5">
                                    <Target className="w-3 h-3 text-primary" />
                                    Framing Tips
                                  </h4>
                                  <ul className="space-y-2">
                                    {lockedExp.guidance.framingTips.map((tip, idx) => (
                                      <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                        <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                        <span>{tip}</span>
                                      </li>
                                    ))}
                                  </ul>

                                  {lockedExp.guidance.caution && (
                                    <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                      <div className="flex items-start gap-2">
                                        <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">{lockedExp.guidance.caution}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Show experience selection
                            return (
                              <div className="rounded-lg bg-muted/20 p-4">
                                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                  Story Suggestions
                                </h3>

                                {experienceSuggestions.length === 0 ? (
                                  <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground italic">
                                      No specific suggestions for this prompt yet. Write from your heart!
                                    </p>

                                    {/* Contextual Personal Lens entry point */}
                                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                      <div className="flex items-start gap-2">
                                        <Heart className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                        <div>
                                          <p className="text-xs text-foreground mb-2">
                                            Want more tailored story suggestions? Adding a personal note can help.
                                          </p>
                                          <button
                                            onClick={handleOpenPersonalLens}
                                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                          >
                                            <Plus className="w-3 h-3" />
                                            Add to Personal Lens
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {experienceSuggestions
                                      .filter(exp => !dismissedSuggestions.has(`exp-${exp.id}-${currentEssay?.id}`))
                                      .map((experience) => {
                                        const isSelected = selectedExperience === experience.id;
                                        const isUsedElsewhere = experience.usedIn.length > 0;
                                        const isUsedInSameSchool = experience.usedIn.some(essayId =>
                                          currentCollege?.essays.some(e => e.id === essayId)
                                        );

                                        return (
                                          <motion.div
                                            key={experience.id}
                                            layout
                                            className={`rounded-xl border-2 transition-all cursor-pointer group relative ${isSelected
                                                ? 'border-primary bg-primary/5'
                                                : isUsedInSameSchool
                                                  ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50'
                                                  : 'border-border bg-card hover:border-primary/30'
                                              }`}
                                            onClick={() => setSelectedExperience(isSelected ? null : experience.id)}
                                          >
                                            {/* Dismiss button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDismissExperienceSuggestion(experience.id);
                                              }}
                                              className="absolute top-2 right-2 p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10"
                                              title="Dismiss suggestion"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                            <div className="p-3">
                                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <div className="flex items-center gap-2">
                                                  <BookOpen className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                                  <span className="text-body-sm font-medium text-foreground">
                                                    {experience.name}
                                                  </span>
                                                </div>
                                                <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${experience.guidance.matchStrength === 'strong'
                                                    ? 'bg-emerald-500/15 text-emerald-600'
                                                    : 'bg-amber-500/15 text-amber-600'
                                                  }`}>
                                                  {experience.guidance.matchStrength === 'strong' ? 'Strong fit' : 'Good fit'}
                                                </span>
                                              </div>

                                              <p className="text-xs text-muted-foreground leading-relaxed pl-6">
                                                {experience.guidance.whyItFits}
                                              </p>

                                              {isUsedInSameSchool && !isSelected && (
                                                <div className="flex items-start gap-1.5 mt-2 pl-6 p-2 rounded-lg bg-amber-500/10">
                                                  <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                                  <span className="text-xs text-amber-600">
                                                    Already used in another {currentCollege?.name} essay. Consider a different experience or vary your angle.
                                                  </span>
                                                </div>
                                              )}

                                              {isUsedElsewhere && !isUsedInSameSchool && !isSelected && (
                                                <div className="flex items-center gap-1.5 mt-2 pl-6">
                                                  <span className="text-xs text-muted-foreground italic">Used in another school (okay to reuse)</span>
                                                </div>
                                              )}
                                            </div>

                                            <AnimatePresence>
                                              {isSelected && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="px-3 pb-3 pt-0 border-t border-border/50 mt-0">
                                                    <div className="pt-3 space-y-3">
                                                      {/* Actionable Guidance - Start with, Focus on, Avoid */}
                                                      {(experience.guidance.startWith || experience.guidance.focusOn || experience.guidance.avoidFocus) && (
                                                        <div className="space-y-2.5">
                                                          {experience.guidance.startWith && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">Start with</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.startWith}</p>
                                                            </div>
                                                          )}
                                                          {experience.guidance.focusOn && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Focus on</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.focusOn}</p>
                                                            </div>
                                                          )}
                                                          {experience.guidance.avoidFocus && (
                                                            <div className="flex items-start gap-2">
                                                              <span className="text-xs font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded flex-shrink-0">Avoid</span>
                                                              <p className="text-xs text-muted-foreground leading-relaxed">{experience.guidance.avoidFocus}</p>
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}

                                                      {/* Framing Tips */}
                                                      <div>
                                                        <h4 className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                                                          <Target className="w-3 h-3 text-primary" />
                                                          Framing Tips
                                                        </h4>
                                                        <ul className="space-y-1.5">
                                                          {experience.guidance.framingTips.map((tip, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                              <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                              <span>{tip}</span>
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      </div>

                                                      {experience.guidance.caution && (
                                                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                                          <div className="flex items-start gap-2">
                                                            <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs text-amber-700">{experience.guidance.caution}</p>
                                                          </div>
                                                        </div>
                                                      )}

                                                      <button
                                                        className="w-full py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setLockedExperience(experience.id);
                                                          // Auto-populate editor with starter sentences if available
                                                          if (experience.guidance.starterSentences && experience.guidance.starterSentences.length > 0) {
                                                            const starterContent = experience.guidance.starterSentences.join(' ');
                                                            setContent(starterContent);
                                                            setShowStarterHelper(true);
                                                          }
                                                        }}
                                                      >
                                                        <Check className="w-3.5 h-3.5" />
                                                        Use this experience
                                                      </button>
                                                    </div>
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </motion.div>
                                        );
                                      })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}



                          {/* (Related Writing section removed for cleaner experience) */}

                          {/* Section 8: Smart Reuse - Reusable Excerpts from Other Schools */}
                          {showSmartReuse && (
                            <>
                              <div className="my-6">
                                <Separator className="bg-border/60" />
                              </div>
                              <div className="rounded-lg bg-muted/20 p-4">
                                <h3 className="text-body-sm font-semibold text-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <RefreshCw className="w-4 h-4 text-secondary" />
                                  You might reuse part of this
                                </h3>

                                <p className="text-xs text-muted-foreground mb-3">
                                  Excerpts from your other essays that may help here:
                                </p>

                                <div className="space-y-3">
                                  {smartReuseExcerpts.map((excerpt) => (
                                    <motion.div
                                      key={excerpt.id}
                                      layout
                                      className="rounded-xl border border-border bg-card overflow-hidden"
                                    >
                                      {/* Source */}
                                      <div className="px-3 py-2 bg-muted/30 border-b border-border">
                                        <p className="text-xs font-medium text-foreground">
                                          {excerpt.sourceCollegeName}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {excerpt.sourceEssayTitle}
                                        </p>
                                      </div>

                                      {/* Excerpt Preview */}
                                      <div className="p-3">
                                        <div className="flex items-start gap-2 mb-2">
                                          <Quote className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                                          <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-4">
                                            "{excerpt.excerpt}"
                                          </p>
                                        </div>

                                        {/* Why it works */}
                                        <div className="mt-2 p-2 rounded-lg bg-primary/15">
                                          <p className="text-xs text-foreground leading-relaxed">
                                            {excerpt.whyItWorks}
                                          </p>
                                        </div>

                                        {/* Same-school warning (gentle, not blocking) */}
                                        {excerpt.sameSchoolWarning && (
                                          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                            <div className="flex items-start gap-1.5">
                                              <Lightbulb className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                              <p className="text-xs text-amber-700 leading-relaxed">
                                                {excerpt.sameSchoolWarning}
                                              </p>
                                            </div>
                                          </div>
                                        )}

                                        {/* Actions: Insert as reference OR Dismiss */}
                                        <div className="flex items-center gap-2 mt-3">
                                          <button
                                            onClick={() => handleInsertAsReference(excerpt)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                            Insert as reference
                                          </button>
                                          <button
                                            onClick={() => handleDismissExcerpt(excerpt.id)}
                                            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                            title="Dismiss"
                                          >
                                            <XCircle className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>

                                <p className="text-xs text-center text-muted-foreground mt-3 italic">
                                  Guided reuse — always revise to fit this prompt.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.aside>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* VERSION HISTORY SLIDE-OVER */}
      <AnimatePresence>
        {showVersionHistory && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVersionHistory(false)}
            />
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-lg z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <History className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-heading-sm text-foreground">Version History</h2>
                      <p className="text-body-sm text-muted-foreground">Nothing is ever lost</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVersionHistory(false)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>

                <div className="space-y-3">
                  {mockVersions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-4 rounded-xl border transition-all ${version.isCurrent
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/30'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-medium text-foreground">
                            {version.timestamp}
                          </span>
                          {version.isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <span className="text-body-sm text-muted-foreground">
                          {version.wordCount} words
                        </span>
                      </div>
                      <p className="text-body-sm text-muted-foreground line-clamp-2 mb-3">
                        {version.preview}
                      </p>
                      {!version.isCurrent && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                            <Eye className="w-3.5 h-3.5 mr-1.5" />
                            Preview
                          </Button>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Restore
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-body-sm text-center text-muted-foreground mt-6">
                  Versions are automatically saved as you write
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SHARE DIALOG */}
      <AnimatePresence>
        {showShareDialog && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isShareSent) {
                  setShowShareDialog(false);
                  setShareEmail('');
                }
              }}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {isShareSent ? (
                  <motion.div
                    className="p-8 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-heading-sm text-foreground mb-2">Invitation Sent!</h3>
                    <p className="text-body-sm text-muted-foreground">
                      A {sharePermission === 'view' ? 'view-only' : sharePermission === 'comment' ? 'commenting' : 'editing'} link has been sent to {shareEmail}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="p-6 border-b border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Share2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-heading-sm text-foreground">Share Essay</h3>
                            <p className="text-body-sm text-muted-foreground">
                              Invite someone to view or collaborate
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setShowShareDialog(false);
                            setShareEmail('');
                            setSharePermission('view');
                          }}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                        >
                          <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Recipient's email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={shareEmail}
                            onChange={(e) => setShareEmail(e.target.value)}
                            placeholder="parent@email.com"
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Who is this for?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setShareRecipientType('parent')}
                            className={`p-3 rounded-lg border text-left transition-all ${shareRecipientType === 'parent'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <Users className={`w-4 h-4 mb-1 ${shareRecipientType === 'parent' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-body-sm font-medium ${shareRecipientType === 'parent' ? 'text-primary' : 'text-foreground'}`}>
                              Parent
                            </p>
                          </button>
                          <button
                            onClick={() => setShareRecipientType('counselor')}
                            className={`p-3 rounded-lg border text-left transition-all ${shareRecipientType === 'counselor'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <Shield className={`w-4 h-4 mb-1 ${shareRecipientType === 'counselor' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className={`text-body-sm font-medium ${shareRecipientType === 'counselor' ? 'text-primary' : 'text-foreground'}`}>
                              Counselor
                            </p>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-body-sm font-medium text-foreground mb-2">
                          Permission level
                        </label>
                        <div className="space-y-2">
                          <button
                            onClick={() => setSharePermission('view')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'view'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Eye className={`w-4 h-4 ${sharePermission === 'view' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'view' ? 'text-primary' : 'text-foreground'}`}>
                                  View only
                                </p>
                                <p className="text-xs text-muted-foreground">Can read but not change anything</p>
                              </div>
                            </div>
                            {sharePermission === 'view' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                          <button
                            onClick={() => setSharePermission('comment')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'comment'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className={`w-4 h-4 ${sharePermission === 'comment' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'comment' ? 'text-primary' : 'text-foreground'}`}>
                                  Comment
                                </p>
                                <p className="text-xs text-muted-foreground">Can add inline feedback and suggestions</p>
                              </div>
                            </div>
                            {sharePermission === 'comment' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                          <button
                            onClick={() => setSharePermission('edit')}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${sharePermission === 'edit'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <Pencil className={`w-4 h-4 ${sharePermission === 'edit' ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div>
                                <p className={`text-body-sm font-medium ${sharePermission === 'edit' ? 'text-primary' : 'text-foreground'}`}>
                                  Edit
                                </p>
                                <p className="text-xs text-muted-foreground">Can make changes to the essay text</p>
                              </div>
                            </div>
                            {sharePermission === 'edit' && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground text-center">
                          You remain the owner of this essay. You can revoke access anytime.
                        </p>
                      </div>
                      <Button
                        variant="collee-accent"
                        size="collee"
                        onClick={handleShareSubmit}
                        disabled={!shareEmail.trim()}
                        className="w-full"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send invitation
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* DELETE PROMPT CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showDeletePromptDialog && (
          <>
            <motion.div
              className="fixed inset-0 bg-foreground/20 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeletePromptDialog(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-sm bg-card rounded-2xl border border-border shadow-xl overflow-hidden"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10 mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <h3 className="text-heading-sm text-foreground text-center mb-2">
                    Delete this prompt?
                  </h3>
                  <p className="text-body-sm text-muted-foreground text-center mb-6">
                    This will remove the prompt and its draft. This action cannot be undone.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="collee"
                      onClick={() => setShowDeletePromptDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="collee"
                      onClick={handleDeletePrompt}
                      className="flex-1"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete prompt
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Walkthrough */}
      <OnboardingWalkthrough
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </div>
  );
};

export default LaunchPadWorkspace;
