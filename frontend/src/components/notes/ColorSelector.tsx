import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Palette } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ColorSelectorProps {
  editor: Editor;
}

const TEXT_COLORS = [
  { label: 'Default', value: '' },
  { label: 'Purple', value: '#7c3aed' },
  { label: 'Peach', value: '#ea580c' },
  { label: 'Red', value: '#dc2626' },
  { label: 'Blue', value: '#2563eb' },
  { label: 'Green', value: '#16a34a' },
  { label: 'Gray', value: '#6b7280' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Purple', value: '#ede9fe' },
  { label: 'Peach', value: '#fff7ed' },
  { label: 'Yellow', value: '#fef9c3' },
  { label: 'Green', value: '#dcfce7' },
  { label: 'Blue', value: '#dbeafe' },
  { label: 'Pink', value: '#fce7f3' },
  { label: 'Gray', value: '#f3f4f6' },
];

const ColorSelector: React.FC<ColorSelectorProps> = ({ editor }) => {
  const [open, setOpen] = useState(false);

  const isActive = editor.isActive('textStyle') || editor.isActive('highlight');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
          }`}
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start" sideOffset={8}>
        {/* Text colors */}
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Text Color
        </p>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {TEXT_COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              title={color.label}
              onClick={() => {
                if (color.value) {
                  editor.chain().focus().setColor(color.value).run();
                } else {
                  editor.chain().focus().unsetColor().run();
                }
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value || undefined }}
            >
              {!color.value && (
                <span className="text-xs font-medium text-foreground">A</span>
              )}
            </button>
          ))}
        </div>

        {/* Highlight colors */}
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Highlight
        </p>
        <div className="flex flex-wrap gap-1.5">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              title={color.label}
              onClick={() => {
                editor.chain().focus().toggleHighlight({ color: color.value }).run();
              }}
              className="h-7 w-7 rounded-md border border-border hover:scale-110 transition-transform"
              style={{ backgroundColor: color.value }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ColorSelector;
