import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { SuggestionKeyDownProps } from '@tiptap/suggestion';

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  command: (editor: Editor) => void;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

const SlashCommandMenu = forwardRef<SlashCommandListRef, SlashCommandMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;
      command(item);
    },
    [items, command],
  );

  const onKeyDown = useCallback(
    (props: SuggestionKeyDownProps) => {
      if (props.event.key === 'ArrowUp') {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }

      if (props.event.key === 'ArrowDown') {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }

      if (props.event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
    [items.length, selectedIndex, selectItem],
  );

  useImperativeHandle(ref, () => ({ onKeyDown }), [onKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="w-80 rounded-xl border border-border bg-popover p-2 shadow-lg">
        <p className="px-2 py-1 text-xs text-muted-foreground">No matches</p>
      </div>
    );
  }

  return (
    <div className="w-80 rounded-xl border border-border bg-popover p-2 shadow-lg">
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectItem(index)}
            className={`w-full rounded-lg px-3 py-2 text-left ${
              index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';

export default SlashCommandMenu;
