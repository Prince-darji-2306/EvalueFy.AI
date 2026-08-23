import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

export function ResumeDropzone({ onFileSelected, isLoading = false }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndSelect = (file) => {
    setErrorMessage(null);
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please upload a PDF document (.pdf).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit.');
      return;
    }

    setSelectedFile(file);
    if (onFileSelected) {
      onFileSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 overflow-hidden ${
          isDragOver
            ? 'border-cyan-pulse bg-cyan-pulse/5 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
            : isLoading
            ? 'border-signal-indigo/50 bg-surface-2 cursor-wait'
            : 'border-border hover:border-signal-indigo/60 bg-surface hover:bg-surface-2/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          accept=".pdf,application/pdf"
          className="hidden"
          disabled={isLoading}
        />

        {/* Diagnostic Scanning Laser Beam when Loading */}
        {isLoading && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-pulse to-transparent shadow-[0_0_12px_var(--cyan-pulse)] pointer-events-none"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Center Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
            isLoading
              ? 'bg-signal-indigo/15 text-signal-indigo animate-pulse'
              : isDragOver
              ? 'bg-cyan-pulse/15 text-cyan-pulse scale-110'
              : 'bg-surface-2 text-ink-muted'
          }`}
        >
          {isLoading ? (
            <svg
              className="w-8 h-8 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
        </div>

        {/* Text descriptions */}
        <h3 className="text-base sm:text-lg font-semibold text-ink mb-1 font-display">
          {isLoading
            ? 'Performing ATS Deep Scan...'
            : selectedFile
            ? selectedFile.name
            : 'Drop your resume (PDF) here'}
        </h3>

        <p className="text-xs sm:text-sm text-ink-muted max-w-sm mb-3">
          {isLoading
            ? 'Analyzing semantic matching, layout structure, keywords, and potential deductions'
            : 'Drag and drop your PDF file or click to browse from your device'}
        </p>

        {selectedFile && !isLoading && (
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs text-verified-teal bg-verified-teal/10 px-2.5 py-0.5 rounded-full border border-verified-teal/20">
              PDF Loaded ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
            <span className="text-xs text-signal-indigo hover:underline font-mono">
              Click to replace
            </span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 text-[11px] font-mono text-ink-muted/80">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-verified-teal" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Text Extraction
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-verified-teal" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            ATS Score Breakdown
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-verified-teal" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            12 Tailored Questions
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-coral-low/10 border border-coral-low/30 text-coral-low text-xs font-mono flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
