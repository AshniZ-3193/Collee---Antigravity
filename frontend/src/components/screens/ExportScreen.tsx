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
  FileDown,
  Loader2
} from 'lucide-react';
import ColleeLayout from '@/components/ColleeLayout';
import ColleeLogo from '@/components/ColleeLogo';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

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
  essayContent: string;
  essayId?: string;
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
  essayContent,
  essayId,
  onBack,
}) => {
  const [exportedOption, setExportedOption] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const createShareMutation = useMutation(api.shares.create);

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(collegeName, margin, margin);

    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(essayTitle, margin, margin + 8);

    // Divider line
    doc.setDrawColor(200);
    doc.line(margin, margin + 14, pageWidth - margin, margin + 14);

    // Essay content
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(essayContent, maxWidth);
    let yPosition = margin + 24;
    const lineHeight = 6;

    lines.forEach((line: string) => {
      if (yPosition > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    });

    // Footer
    yPosition += 10;
    doc.setFontSize(9);
    doc.setTextColor(128);
    doc.text(`${wordCount} words`, margin, yPosition);
    doc.text('Created with Collee', pageWidth - margin - 35, yPosition);

    // Save
    const fileName = `${collegeName.replace(/\s+/g, '_')}_${essayTitle.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const handleExportDOCX = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: collegeName,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: essayTitle,
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 400 },
            }),
            ...essayContent.split('\n\n').map(
              (para) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: para,
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 240 },
                })
            ),
            new Paragraph({
              children: [
                new TextRun({
                  text: `\n${wordCount} words`,
                  size: 20,
                  color: '808080',
                }),
              ],
              spacing: { before: 400 },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${collegeName.replace(/\s+/g, '_')}_${essayTitle.replace(/\s+/g, '_')}.docx`;
    saveAs(blob, fileName);
  };

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(essayContent);
  };

  const handleCreateShareLink = async () => {
    if (!essayId) {
      console.error('No essay ID provided for share link');
      return;
    }

    try {
      const result = await createShareMutation({
        essayId: essayId as Id<"essays">,
        permission: "view",
      });

      const shareUrl = `${window.location.origin}/share/${result.token}`;
      setShareLink(shareUrl);

      // Also copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      console.error('Failed to create share link:', error);
    }
  };

  const handleExport = async (optionId: string) => {
    setIsExporting(true);

    try {
      switch (optionId) {
        case 'pdf':
          await handleExportPDF();
          break;
        case 'docx':
          await handleExportDOCX();
          break;
        case 'copy':
          await handleCopyToClipboard();
          break;
        case 'share':
          await handleCreateShareLink();
          break;
      }

      setExportedOption(optionId);

      // Reset success state after 3 seconds (longer for share link)
      setTimeout(() => {
        setExportedOption(null);
      }, optionId === 'share' ? 5000 : 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getSuccessMessage = (optionId: string) => {
    switch (optionId) {
      case 'pdf':
        return 'PDF downloaded!';
      case 'docx':
        return 'Word doc downloaded!';
      case 'copy':
        return 'Copied to clipboard!';
      case 'share':
        return shareLink ? 'Link copied!' : 'Creating link...';
      default:
        return 'Done!';
    }
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
          <ColleeLogo size="sm" onClick={onBack} />
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
              disabled={isExporting || (option.id === 'share' && !essayId)}
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
                  {isExporting && exportedOption === null ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : exportedOption === option.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    option.icon
                  )}
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-body font-medium text-foreground">
                    {exportedOption === option.id ? getSuccessMessage(option.id) : option.title}
                  </h3>
                  <p className="text-body-sm text-muted-foreground">
                    {option.id === 'share' && shareLink && exportedOption === 'share'
                      ? shareLink
                      : option.description}
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
