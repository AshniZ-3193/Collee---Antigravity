import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { SuggestionKeyDownProps } from '@tiptap/suggestion';
import type { LucideIcon } from 'lucide-react';

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  command: (editor: Editor) => void;
  icon?: LucideIcon;
  category?: string;
}

interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

interface GroupedItems {
  category: string;
  items: SlashCommandItem[];
}

const SlashCommandMenu = forwardRef<SlashCommandListRef, SlashCommandMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const grouped = useMemo<GroupedItems[]>(() => {
    const categoryMap = new Map<string, SlashCommandItem[]>();
    for (const item of items) {
      const cat = item.category ?? 'Other';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.push(item);
      } else {
        categoryMap.set(cat, [item]);
      }
    }
    return Array.from(categoryMap.entries()).map(([category, groupItems]) => ({
      category,
      items: groupItems,
    }));
  }, [items]);

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

  let flatIndex = 0;

  return (
    <div className="w-80 rounded-xl border border-border bg-popover p-2 shadow-lg">
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {grouped.map((group) => (
          <div key={group.category}>
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.category}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const currentIndex = flatIndex++;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectItem(currentIndex)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left ${
                      currentIndex === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60'
                    }`}
                  >
                    {Icon && (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';

export default SlashCommandMenu;
