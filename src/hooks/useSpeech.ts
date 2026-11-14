import { useState, useEffect, useRef, useCallback } from 'react';
import { StorageService } from '../services/storageService';

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check speech recognition support
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        setRecognitionSupported(true);
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
      }

      // Check speech synthesis support
      if ('speechSynthesis' in window) {
        setSpeechSupported(true);
        const updateVoices = () => {
          const list = window.speechSynthesis.getVoices();
          setVoices(list);
        };
        updateVoices();
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onResult(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
      };

      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.warn('Could not start recognition:', e);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  const speakText = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const settings = StorageService.getSettings();
    if (!settings.ttsEnabled) return;

    window.speechSynthesis.cancel();

    // Strip markdown formatting symbols for smooth natural speech
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~[\]()]/g, '')
      .replace(/[-*•]\s+/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.speechRate || 1.0;
    utterance.pitch = settings.speechPitch || 1.0;

    if (settings.selectedVoice && voices.length > 0) {
      const chosen = voices.find((v) => v.name === settings.selectedVoice);
      if (chosen) utterance.voice = chosen;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    speechSupported,
    recognitionSupported,
    voices,
    startListening,
    stopListening,
    speakText,
    stopSpeaking,
  };
}
