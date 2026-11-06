import type { NoteEvent, SongMetadata } from '../types/music'
import { getDisplayLabels, getFingering, midiToNoteName, noteNameToMidi } from './recorderFingering'

function createNotesFromSequence(
  sequence: [string, number][], // [pitch e.g. "E4", beats]
  bpm: number,
  fingeringSystem: 'baroque' | 'german' = 'baroque'
): NoteEvent[] {
  const secondsPerBeat = 60 / bpm
  let currentTime = 0
  const notes: NoteEvent[] = []

  sequence.forEach(([pitch, beats], idx) => {
    if (pitch === 'REST' || pitch === '-') {
      currentTime += beats * secondsPerBeat
      return
    }

    const midi = noteNameToMidi(pitch)
    if (midi === null) {
      currentTime += beats * secondsPerBeat
      return
    }

    const duration = beats * secondsPerBeat
    const { letter, solfege } = getDisplayLabels(midi)
    const fingering = getFingering(midi, fingeringSystem)
    const { name, octave } = midiToNoteName(midi)

    notes.push({
      id: `lib-note-${idx}`,
      pitch: `${name}${octave}`,
      midi,
      startTime: currentTime,
      duration: Math.max(0.12, duration * 0.92), // Slight staccato spacing for realistic breath articulation
      letter,
      solfege,
      holes: fingering.holes,
      noteIndex: idx,
    })

    currentTime += duration
  })

  return notes
}

// -------------------------------------------------------------
// 1. BAD APPLE!! (Full Complete Arrangement)
// By ZUN / Alstroemeria Records - Arranged in E minor
// -------------------------------------------------------------
const BAD_APPLE_TEMPO = 138

const BAD_APPLE_SEQUENCE: [string, number][] = [
  // --- Intro (Slowed / Tutorial Intro) ---
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['E5', 0.5], ['D5', 0.5], ['B4', 1.0],
  ['E4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 0.5], ['F#4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1.0], ['F#4', 0.5], ['E4', 0.5], ['F#4', 0.5],
  ['G4', 0.5], ['A4', 1.0], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 2.0],

  // --- Verse 1: "Nagareteku toki no naka de demo" ---
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5],
  ['E5', 0.5], ['D5', 0.5], ['B4', 1.0], ['A4', 0.5], ['G4', 0.5], ['F#4', 1.0],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 1.5], ['REST', 0.5],

  // "Kedarusa ga hora guruguru mawatte"
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5],
  ['E5', 0.5], ['D5', 0.5], ['B4', 1.0], ['A4', 0.5], ['B4', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 1.0], ['E4', 0.5], ['F#4', 0.5], ['E4', 2.0],

  // --- Pre-Chorus: "Watashi kara hanareru kokoro mo" ---
  ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['G4', 0.5], ['F#4', 0.5], ['E4', 1.0], ['E4', 0.5], ['F#4', 0.5], ['G4', 1.0],
  ['A4', 0.5], ['B4', 0.5], ['C5', 1.0], ['C5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5],
  ['A4', 0.5], ['G4', 0.5], ['F#4', 1.0], ['F#4', 0.5], ['G4', 0.5], ['A4', 1.0],

  // "Mienai furi shite tsudzukeru"
  ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['D5', 0.5], ['C5', 0.5], ['B4', 1.0],
  ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['F#4', 0.5],
  ['B4', 1.0], ['B4', 1.0], ['B4', 2.0],

  // --- Chorus (Iconic Theme): "Ugokidaseba tomaranai" ---
  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 1.5], ['REST', 0.5],

  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 1.0], ['E5', 1.0],
  ['D5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 1.0], ['E4', 0.5], ['F#4', 0.5], ['E4', 2.0],

  // --- Chorus Repeat / Climax ---
  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 1.5], ['REST', 0.5],

  // Final resolve
  ['E5', 0.5], ['D5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['D5', 0.5], ['B4', 0.5], ['E5', 2.5],
]

// -------------------------------------------------------------
// 2. THE SAILOR'S HORNPIPE / RAKE HORNPIPE (Complete Traditional Song)
// Famous brisk sea shanty hornpipe dance in G Major
// -------------------------------------------------------------
const HORNPIPE_TEMPO = 116

