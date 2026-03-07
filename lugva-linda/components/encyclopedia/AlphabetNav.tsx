'use client'

import { useState, useRef, useEffect } from 'react'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

type AlphabetNavProps = {
  availableLetters: string[]
}

export const AlphabetNav = ({ availableLetters }: AlphabetNavProps) => {
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const handlePointer = (e: React.PointerEvent | PointerEvent) => {
    if (!listRef.current) return
    e.preventDefault()

    const rect = listRef.current.getBoundingClientRect()
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1))
    const index = Math.floor((y / rect.height) * ALPHABET.length)
    const letter = ALPHABET[index]

    if (activeLetter !== letter) {
      setActiveLetter(letter)
      const targetElement = document.getElementById(`letter-${letter}`)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'instant', block: 'start' })
      }
    }
  }

  const handlePointerUp = () => setActiveLetter(null)

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex w-8 touch-none flex-col justify-center py-24 pr-3 select-none sm:py-4"
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div ref={listRef} className="flex w-full flex-col items-center py-2">
        {ALPHABET.map((letter) => {
          const isAvailable = availableLetters.includes(letter)
          const isActive = activeLetter === letter

          return (
            <div
              key={letter}
              className="relative flex max-h-[24px] min-h-[12px] w-full flex-1 items-center justify-center"
            >
              {isActive && (
                <div className="bg-primary text-primary-foreground animate-in fade-in zoom-in pointer-events-none absolute right-12 flex h-14 w-14 items-center justify-center rounded-full text-3xl font-bold shadow-2xl duration-75 sm:right-8">
                  {letter}
                </div>
              )}

              <span
                className={`text-[10px] font-bold transition-colors sm:text-xs ${
                  isActive
                    ? 'text-primary scale-125'
                    : isAvailable
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/30'
                }`}
              >
                {isActive ? '•' : letter}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
