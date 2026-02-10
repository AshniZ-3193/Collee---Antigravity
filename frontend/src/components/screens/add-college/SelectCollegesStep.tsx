import React from 'react';
import { motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CollegeData } from './types';

interface SelectCollegesStepProps {
  selectedColleges: Set<string>;
  getCollegeById: (collegeId: string) => CollegeData | null;
  onRemoveSelectedCollege: (collegeId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  filteredColleges: CollegeData[];
  onToggleCollegeSelection: (collegeId: string) => void;
  showAddCustom: boolean;
  customCollegeId: string | null;
  customIsSelected: boolean;
  trimmedSearchQuery: string;
  onAddCustomCollege: () => void;
  canProceedToApplicationType: boolean;
  selectedCollegesCount: number;
  onContinue: () => void;
}

const SelectCollegesStep: React.FC<SelectCollegesStepProps> = ({
  selectedColleges,
  getCollegeById,
  onRemoveSelectedCollege,
  searchQuery,
  onSearchQueryChange,
  filteredColleges,
  onToggleCollegeSelection,
  showAddCustom,
  customCollegeId,
  customIsSelected,
  trimmedSearchQuery,
  onAddCustomCollege,
  canProceedToApplicationType,
  selectedCollegesCount,
  onContinue,
}) => {
  return (
    <motion.div
      key="select"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {selectedColleges.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(selectedColleges).map((collegeId) => {
            const college = getCollegeById(collegeId);
            return (
              <motion.div
                key={collegeId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30"
              >
                <span className="text-body-sm font-medium text-primary">{college?.name || collegeId}</span>
                <button
                  onClick={() => onRemoveSelectedCollege(collegeId)}
                  className="p-0.5 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search colleges..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          className="pl-11 h-12 bg-card border-border"
        />
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredColleges.map((college, index) => {
          const isSelected = selectedColleges.has(college.id);
          return (
            <motion.button
              key={college.id}
              onClick={() => onToggleCollegeSelection(college.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02, duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body font-medium text-foreground">{college.name}</h3>
                  <p className="text-body-sm text-muted-foreground">{college.location}</p>
                  {college.qualityStatus && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {college.qualityStatus === 'verified'
                        ? 'Verified global data'
                        : college.qualityStatus === 'needs_review'
                          ? 'Needs source review'
                          : 'Provisional global data'}
                    </p>
                  )}
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
              </div>
            </motion.button>
          );
        })}

        {showAddCustom && (
          <motion.button
            key={`add-custom-${customCollegeId}`}
            onClick={customIsSelected ? undefined : onAddCustomCollege}
            disabled={customIsSelected}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              customIsSelected
                ? 'border-primary bg-primary/5 cursor-default'
                : 'border-border bg-card hover:border-primary/30'
            }`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-body font-medium text-foreground">Add “{trimmedSearchQuery}”</h3>
                <p className="text-body-sm text-muted-foreground">Use this custom college</p>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  customIsSelected ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                }`}
              >
                {customIsSelected && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
            </div>
          </motion.button>
        )}
      </div>

      {canProceedToApplicationType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4"
        >
          <Button variant="collee-accent" size="collee" onClick={onContinue} className="w-full">
            Continue with {selectedCollegesCount} college{selectedCollegesCount > 1 ? 's' : ''}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SelectCollegesStep;
