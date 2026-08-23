import { useState, useEffect, useRef, useCallback } from 'react';
import { sendVoiceSnippet } from '../lib/api';

/**
 * Hook for Web Speech API live Speech-to-Text transcription.
 * Designed with a stable recognition instance and smooth lifecycle handling.
 */
export function useSpeechRecognition({ onTranscriptChange } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef('');
  const isListeningRef = useRef(false);
  const onTranscriptChangeRef = useRef(onTranscriptChange);

  // Keep callback ref updated
  useEffect(() => {
    onTranscriptChangeRef.current = onTranscriptChange;
  }, [onTranscriptChange]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    let recognition;
    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
    } catch (err) {
      console.warn('SpeechRecognition initialization error:', err);
      setIsSupported(false);
      return;
    }

    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    recognition.onresult = (event) => {
      let currentInterim = '';
      let newlyFinalized = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          newlyFinalized += item[0].transcript + ' ';
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (newlyFinalized) {
        fullTranscriptRef.current += newlyFinalized;
        setTranscript(fullTranscriptRef.current);
        if (onTranscriptChangeRef.current) {
          onTranscriptChangeRef.current(fullTranscriptRef.current);
        }
        sendVoiceSnippet(newlyFinalized);
      }

      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event) => {
      // Ignore non-fatal lifecycle events (aborted on stop/toggle, silence, etc.)
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else {
        console.warn('Speech recognition notice:', event.error);
      }
    };

    recognition.onend = () => {
      // If user still wants listening active, restart gracefully
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
    };
  }, []); // Run once on mount!

  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser. You can type your answer in the text box.');
        return;
      }
      return;
    }

    isListeningRef.current = true;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // If already running or starting, ignore error
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    fullTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const setManualTranscript = useCallback((text) => {
    fullTranscriptRef.current = text;
    setTranscript(text);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    setManualTranscript,
  };
}
