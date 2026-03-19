import { useState, useRef, useEffect, useCallback } from 'react';

export const useAudioRecorder = (onAudioReady: (file: File | null) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [errorEvent, setErrorEvent] = useState<{
    id: number;
    message: string;
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const errorEventIdRef = useRef(0);

  const emitError = useCallback((message: string) => {
    errorEventIdRef.current += 1;
    setErrorEvent({ id: errorEventIdRef.current, message });
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "L'enregistrement audio n'est pas supporté sur ce navigateur ou nécessite une connexion sécurisée (HTTPS).",
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));

      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
        mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm'))
        mimeType = 'audio/webm';
      else if (MediaRecorder.isTypeSupported('audio/mp4'))
        mimeType = 'audio/mp4';

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const finalType = mimeType || 'audio/mp4';
        const blob = new Blob(chunksRef.current, { type: finalType });

        if (blob.size === 0) {
          emitError("L'enregistrement a echoue. Reessayez.");
          return;
        }

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const extension = finalType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `audio-${Date.now()}.${extension}`, {
          type: finalType,
        });
        onAudioReady(file);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (error) {
      console.error("Erreur d'accès au microphone :", error);
      emitError(
        "Impossible d'acceder au microphone. Verifiez les permissions puis reessayez.",
      );
    }
  }, [emitError, onAudioReady]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );
      setDuration(elapsedSeconds);
    }
  }, [isRecording]);

  const deleteAudio = useCallback(() => {
    setAudioUrl(null);
    setDuration(0);
    setErrorEvent(null);
    onAudioReady(null);
    chunksRef.current = [];
  }, [onAudioReady]);

  return {
    isRecording,
    audioUrl,
    duration,
    errorEvent,
    startRecording,
    stopRecording,
    deleteAudio,
  };
};
