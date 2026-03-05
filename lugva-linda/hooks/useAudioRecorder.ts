import { useState, useRef, useEffect, useCallback } from 'react'

export const useAudioRecorder = (onAudioReady: (file: File | null) => void) => {
  const [isRecording, setIsRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      await new Promise((resolve) => setTimeout(resolve, 300))

      let mimeType = ''
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))
        mimeType = 'audio/webm;codecs=opus'
      else if (MediaRecorder.isTypeSupported('audio/webm'))
        mimeType = 'audio/webm'
      else if (MediaRecorder.isTypeSupported('audio/mp4'))
        mimeType = 'audio/mp4'

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      )
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const finalType = mimeType || 'audio/mp4'
        const blob = new Blob(chunksRef.current, { type: finalType })

        if (blob.size === 0) return alert("L'enregistrement a échoué.")

        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        const extension = finalType.includes('mp4') ? 'mp4' : 'webm'
        const file = new File([blob], `audio-${Date.now()}.${extension}`, {
          type: finalType,
        })
        onAudioReady(file)

        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start(250)
      startTimeRef.current = Date.now()
      setIsRecording(true)
    } catch (error) {
      console.error("Erreur d'accès au microphone :", error)
    }
  }, [onAudioReady])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      const elapsedSeconds = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      )
      setDuration(elapsedSeconds)
    }
  }, [isRecording])

  const deleteAudio = useCallback(() => {
    setAudioUrl(null)
    setDuration(0)
    onAudioReady(null)
    chunksRef.current = []
  }, [onAudioReady])

  return {
    isRecording,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    deleteAudio,
  }
}
