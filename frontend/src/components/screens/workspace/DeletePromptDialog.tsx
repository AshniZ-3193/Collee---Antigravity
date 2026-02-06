import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface DeletePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}

const DeletePromptDialog: React.FC<DeletePromptDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-foreground/20 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                <h3 className="text-heading-sm text-foreground text-center mb-2">Delete this prompt?</h3>
                <p className="text-body-sm text-muted-foreground text-center mb-6">
                  This will remove the prompt and its draft. This action cannot be undone.
                </p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="collee" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="destructive" size="collee" onClick={onDelete} className="flex-1">
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
  );
};

export default DeletePromptDialog;
