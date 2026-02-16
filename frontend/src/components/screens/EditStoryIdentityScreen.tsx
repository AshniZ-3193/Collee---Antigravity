import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

interface EditStoryIdentityScreenProps {
  onBack: () => void;
  onSave: () => void;
  onRetakeQuiz?: () => void;
}

type Tab = 'experiences' | 'pillars' | 'voice';

const EditStoryIdentityScreen: React.FC<EditStoryIdentityScreenProps> = ({
  onBack,
  onSave,
  onRetakeQuiz,
}) => {
  const storyIdentity = useQuery(api.storyIdentity.get, {});
  const addExperience = useMutation(api.storyIdentity.addExperience);
  const updateExperience = useMutation(api.storyIdentity.updateExperience);
  const removeExperience = useMutation(api.storyIdentity.removeExperience);
  const addPillar = useMutation(api.storyIdentity.addPillar);
  const updatePillar = useMutation(api.storyIdentity.updatePillar);
  const removePillar = useMutation(api.storyIdentity.removePillar);
  const updateIdentity = useMutation(api.storyIdentity.updateIdentity);

  const [activeTab, setActiveTab] = useState<Tab>('experiences');
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingPillar, setEditingPillar] = useState<string | null>(null);
  const [newExperienceName, setNewExperienceName] = useState('');
  const [newPillarTheme, setNewPillarTheme] = useState('');
  const [showAddExperience, setShowAddExperience] = useState(false);
  const [showAddPillar, setShowAddPillar] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local copy of writing reminders for editing
  const [localReminders, setLocalReminders] = useState<string[]>([]);

  useEffect(() => {
    if (storyIdentity?.writingReminders) {
      setLocalReminders(storyIdentity.writingReminders);
    }
  }, [storyIdentity?.writingReminders]);

  const experiences = storyIdentity?.experiences || [];
  const pillars = storyIdentity?.pillars || [];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'experiences', label: 'Experiences', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'pillars', label: 'Story Pillars', icon: <Target className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice & Style', icon: <Mic className="w-4 h-4" /> },
  ];

  const handleDeleteExperience = async (id: string) => {
    await removeExperience({ id: id as Id<"experiences"> });
    setHasChanges(true);
  };

  const handleAddExperience = async () => {
    if (newExperienceName.trim()) {
      await addExperience({ name: newExperienceName.trim(), tags: [] });
      setNewExperienceName('');
      setShowAddExperience(false);
      setHasChanges(true);
    }
  };

  const handleUpdateExperience = async (id: string, name: string) => {
    await updateExperience({ id: id as Id<"experiences">, name });
    setEditingExperience(null);
    setHasChanges(true);
  };

  const handleDeletePillar = async (id: string) => {
    await removePillar({ id: id as Id<"storyPillars"> });
    setHasChanges(true);
  };

  const handleAddPillar = async () => {
    if (newPillarTheme.trim()) {
      await addPillar({ theme: newPillarTheme.trim() });
      setNewPillarTheme('');
      setShowAddPillar(false);
      setHasChanges(true);
    }
  };

  const handleUpdatePillar = async (id: string, theme: string) => {
    await updatePillar({ id: id as Id<"storyPillars">, theme });
    setEditingPillar(null);
    setHasChanges(true);
  };

  const handleUpdateReminder = (index: number, value: string) => {
    const newReminders = [...localReminders];
    newReminders[index] = value;
    setLocalReminders(newReminders);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Save writing reminders to Convex
    if (hasChanges && localReminders.length > 0) {
      await updateIdentity({ writingReminders: localReminders });
    }
    onSave();
  };

  if (!storyIdentity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading story identity...</p>
      </div>
    );
  }

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
                {experiences.map((experience: any) => (
                  <motion.div
                    key={experience._id}
                    layout
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    {editingExperience === experience._id ? (
                      <div className="flex gap-2">
                        <Input
                          defaultValue={experience.name}
                          autoFocus
                          onBlur={(e) => handleUpdateExperience(experience._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateExperience(experience._id, e.currentTarget.value);
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
                            {experience.tags?.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {experience.tags.slice(0, 3).map((tag: string) => (
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
                            onClick={() => setEditingExperience(experience._id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExperience(experience._id)}
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
                {pillars.map((pillar: any) => (
                  <motion.div
                    key={pillar._id}
                    layout
                    className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
                  >
                    {editingPillar === pillar._id ? (
                      <div className="flex gap-2">
                        <Input
                          defaultValue={pillar.theme}
                          autoFocus
                          onBlur={(e) => handleUpdatePillar(pillar._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdatePillar(pillar._id, e.currentTarget.value);
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
                            onClick={() => setEditingPillar(pillar._id)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePillar(pillar._id)}
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
                  {localReminders.map((reminder, index) => (
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
                    setLocalReminders([...localReminders, '']);
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

        {/* Retake Quiz CTA */}
        {onRetakeQuiz && (
          <div className="mt-10 p-6 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-body font-medium text-foreground mb-1">
                  Retake Quiz
                </h3>
                <p className="text-body-sm text-muted-foreground mb-4">
                  Retake the onboarding quiz to regenerate your story identity with AI.
                  Your answers will be pre-filled so you can update only what's changed.
                </p>
                <Button variant="outline" onClick={onRetakeQuiz}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditStoryIdentityScreen;