const HORNPIPE_SEQUENCE: [string, number][] = [
  // --- Part A (Measure 1 - 8) ---
  ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G4', 0.5], ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G4', 0.5],
  ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['A4', 0.5],
  ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['D5', 0.5], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['E5', 0.5],
  ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1.0], ['G4', 1.0],

  // Repeat Part A
  ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G4', 0.5], ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G4', 0.5],
  ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['A4', 0.5], ['A4', 0.5], ['C5', 0.5], ['E5', 0.5], ['A4', 0.5],
  ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['D5', 0.5], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['E5', 0.5],
  ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 1.5], ['REST', 0.5],

  // --- Part B (High runs & hornpipe leaps) ---
  ['D5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['G5', 0.5], ['E5', 0.5], ['A5', 0.5], ['G5', 0.5], ['A5', 0.5],
  ['F#5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 1.0], ['D5', 1.0],
  ['D5', 0.5], ['G5', 0.5], ['F#5', 0.5], ['G5', 0.5], ['E5', 0.5], ['A5', 0.5], ['G5', 0.5], ['A5', 0.5],
  ['F#5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['G5', 1.5], ['REST', 0.5],

  // Part B Second Half / Grand Finale
  ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['D5', 0.5], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['E5', 0.5],
  ['D5', 0.5], ['B4', 0.5], ['C5', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['A4', 0.5], ['F#4', 0.5],
  ['G4', 0.5], ['B4', 0.5], ['D5', 0.5], ['G5', 0.5], ['C5', 0.5], ['E5', 0.5], ['A5', 0.5], ['F#5', 0.5],
  ['G5', 0.5], ['D5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 2.0],
]

// -------------------------------------------------------------
// 3. GREENSLEEVES (Full Complete Arrangement)
// 16th-Century Traditional English Ballad in A Dorian
// -------------------------------------------------------------
const GREENSLEEVES_TEMPO = 96

const GREENSLEEVES_SEQUENCE: [string, number][] = [
  // --- Verse 1 ---
  ['A4', 1.0],
  ['C5', 2.0], ['D5', 1.0], ['E5', 1.5], ['F5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 2.0], ['A4', 1.0], ['A4', 1.5], ['G#4', 0.5], ['A4', 1.0],
  ['B4', 2.0], ['G#4', 1.0], ['E4', 2.0], ['A4', 1.0],

  ['C5', 2.0], ['D5', 1.0], ['E5', 1.5], ['F5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 1.5], ['B4', 0.5], ['A4', 1.0], ['G#4', 1.5], ['F#4', 0.5], ['G#4', 1.0],
  ['A4', 3.0], ['A4', 2.0], ['REST', 1.0],

  // --- Chorus: "Greensleeves was all my joy" ---
  ['G5', 3.0], ['G5', 1.5], ['F#5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 2.0], ['A4', 1.0], ['A4', 1.5], ['G#4', 0.5], ['A4', 1.0],
  ['B4', 2.0], ['G#4', 1.0], ['E4', 2.0], ['REST', 1.0],

  ['G5', 3.0], ['G5', 1.5], ['F#5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 1.5], ['B4', 0.5], ['A4', 1.0], ['G#4', 1.5], ['F#4', 0.5], ['G#4', 1.0],
  ['A4', 4.0], ['REST', 1.0],

  // --- Verse 2 (Ornamented recorder variation) ---
  ['A4', 0.5], ['B4', 0.5],
  ['C5', 1.5], ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 1.5], ['F5', 0.5], ['E5', 1.0],
  ['D5', 1.5], ['C5', 0.5], ['D5', 0.5], ['B4', 0.5], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 1.5], ['B4', 0.5], ['A4', 1.0], ['A4', 1.5], ['G#4', 0.5], ['A4', 1.0],
  ['B4', 2.0], ['G#4', 1.0], ['E4', 2.0], ['A4', 1.0],

  // Final resolution
  ['C5', 1.5], ['B4', 0.5], ['A4', 1.0], ['G#4', 1.5], ['F#4', 0.5], ['G#4', 1.0],
  ['A4', 4.0],
]

// -------------------------------------------------------------
// 4. BEETHOVEN - ODE TO JOY (Symphony No. 9 - Complete Recorder Theme)
// In G Major / D Major for Soprano Recorder
// -------------------------------------------------------------
const ODE_TO_JOY_TEMPO = 120

const ODE_TO_JOY_SEQUENCE: [string, number][] = [
  // --- Section A ---
  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['B4', 1.5], ['A4', 0.5], ['A4', 2.0],

  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['A4', 1.5], ['G4', 0.5], ['G4', 2.0],

  // --- Section B (Bridge) ---
  ['A4', 1.0], ['A4', 1.0], ['B4', 1.0], ['G4', 1.0],
  ['A4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 1.0], ['G4', 1.0],
  ['A4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['A4', 1.0], ['D4', 2.0],

  // --- Section A' (Recap & Finale) ---
  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['A4', 1.5], ['G4', 0.5], ['G4', 3.0],
]

export const PRESET_SONGS: SongMetadata[] = [
  {
    id: 'bad-apple',
    title: 'Bad Apple!!',
    subtitle: 'feat. SEKAI • Alstroemeria Records',
    artist: 'ZUN / Masayoshi Minoshima',
    category: 'Touhou & Anime',
    tempo: BAD_APPLE_TEMPO,
    bannerCta: 'Subscribe for daily tutorials',
    speedLabel: '"SLOWED"',
    bottomTitle: 'BAD APPLE',
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'reimu',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(BAD_APPLE_SEQUENCE, BAD_APPLE_TEMPO),
  },
  {
    id: 'sailors-hornpipe',
    title: "The Sailor's Hornpipe",
    subtitle: 'The Rake Hornpipe • Complete Song',
    artist: 'Traditional Hornpipe Dance',
    category: 'Folk & Sea Shanty',
    tempo: HORNPIPE_TEMPO,
    bannerCta: 'Traditional Sea Shanty Classics',
    speedLabel: '"STANDARD TEMPO"',
    bottomTitle: "THE SAILOR'S HORNPIPE",
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'sailor',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(HORNPIPE_SEQUENCE, HORNPIPE_TEMPO),
  },
  {
    id: 'greensleeves',
    title: 'Greensleeves',
    subtitle: 'Complete Ballad & Variations',
    artist: 'Traditional 16th Century English',
    category: 'Folk & Sea Shanty',
    tempo: GREENSLEEVES_TEMPO,
    bannerCta: 'Renaissance Recorder Classics',
    speedLabel: '"ANDANTE"',
    bottomTitle: 'GREENSLEEVES',
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'greentea',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(GREENSLEEVES_SEQUENCE, GREENSLEEVES_TEMPO),
  },
  {
    id: 'ode-to-joy',
    title: 'Ode to Joy',
    subtitle: 'Symphony No. 9, Op. 125',
    artist: 'Ludwig van Beethoven',
    category: 'Classical',
    tempo: ODE_TO_JOY_TEMPO,
    bannerCta: 'Master Classical Repertoire',
    speedLabel: '"ALLEGRO"',
    bottomTitle: 'ODE TO JOY',
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'beethoven',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(ODE_TO_JOY_SEQUENCE, ODE_TO_JOY_TEMPO),
  },
]
