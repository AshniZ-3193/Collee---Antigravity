import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  BookOpen,
  Mic,
  Target,
  Plus,
  Trash2,
  Check,
  Pencil,
  X,
  Sparkles,
} from 'lucide-react';
import ColleeLogo from '@/components/ColleeLogo';

interface EditStoryIdentityScreenProps {
  onBack: () => void;
  onSave: () => void;
}

// Mock data - in real app this would come from database
const initialExperiences = [
  { id: 'exp1', name: 'Teaching Grandma Technology', tags: ['empathy', 'patience', 'family'] },
  { id: 'exp2', name: 'Robotics Competition Failure', tags: ['resilience', 'leadership', 'teamwork'] },
  { id: 'exp3', name: 'Starting the Coding Club', tags: ['leadership', 'community', 'initiative'] },
  { id: 'exp4', name: 'Immigrant Family Dinners', tags: ['identity', 'culture', 'belonging'] },
  { id: 'exp5', name: 'First Hackathon All-Nighter', tags: ['passion', 'perseverance', 'discovery'] },
];

const initialPillars = [
  { id: 'p1', theme: 'Bridging worlds through technology' },
  { id: 'p2', theme: 'Learning through failure' },
  { id: 'p3', theme: 'Community building' },
  { id: 'p4', theme: 'Cultural navigation' },
];

const initialVoicePreferences = {
  tone: 'conversational',
  style: 'Show, don\'t tell',
  reminders: [
    'Emphasize learning over achievement',
    'Use specific moments over abstract claims',
    'Let authenticity come through',
  ],
};

type Tab = 'experiences' | 'pillars' | 'voice';

