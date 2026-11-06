import type { Fingering } from '../types/music'

// Map of standard Soprano Recorder fingerings (Concert pitch in C)
// Array representation: [Thumb, Hole1, Hole2, Hole3, Hole4, Hole5, Hole6, Hole7]
// 1 = covered, 0 = open, 0.5 = half/pinched

export const BAROQUE_FINGERINGS: Record<number, Fingering> = {
  // C4 (Low C)
  60: { holes: [1, 1, 1, 1, 1, 1, 1, 1], name: 'C', solfege: 'Do', octave: 4 },
  // C#4 / Db4
  61: { holes: [1, 1, 1, 1, 1, 1, 1, 0.5], name: 'C#', solfege: 'Do#', octave: 4 },
  // D4
  62: { holes: [1, 1, 1, 1, 1, 1, 1, 0], name: 'D', solfege: 'Ré', octave: 4 },
  // D#4 / Eb4
  63: { holes: [1, 1, 1, 1, 1, 1, 0.5, 0], name: 'D#', solfege: 'Ré#', octave: 4 },
  // E4
  64: { holes: [1, 1, 1, 1, 1, 1, 0, 0], name: 'E', solfege: 'Mi', octave: 4 },
  // F4
  65: { holes: [1, 1, 1, 1, 1, 0, 1, 1], name: 'F', solfege: 'Fa', octave: 4 },
  // F#4 / Gb4
  66: { holes: [1, 1, 1, 1, 0, 1, 1, 0], name: 'F#', solfege: 'Fa#', octave: 4 },
  // G4
  67: { holes: [1, 1, 1, 1, 0, 0, 0, 0], name: 'G', solfege: 'Sol', octave: 4 },
  // G#4 / Ab4
  68: { holes: [1, 1, 1, 0, 1, 1, 0, 0], name: 'G#', solfege: 'Sol#', octave: 4 },
  // A4
  69: { holes: [1, 1, 1, 0, 0, 0, 0, 0], name: 'A', solfege: 'La', octave: 4 },
  // A#4 / Bb4
  70: { holes: [1, 1, 0, 1, 1, 0, 0, 0], name: 'A#', solfege: 'Sib', octave: 4 },
  // B4
  71: { holes: [1, 1, 0, 0, 0, 0, 0, 0], name: 'B', solfege: 'Si', octave: 4 },

  // C5 (Middle C on recorder)
  72: { holes: [1, 0, 1, 0, 0, 0, 0, 0], name: "C'", solfege: "Do'", octave: 5, isHighOctave: true },
  // C#5 / Db5
  73: { holes: [0, 1, 1, 0, 0, 0, 0, 0], name: "C#'", solfege: "Do#'", octave: 5, isHighOctave: true },
  // D5
  74: { holes: [0, 0, 1, 0, 0, 0, 0, 0], name: "D'", solfege: "Ré'", octave: 5, isHighOctave: true },
  // D#5 / Eb5
  75: { holes: [0, 1, 1, 1, 1, 1, 0, 0], name: "D#'", solfege: "Ré#'", octave: 5, isHighOctave: true },
  // E5
  76: { holes: [0.5, 1, 1, 1, 1, 1, 0, 0], name: "E'", solfege: "Mi'", octave: 5, isHighOctave: true },
  // F5
  77: { holes: [0.5, 1, 1, 1, 1, 0, 1, 0], name: "F'", solfege: "Fa'", octave: 5, isHighOctave: true },
  // F#5 / Gb5
  78: { holes: [0.5, 1, 1, 1, 0, 1, 0, 0], name: "F#'", solfege: "Fa#'", octave: 5, isHighOctave: true },
  // G5
  79: { holes: [0.5, 1, 1, 1, 0, 0, 0, 0], name: "G'", solfege: "Sol'", octave: 5, isHighOctave: true },
  // G#5 / Ab5
  80: { holes: [0.5, 1, 1, 0, 1, 0, 0, 0], name: "G#'", solfege: "Sol#'", octave: 5, isHighOctave: true },
  // A5
  81: { holes: [0.5, 1, 1, 0, 0, 0, 0, 0], name: "A'", solfege: "La'", octave: 5, isHighOctave: true },
  // A#5 / Bb5
  82: { holes: [0.5, 1, 1, 0, 1, 1, 1, 0], name: "A#'", solfege: "Sib'", octave: 5, isHighOctave: true },
  // B5
  83: { holes: [0.5, 1, 1, 0, 0, 1, 1, 0], name: "B'", solfege: "Si'", octave: 5, isHighOctave: true },

  // C6
  84: { holes: [0.5, 1, 0, 0, 1, 1, 0, 0], name: "C''", solfege: "Do''", octave: 6, isHighOctave: true },
  // C#6
  85: { holes: [0.5, 0, 1, 1, 0, 1, 1, 1], name: "C#''", solfege: "Do#''", octave: 6, isHighOctave: true },
  // D6
  86: { holes: [0.5, 1, 0, 1, 1, 0, 1, 1], name: "D''", solfege: "Ré''", octave: 6, isHighOctave: true },
}

