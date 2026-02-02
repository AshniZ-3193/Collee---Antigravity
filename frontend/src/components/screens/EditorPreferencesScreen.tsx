import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Type, Check } from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';

interface EditorPreferencesScreenProps {
  onBack: () => void;
  onSave: (preferences: EditorPreferences) => void;
}

interface EditorPreferences {
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
}

const fontOptions = [
  { id: 'inter', name: 'Inter', preview: 'Modern & clean' },
  { id: 'georgia', name: 'Georgia', preview: 'Classic serif' },
  { id: 'merriweather', name: 'Merriweather', preview: 'Readable serif' },
  { id: 'source-code', name: 'Source Code Pro', preview: 'Monospace' },
];

const sizeOptions = [
  { id: 'small', name: 'Small', value: '14px' },
  { id: 'medium', name: 'Medium', value: '16px' },
  { id: 'large', name: 'Large', value: '18px' },
  { id: 'xlarge', name: 'Extra Large', value: '20px' },
];

const spacingOptions = [
  { id: 'compact', name: 'Compact', value: '1.4' },
  { id: 'comfortable', name: 'Comfortable', value: '1.6' },
  { id: 'relaxed', name: 'Relaxed', value: '1.8' },
  { id: 'spacious', name: 'Spacious', value: '2.0' },
];

const EditorPreferencesScreen: React.FC<EditorPreferencesScreenProps> = ({
  onBack,
  onSave,
}) => {
  const [preferences, setPreferences] = useState<EditorPreferences>({
    fontFamily: 'inter',
    fontSize: 'medium',
    lineSpacing: 'comfortable',
  });

  const handleSave = () => {
    onSave(preferences);
    onBack();
  };

  return (
    <ColleeLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-body-sm">Back to editor</span>
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
              <Type className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Editor preferences</h1>
            <p className="text-body text-muted-foreground">
              Customize how your writing looks
            </p>
          </div>
        </motion.div>

        {/* Font Family */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h3 className="text-body font-medium text-foreground mb-3">Font</h3>
          <div className="grid grid-cols-2 gap-2">
            {fontOptions.map((font) => (
              <button
                key={font.id}
                onClick={() => setPreferences({ ...preferences, fontFamily: font.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  preferences.fontFamily === font.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-body font-medium text-foreground">{font.name}</span>
                  {preferences.fontFamily === font.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
                <span className="text-body-sm text-muted-foreground">{font.preview}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Font Size */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h3 className="text-body font-medium text-foreground mb-3">Size</h3>
          <div className="flex gap-2">
            {sizeOptions.map((size) => (
              <button
                key={size.id}
                onClick={() => setPreferences({ ...preferences, fontSize: size.id })}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  preferences.fontSize === size.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={`text-body ${
                  preferences.fontSize === size.id ? 'text-primary font-medium' : 'text-foreground'
                }`}>
                  {size.name}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Line Spacing */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h3 className="text-body font-medium text-foreground mb-3">Line spacing</h3>
          <div className="flex gap-2">
            {spacingOptions.map((spacing) => (
              <button
                key={spacing.id}
                onClick={() => setPreferences({ ...preferences, lineSpacing: spacing.id })}
                className={`flex-1 p-3 rounded-xl border text-center transition-all ${
                  preferences.lineSpacing === spacing.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <span className={`text-body ${
                  preferences.lineSpacing === spacing.id ? 'text-primary font-medium' : 'text-foreground'
                }`}>
                  {spacing.name}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Preview */}
        <motion.div
          className="p-4 rounded-xl border border-border bg-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-body-sm text-muted-foreground mb-2">Preview</p>
          <p 
            className="text-foreground"
            style={{
              fontFamily: fontOptions.find(f => f.id === preferences.fontFamily)?.name,
              fontSize: sizeOptions.find(s => s.id === preferences.fontSize)?.value,
              lineHeight: spacingOptions.find(s => s.id === preferences.lineSpacing)?.value,
            }}
          >
            The moment I realized I wanted to pursue computer science wasn't in a classroom — it was in my grandmother's kitchen.
          </p>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            variant="collee-accent"
            size="collee"
            onClick={handleSave}
            className="w-full"
          >
            Save preferences
          </Button>
        </motion.div>
      </div>
    </ColleeLayout>
  );
};

export default EditorPreferencesScreen;