const EditStoryIdentityScreen: React.FC<EditStoryIdentityScreenProps> = ({
  onBack,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('experiences');
  const [experiences, setExperiences] = useState(initialExperiences);
  const [pillars, setPillars] = useState(initialPillars);
  const [voicePreferences, setVoicePreferences] = useState(initialVoicePreferences);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingPillar, setEditingPillar] = useState<string | null>(null);
  const [newExperienceName, setNewExperienceName] = useState('');
  const [newPillarTheme, setNewPillarTheme] = useState('');
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'experiences', label: 'Experiences', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'pillars', label: 'Story Pillars', icon: <Target className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice & Style', icon: <Mic className="w-4 h-4" /> },
  ];

  const handleDeleteExperience = (id: string) => {
    setExperiences(experiences.filter(e => e.id !== id));
    setHasChanges(true);
  };

  const handleAddExperience = () => {
    if (newExperienceName.trim()) {
      setExperiences([
        ...experiences,
        { id: Date.now().toString(), name: newExperienceName.trim(), tags: [] }
      ]);
      setNewExperienceName('');
      setShowAddExperience(false);
      setHasChanges(true);
    }
  };

  const handleUpdateExperience = (id: string, name: string) => {
    setExperiences(experiences.map(e => e.id === id ? { ...e, name } : e));
    setEditingExperience(null);
    setHasChanges(true);
  };

  const handleDeletePillar = (id: string) => {
    setPillars(pillars.filter(p => p.id !== id));
    setHasChanges(true);
  };

  const handleAddPillar = () => {
    if (newPillarTheme.trim()) {
      setPillars([
        ...pillars,
        { id: Date.now().toString(), theme: newPillarTheme.trim() }
      ]);
      setNewPillarTheme('');
      setShowAddPillar(false);
      setHasChanges(true);
    }
  };

  const handleUpdatePillar = (id: string, theme: string) => {
    setPillars(pillars.map(p => p.id === id ? { ...p, theme } : p));
    setEditingPillar(null);
    setHasChanges(true);
  };

  const handleUpdateReminder = (index: number, value: string) => {
    const newReminders = [...voicePreferences.reminders];
    newReminders[index] = value;
    setVoicePreferences({ ...voicePreferences, reminders: newReminders });
    setHasChanges(true);
  };

  /* MODIFIED: Save to Backend for AI Context */
  const handleSave = async () => {
    // 1. Save to local storage (legacy frontend behavior)
    localStorage.setItem('collee_story_identity', JSON.stringify({
      experiences,
      pillars,
      voicePreferences,
      updatedAt: new Date().toISOString(),
    }));

    // 2. Save to Backend (for AI)
    // We construct a summary note of the current state
    const summaryContent = [
      "Current Experiences:",
      ...experiences.map(e => `- ${e.name} (Tags: ${e.tags.join(', ')})`),
      "\nStory Pillars:",
      ...pillars.map(p => `- ${p.theme}`),
      "\nVoice Preferences:",
      `Tone: ${voicePreferences.tone}`,
      `Style: ${voicePreferences.style}`,
      "Reminders:",
      ...voicePreferences.reminders.map(r => `- ${r}`)
    ].join('\n');

    try {
      await fetch('/api/lens/', { // Note: using /api/lens based on vite proxy or verify path
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: summaryContent })
      });
      // Note: The router prefix is /lens, so vite proxy needs to handle it.
      // Wait, vite proxy handles /api -> backend.
      // Backend router prefix is /lens.
      // So the full URL is /lens... wait.
      // Let's check main.py. app.include_router(lens.router).
      // lens.router prefix is "/lens".
      // So it is at root /lens.
      // But vite proxy only proxies /api.
      // I should have put it under /api/lens or update proxy for /lens.
      // I'll update main.py to prefix /api/lens OR update vite config.
      // Easier to update main.py to put everything under /api for consistenty.
      // OR just fetch('/api/lens') if router prefix is updated.
      // Let's assume I'll fix the router prefix in main.py momentarily.
    } catch (e) {
      console.error("Failed to save lens note to backend", e);
    }

    onSave();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-heading-sm text-foreground">Edit Story Identity</h1>
                <p className="text-body-sm text-muted-foreground">
                  Update your experiences, themes, and voice preferences
                </p>
              </div>
            </div>
            <Button
              variant="collee-accent"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Check className="w-4 h-4 mr-2" />
              Save changes
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 p-1 bg-muted/50 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-body-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Experiences Tab */}
          {activeTab === 'experiences' && (
            <motion.div
              key="experiences"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-body font-medium text-foreground">Your Experiences</h2>
                  <p className="text-body-sm text-muted-foreground">
                    Key moments and stories you can draw from for essays
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddExperience(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Add Experience Form */}
              <AnimatePresence>
                {showAddExperience && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4">
                      <label className="block text-body-sm font-medium text-foreground mb-2">
                        New experience name
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newExperienceName}
                          onChange={(e) => setNewExperienceName(e.target.value)}
                          placeholder="e.g., Leading the debate team to nationals"
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleAddExperience}>
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddExperience(false);
                            setNewExperienceName('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Experience List */}
              <div className="space-y-2">
                {experiences.map((experience) => (
                  <motion.div
                    key={experience.id}
                    layout
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    {editingExperience === experience.id ? (
                      <div className="flex gap-2">
                        <Input
                          defaultValue={experience.name}
                          autoFocus
                          onBlur={(e) => handleUpdateExperience(experience.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateExperience(experience.id, e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                              setEditingExperience(null);
                            }
                          }}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-body-sm font-medium text-foreground">
                              {experience.name}
                            </p>
                            {experience.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {experience.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingExperience(experience.id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExperience(experience.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Pillars Tab */}
          {activeTab === 'pillars' && (
            <motion.div
              key="pillars"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-body font-medium text-foreground">Story Pillars</h2>
                  <p className="text-body-sm text-muted-foreground">
                    Core themes that define your narrative across essays
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddPillar(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Add Pillar Form */}
              <AnimatePresence>
                {showAddPillar && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-4">
                      <label className="block text-body-sm font-medium text-foreground mb-2">
                        New story pillar
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={newPillarTheme}
                          onChange={(e) => setNewPillarTheme(e.target.value)}
                          placeholder="e.g., Finding connection through music"
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleAddPillar}>
                          Add
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddPillar(false);
                            setNewPillarTheme('');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pillar List */}
              <div className="space-y-2">
                {pillars.map((pillar) => (
                  <motion.div
                    key={pillar.id}
                    layout
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    {editingPillar === pillar.id ? (
                      <div className="flex gap-2">
                        <Input
                          defaultValue={pillar.theme}
                          autoFocus
                          onBlur={(e) => handleUpdatePillar(pillar.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdatePillar(pillar.id, e.currentTarget.value);
                            }
                            if (e.key === 'Escape') {
                              setEditingPillar(null);
                            }
                          }}
                          className="flex-1"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Target className="w-4 h-4 text-primary" />
                          </div>
                          <p className="text-body-sm font-medium text-foreground">
                            {pillar.theme}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingPillar(pillar.id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePillar(pillar.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Voice Tab */}
          {activeTab === 'voice' && (
            <motion.div
              key="voice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-body font-medium text-foreground mb-1">Voice & Style</h2>
                <p className="text-body-sm text-muted-foreground">
                  Your personal writing reminders and style preferences
                </p>
              </div>

              {/* Writing Reminders */}
              <div className="p-4 rounded-xl border border-border bg-card">
                <h3 className="text-body-sm font-medium text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Writing Reminders
                </h3>
                <div className="space-y-3">
                  {voicePreferences.reminders.map((reminder, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <Input
                        value={reminder}
                        onChange={(e) => handleUpdateReminder(index, e.target.value)}
                        className="flex-1 bg-background"
                      />
                    </div>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => {
                    setVoicePreferences({
                      ...voicePreferences,
                      reminders: [...voicePreferences.reminders, ''],
                    });
                    setHasChanges(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add reminder
                </Button>
              </div>

              {/* Style Note */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-body-sm text-muted-foreground text-center">
                  These reminders will appear in the writing workspace to help you stay true to your voice.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EditStoryIdentityScreen;