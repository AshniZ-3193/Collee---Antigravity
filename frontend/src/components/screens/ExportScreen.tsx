import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Copy, 
  Link, 
  Check,
  FileDown
} from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import ColleeLogo from '@/components/ColleeLogo';

interface ExportOption {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ExportScreenProps {
  essayTitle: string;
  collegeName: string;
  wordCount: number;
  onBack: () => void;
}

const exportOptions: ExportOption[] = [
  {
    id: 'pdf',
    icon: <FileDown className="w-5 h-5" />,
    title: 'Download as PDF',
    description: 'Formatted document ready to submit',
  },
  {
    id: 'docx',
    icon: <FileText className="w-5 h-5" />,
    title: 'Download as Word',
    description: 'Editable .docx format',
  },
  {
    id: 'copy',
    icon: <Copy className="w-5 h-5" />,
    title: 'Copy to clipboard',
    description: 'Paste directly into application',
  },
  {
    id: 'share',
    icon: <Link className="w-5 h-5" />,
    title: 'Create share link',
    description: 'Read-only link for reviewers',
  },
];

const ExportScreen: React.FC<ExportScreenProps> = ({
  essayTitle,
  collegeName,
  wordCount,
  onBack,
}) => {
  const [exportedOption, setExportedOption] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = (optionId: string) => {
    setIsExporting(true);
    
    // Simulate export action
    setTimeout(() => {
      setExportedOption(optionId);
      setIsExporting(false);
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setExportedOption(null);
      }, 2000);
    }, 1000);
  };

  return (
    <ColleeLayout>
      <div className="space-y-6">
        {/* Top Logo */}
        <motion.div 
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ColleeLogo size="sm" />
        </motion.div>

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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-secondary/15 mb-4">
              <Download className="w-6 h-6 text-secondary" />
            </div>
            <h1 className="text-title text-foreground mb-2">Export essay</h1>
            <p className="text-body text-muted-foreground">
              Choose how you'd like to save or share
            </p>
          </div>
        </motion.div>

        {/* Essay Summary */}
        <motion.div
          className="p-4 rounded-xl bg-muted/50 border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm font-medium text-secondary mb-1">{collegeName}</p>
              <p className="text-body text-foreground line-clamp-1">{essayTitle}</p>
            </div>
            <span className="text-body-sm text-muted-foreground">{wordCount} words</span>
          </div>
        </motion.div>

        {/* Export Options */}
        <div className="space-y-3">
          {exportOptions.map((option, index) => (
            <motion.button
              key={option.id}
              onClick={() => handleExport(option.id)}
              disabled={isExporting}
              className="w-full p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05, duration: 0.5 }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  exportedOption === option.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {exportedOption === option.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    option.icon
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-body font-medium text-foreground">
                    {exportedOption === option.id ? 'Done!' : option.title}
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Note */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-body-sm text-muted-foreground">
            PDFs are formatted to meet common application requirements
          </p>
        </motion.div>
      </div>
    </ColleeLayout>
  );
};

export default ExportScreen;
