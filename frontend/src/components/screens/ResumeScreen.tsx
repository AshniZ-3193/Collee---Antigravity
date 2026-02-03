import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ColleeLayout from '@/components/ColleeLayout';
import { Upload, FileText, X } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min?url';
import * as mammoth from 'mammoth/mammoth.browser';

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RESUME_MAX_CHARS = 6000;

const normalizeText = (text: string) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const limitText = (text: string) => {
  if (text.length <= RESUME_MAX_CHARS) return text;
  return `${text.slice(0, RESUME_MAX_CHARS)}\n\n[Resume truncated to ${RESUME_MAX_CHARS} characters]`;
};

const parsePdf = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let output = '';

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    output += `${pageText}\n`;
  }

  return output;
};

const parseDocx = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
};

const parseTxt = async (file: File) => {
  return await file.text();
};

const parseResumeFile = async (file: File) => {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    return await parsePdf(file);
  }
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return await parseDocx(file);
  }
  if (file.type.startsWith('text/') || name.endsWith('.txt')) {
    return await parseTxt(file);
  }
  if (name.endsWith('.doc')) {
    throw new Error('Legacy .doc files are not supported. Please upload .pdf or .docx.');
  }
  throw new Error('Unsupported file type. Please upload a .pdf or .docx file.');
};

interface ResumeScreenProps {
  onContinue: (data: string) => void;
  onBack: () => void;
}

const ResumeScreen: React.FC<ResumeScreenProps> = ({ onContinue, onBack }) => {
  const [activities, setActivities] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeParseError, setResumeParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveOnboardingStep = useMutation(api.userProfile.saveOnboardingStep);

  const placeholderText = `• Helped younger sibling with homework every night
• Weekend walks with grandma
• Part-time job at family restaurant
• Started learning guitar on my own
• Took care of our family dog after school
• Noticed how people in my neighborhood never really talked`;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setResumeText('');
      setResumeParseError(null);
      setIsParsingResume(true);

      try {
        const rawText = await parseResumeFile(file);
        const normalized = normalizeText(rawText);
        setResumeText(limitText(normalized));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to parse resume. Please try another file.';
        setResumeParseError(message);
      } finally {
        setIsParsingResume(false);
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setResumeText('');
    setResumeParseError(null);
    setIsParsingResume(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContinue = async () => {
    const resumeBlock = resumeText
      ? `RESUME (parsed):\n${resumeText}`
      : uploadedFile
        ? `[Resume uploaded: ${uploadedFile.name}]`
        : '';
    const data = [resumeBlock, activities].filter(Boolean).join('\n\n');
    await saveOnboardingStep({ activitiesText: data });
    onContinue(data);
  };

  return (
    <ColleeLayout showProgress currentStep={1} totalSteps={8}>
      <div className="text-center mb-10">
        <motion.h1
          className="text-display-sm text-foreground mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          What have you been up to?
        </motion.h1>
        <motion.p
          className="text-body-lg text-muted-foreground max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          This doesn't have to be awards or titles. Everyday moments, quiet commitments, and small responsibilities often make the strongest stories.
        </motion.p>
      </div>

      {/* Optional Resume Upload */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          id="resume-upload"
        />
        
        {!uploadedFile ? (
          <div className="bg-card/50 rounded-xl border border-dashed border-border p-5 text-center">
            <p className="text-body-sm text-muted-foreground mb-3">
              Have a resume? You can upload it. But typing things out works just as well — there's no wrong way to start.
            </p>
            <Button
              variant="collee-outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload resume (optional)
            </Button>
          </div>
        ) : (
          <div className="bg-primary/5 rounded-xl border border-primary/20 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-body-sm font-medium text-foreground">{uploadedFile.name}</p>
                <p className="text-caption text-muted-foreground">
                  {isParsingResume
                    ? 'Parsing your resume...'
                    : resumeParseError
                      ? resumeParseError
                      : resumeText
                        ? `Parsed ${resumeText.split(/\s+/).filter(Boolean).length} words`
                        : 'We will use this as a starting point'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </motion.div>

      <motion.div
        className="bg-card rounded-2xl border border-border p-8 shadow-soft"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <textarea
          className="w-full min-h-[240px] bg-transparent border-0 resize-none text-foreground placeholder:text-foreground-subtle focus:outline-none text-body leading-relaxed"
          placeholder={placeholderText}
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
        />
        
        <div className="border-t border-border pt-4 mt-4">
          <p className="text-body-sm text-muted-foreground">
            💡 Bullet points are totally fine. Just brain dump what comes to mind.
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex justify-between items-center mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <Button 
          variant="collee-ghost" 
          onClick={onBack}
        >
          Back
        </Button>
        
        <Button 
          variant="collee-accent" 
          size="collee-sm"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </motion.div>
    </ColleeLayout>
  );
};

export default ResumeScreen;
