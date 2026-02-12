import React from 'react';

export interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
}

interface SlashCommandMenuProps {
  open: boolean;
  position: { top: number; left: number };
  commands: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (command: SlashCommandItem) => void;
}

const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  open,
  position,
  commands,
  selectedIndex,
  onSelect,
}) => {
  if (!open || commands.length === 0) return null;

  return (
    <div
      className="fixed z-[70] w-80 rounded-xl border border-border bg-popover p-2 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="max-h-72 space-y-1 overflow-y-auto">
        {commands.map((command, index) => (
          <button
            key={command.id}
            type="button"
            onClick={() => onSelect(command)}
            className={`w-full rounded-lg px-3 py-2 text-left ${
              index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/60'
            }`}
          >
            <p className="text-sm font-medium text-foreground">{command.label}</p>
            <p className="text-xs text-muted-foreground">{command.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SlashCommandMenu;
