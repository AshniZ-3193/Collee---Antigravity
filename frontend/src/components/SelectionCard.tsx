import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionCardProps {
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'compact';
}

const SelectionCard: React.FC<SelectionCardProps> = ({
  label,
  description,
  selected = false,
  onClick,
  icon,
  variant = 'default',
}) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border-2 transition-all duration-200 relative",
        variant === 'default' ? "p-4" : "p-3",
        selected
          ? "border-primary bg-primary-muted"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn(
            "flex-shrink-0 rounded-lg p-2",
            selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={cn(
            "block font-medium",
            variant === 'default' ? "text-body" : "text-body-sm",
            selected ? "text-foreground" : "text-foreground"
          )}>
            {label}
          </span>
          {description && (
            <span className="block text-body-sm text-muted-foreground mt-0.5">
              {description}
            </span>
          )}
        </div>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

export default SelectionCard;