export const GERMAN_FINGERINGS: Record<number, Fingering> = {
  ...BAROQUE_FINGERINGS,
  // German F4 is simplified (holes 1,2,3,4 closed, rest open)
  65: { holes: [1, 1, 1, 1, 1, 0, 0, 0], name: 'F', solfege: 'Fa', octave: 4 },
  // German F5
  77: { holes: [0.5, 1, 1, 1, 1, 0, 0, 0], name: "F'", solfege: "Fa'", octave: 5, isHighOctave: true },
  // German F#4
  66: { holes: [1, 1, 1, 1, 0, 1, 0, 0], name: 'F#', solfege: 'Fa#', octave: 4 },
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const SOLFEGE_NAMES = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'Sib', 'Si']

export function midiToNoteName(midi: number): { name: string; octave: number; solfege: string } {
  const noteIndex = ((midi % 12) + 12) % 12
  const octave = Math.floor(midi / 12) - 1
  return {
    name: NOTE_NAMES[noteIndex],
    octave,
    solfege: SOLFEGE_NAMES[noteIndex],
  }
}

export function noteNameToMidi(noteName: string): number | null {
  const cleaned = noteName.trim().toUpperCase()
  const match = cleaned.match(/^([A-G][#B]?)(-?\d+)?('*)?$/)
  if (!match) return null

  let note = match[1]
  if (note.endsWith('B') && note.length > 1) {
    // Flat to sharp conversion
    const flatMap: Record<string, string> = {
      DB: 'C#',
      EB: 'D#',
      GB: 'F#',
      AB: 'G#',
      BB: 'A#',
    }
    note = flatMap[note] || note
  }

  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) return null

  let octave = 4
  if (match[2] !== undefined) {
    octave = parseInt(match[2], 10)
  } else if (match[3]) {
    octave = 4 + match[3].length
  }

  return (octave + 1) * 12 + noteIndex
}

export function getFingering(midi: number, system: 'baroque' | 'german' = 'baroque'): Fingering {
  const dictionary = system === 'german' ? GERMAN_FINGERINGS : BAROQUE_FINGERINGS
  if (dictionary[midi]) {
    return dictionary[midi]
  }

  // Fallback: clamp or fold octave to fit recorder range (60 - 86)
  let folded = midi
  while (folded < 60) folded += 12
  while (folded > 86) folded -= 12

  if (dictionary[folded]) {
    return dictionary[folded]
  }

  // Nearest match
  const nearest = Math.max(60, Math.min(86, midi))
  return dictionary[nearest] || {
    holes: [0, 0, 0, 0, 0, 0, 0, 0],
    name: '?',
    solfege: '?',
    octave: 4,
  }
}

export function getDisplayLabels(midi: number): { letter: string; solfege: string } {
  const { name, octave } = midiToNoteName(midi)
  let letter = name
  let solfege = SOLFEGE_NAMES[((midi % 12) + 12) % 12]

  if (octave >= 5) {
    const primes = "'".repeat(octave - 4)
    letter += primes
    solfege += primes
  }

  return { letter, solfege }
}

/**
 * Calculates the best transposition (in semitones) so that
 * all notes fit into the Soprano Recorder range (60 - 86, sweet spot 62 - 79).
 */
export function calculateBestTransposition(midis: number[]): number {
  if (midis.length === 0) return 0

  const minMidi = Math.min(...midis)
  const maxMidi = Math.max(...midis)

  // If already within range
  if (minMidi >= 60 && maxMidi <= 86) {
    return 0
  }

  // Check full octave shifts first
  for (const shift of [12, -12, 24, -24]) {
    if (minMidi + shift >= 60 && maxMidi + shift <= 86) {
      return shift
    }
  }

  // Find shift that maximizes notes in range 62-84
  let bestShift = 0
  let maxScore = -1

  for (let shift = -24; shift <= 24; shift++) {
    let score = 0
    for (const m of midis) {
      const shifted = m + shift
      if (shifted >= 60 && shifted <= 86) {
        score += 2
        if (shifted >= 62 && shifted <= 79) score += 1 // sweet spot
      } else {
        score -= 5
      }
    }
    if (score > maxScore) {
      maxScore = score
      bestShift = shift
    }
  }

  return bestShift
}
