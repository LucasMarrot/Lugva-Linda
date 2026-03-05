'use client'

import { useState, useRef } from 'react'
import { Mic, Square, Trash2, Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioRecorder } from '@/hooks/useAudioRecorder' // <-- Import du Hook

type AudioRecorderProps = {
  onAudioReady: (file: File | null) => void
}

export const AudioRecorder = ({ onAudioReady }: AudioRecorderProps) => {
  const {
    isRecording,
    audioUrl,
    duration,
    startRecording,
    stopRecording,
    deleteAudio,
  } = useAudioRecorder(onAudioReady)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioLoaded, setIsAudioLoaded] = useState(false)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioPlayerRef.current || !isAudioLoaded) return

    if (isPlaying) {
      audioPlayerRef.current.pause()
      setIsPlaying(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleDelete = () => {
    setIsPlaying(false)
    setIsAudioLoaded(false)
    deleteAudio()
  }

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      {!audioUrl ? (
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'outline'}
          className="h-12 w-full gap-2 border-dashed transition-colors"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? (
            <>
              <Square className="h-4 w-4 fill-current" /> Arrêter
              l'enregistrement
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" /> Enregistrer la prononciation
            </>
          )}
        </Button>
      ) : (
        <div className="border-border bg-muted/30 flex w-full items-center justify-between rounded-xl border p-2 px-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={togglePlay}
              disabled={!isAudioLoaded}
              className="bg-primary/10 text-primary hover:bg-primary/20 h-9 w-9 shrink-0 rounded-full"
            >
              {!isAudioLoaded ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Square className="h-4 w-4 fill-current" />
              ) : (
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              )}
            </Button>
            <div className="text-muted-foreground text-sm font-medium">
              {formatDuration(duration)}
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 h-9 w-9 shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          <audio
            ref={audioPlayerRef}
            src={audioUrl}
            playsInline
            preload="auto"
            onCanPlayThrough={() => setIsAudioLoaded(true)}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
