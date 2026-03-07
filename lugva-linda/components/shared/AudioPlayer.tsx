'use client'

import { useState, useRef } from 'react'
import { Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="bg-muted/30 border-border/50 flex items-center gap-3 rounded-xl border p-3">
      <Button
        variant="secondary"
        size="icon"
        onClick={togglePlay}
        className="bg-primary/10 text-primary hover:bg-primary/20 h-12 w-12 shrink-0 rounded-full"
      >
        {isPlaying ? (
          <Square className="h-5 w-5 fill-current" />
        ) : (
          <Play className="ml-1 h-5 w-5 fill-current" />
        )}
      </Button>
      <span className="text-muted-foreground font-medium">
        Écouter la prononciation
      </span>

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </div>
  )
}
