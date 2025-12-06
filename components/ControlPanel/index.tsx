import React, { useState, useRef } from 'react';
import { Layers, Trash2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { FileSystem, HistoryEntry } from '../../types';

// Sub-components
import { FileUploadZone } from './FileUploadZone';
import { PromptInput } from './PromptInput';
import { HistoryPanel } from './HistoryPanel';
import { SettingsPanel } from './SettingsPanel';
import { ModeToggle } from './ModeToggle';
import { GenerateButton } from './GenerateButton';

interface ControlPanelProps {
  files: FileSystem;
  setFiles: (files: FileSystem) => void;
  activeFile: string;
  setActiveFile: (file: string) => void;
  setSuggestions: (suggestions: string[] | null) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  resetApp: () => void;
  history: HistoryEntry[];
  addToHistory: (label: string, files: FileSystem) => void;
  restoreHistory: (entry: HistoryEntry) => void;
  reviewChange: (label: string, newFiles: FileSystem) => void;
}

// Follow-up prompt suggestions
const FOLLOW_UP_PROMPTS = [
  'Add dark mode toggle',
  'Make it more responsive',
  'Add loading states',
  'Improve accessibility',
  'Add animations',
  'Add form validation'
];

// Constants for validation
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PROMPT_LENGTH = 2000;

export const ControlPanel: React.FC<ControlPanelProps> = ({
  files,
  setSuggestions,
  isGenerating,
  setIsGenerating,
  resetApp,
  history,
  restoreHistory,
  reviewChange
}) => {
  // File state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [brandFile, setBrandFile] = useState<File | null>(null);
  const [brandPreview, setBrandPreview] = useState<string | null>(null);

  // Form state
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConsultantMode, setIsConsultantMode] = useState(false);
  const [isEducationMode, setIsEducationMode] = useState(false);

  // UI state
  const [lastGenerationSummary, setLastGenerationSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const processFile = (selectedFile: File, isBrand: boolean = false) => {
    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMessage(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMessage('Invalid file type. Please upload PNG, JPEG, or WebP images.');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (isBrand) {
      setBrandFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setBrandPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const removeFile = (isBrand: boolean = false) => {
    if (isBrand) {
      setBrandFile(null);
      setBrandPreview(null);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  // Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setErrorMessage('Your browser does not support voice recognition.');
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setPrompt((prev) => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleGenerate = async () => {
    const existingApp = files['src/App.tsx'];

    if (!existingApp && !file) return;
    if (existingApp && !prompt.trim() && !file) return;
    if (isConsultantMode && !file && !existingApp) return;

    setIsGenerating(true);
    setSuggestions(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contents: { parts: any[] }[] = [];

      if (isConsultantMode) {
        // Consultant mode logic
        const systemInstruction =
          'You are a Senior Product Manager and UX Expert. Analyze the provided wireframe/sketch deeply. Identify missing UX elements, accessibility gaps, logical inconsistencies, or edge cases. Output ONLY a raw JSON array of strings containing your specific suggestions. Do not include markdown formatting.';

        const parts: any[] = [];

        if (file && preview) {
          const base64Data = preview.split(',')[1];
          parts.push({ inlineData: { mimeType: file.type, data: base64Data } });
        }

        parts.push({
          text: prompt ? `Analyze this design. Context: ${prompt}` : 'Analyze this design for UX gaps.'
        });

        contents.push({ parts });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents[0],
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '[]';
        try {
          const suggestionsData = JSON.parse(text);
          setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : ['Could not parse suggestions.']);
        } catch {
          setSuggestions(['Error parsing consultant suggestions.']);
        }
      } else {
        // Generate app logic
        let systemInstruction = `You are an expert React Developer.
Input: A wireframe/sketch (image) and user context.
Output: A complete, multi-file React project structure in JSON format.
Key Requirements:
1. **JSON Output**: The response must be a single JSON object where keys are file paths and values are the code content.
2. **Components**: Break the UI into logical sub-components placed in 'src/components/'.
3. **Entry Point**: You MUST provide 'src/App.tsx'.
4. **Imports**: Use ABSOLUTE paths matching the JSON keys.
5. **Styling**: Use Tailwind CSS.
6. **Icons**: Use 'lucide-react'.

Design Standards:
- Modern, clean aesthetic with generous padding.
- If the sketch is messy, interpret it as high-fidelity.

Content Realism:
- Create realistic mock data with 5-8 entries.
- DO NOT use "Lorem Ipsum".

Technical:
- Return ONLY valid JSON. No markdown backticks.`;

        if (brandFile && brandPreview) {
          systemInstruction += `\n\nBRANDING INSTRUCTIONS:
- Extract the PRIMARY DOMINANT COLOR from 'MEDIA 2: BRAND LOGO'.
- Use this hex code for primary actions/accents.`;
        }

        if (isEducationMode) {
          systemInstruction += `\n\nEDUCATION MODE:
- Add detailed inline comments explaining complex Tailwind classes and React hooks.`;
        }

        const parts: any[] = [];

        if (file && preview) {
          const base64Data = preview.split(',')[1];
          parts.push({ text: 'MEDIA 1: UI SKETCH / WIREFRAME' });
          parts.push({ inlineData: { mimeType: file.type, data: base64Data } });
        }

        if (brandFile && brandPreview) {
          const base64Data = brandPreview.split(',')[1];
          parts.push({ text: 'MEDIA 2: BRAND LOGO' });
          parts.push({ inlineData: { mimeType: brandFile.type, data: base64Data } });
        }

        if (existingApp) {
          parts.push({ text: `Current Project Files (JSON): ${JSON.stringify(files)}` });
          parts.push({ text: `User Update Request: ${prompt || 'Refine the app based on the brand/sketch.'}` });
          systemInstruction += ' Update the existing project files. Return the FULL JSON object.';
        } else {
          parts.push({ text: `Task: Implement this design. ${prompt ? `Context: ${prompt}` : ''}` });
        }

        contents.push({ parts });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents[0],
          config: {
            systemInstruction,
            responseMimeType: 'application/json'
          }
        });

        const text = response.text || '{}';

        try {
          const newFiles = JSON.parse(text);
          const mergedFiles = { ...files, ...newFiles };

          reviewChange(existingApp ? 'Updated App' : 'Generated Initial App', mergedFiles);

          const fileCount = Object.keys(newFiles).length;
          const componentCount = Object.keys(newFiles).filter((f) => f.includes('/components/')).length;
          setLastGenerationSummary(
            existingApp
              ? `Updated ${fileCount} file${fileCount > 1 ? 's' : ''} based on your request.`
              : `Created ${fileCount} file${fileCount > 1 ? 's' : ''}${
                  componentCount > 0 ? ` including ${componentCount} component${componentCount > 1 ? 's' : ''}` : ''
                }.`
          );
        } catch {
          setErrorMessage('Error generating project structure. Please try again.');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrorMessage(errMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  const existingApp = files['src/App.tsx'];

  return (
    <aside className="w-full md:w-[30%] md:min-w-[320px] md:max-w-[400px] h-full min-h-0 flex flex-col gap-4 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-4 md:p-5 shadow-2xl overflow-hidden relative z-20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 flex-none">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/5 shadow-inner">
            <Layers className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-slate-300">
              FluidFlow
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">SKETCH TO APP</p>
          </div>
        </div>

        <button
          onClick={resetApp}
          className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
          title="Clear All & Reset"
          aria-label="Clear all and reset application"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent flex-none" />

      {/* Error Toast */}
      {errorMessage && (
        <div className="flex-none p-3 bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-none" />
            <p className="text-xs text-red-300">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto p-1 hover:bg-red-500/20 rounded text-red-400"
              aria-label="Dismiss error"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto custom-scrollbar relative">
        {/* Generation Summary */}
        {lastGenerationSummary && existingApp && (
          <div className="flex-none p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-none" />
              <p className="text-xs text-green-300">{lastGenerationSummary}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FOLLOW_UP_PROMPTS.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(suggestion)}
                  className="px-2 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-md border border-white/5 transition-all"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Zones */}
        <FileUploadZone
          file={file}
          preview={preview}
          onFileSelect={(f) => processFile(f, false)}
          onRemove={() => removeFile(false)}
          variant="sketch"
        />

        <FileUploadZone
          file={brandFile}
          preview={brandPreview}
          onFileSelect={(f) => processFile(f, true)}
          onRemove={() => removeFile(true)}
          variant="brand"
        />

        {/* Prompt Input */}
        <PromptInput
          value={prompt}
          onChange={setPrompt}
          isListening={isListening}
          onToggleListening={toggleListening}
          isConsultantMode={isConsultantMode}
          hasExistingApp={!!existingApp}
          maxLength={MAX_PROMPT_LENGTH}
        />

        {/* History Panel */}
        <HistoryPanel history={history} onRestore={restoreHistory} />
      </div>

      {/* Footer Actions */}
      <div className="flex-none pt-4 border-t border-white/5 flex flex-col gap-4">
        <ModeToggle isConsultantMode={isConsultantMode} onToggle={() => setIsConsultantMode(!isConsultantMode)} />

        <GenerateButton
          onClick={handleGenerate}
          isGenerating={isGenerating}
          isDisabled={(!file && !existingApp) || (!!existingApp && !prompt.trim() && !file)}
          isConsultantMode={isConsultantMode}
          hasExistingApp={!!existingApp}
          hasFile={!!file}
          hasPrompt={!!prompt.trim()}
        />
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isEducationMode={isEducationMode}
        onEducationModeChange={setIsEducationMode}
        hasApiKey={!!process.env.API_KEY}
      />
    </aside>
  );
};
