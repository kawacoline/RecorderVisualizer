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
      duration: Math.max(0.1, duration * 0.94),
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
// 1. BAD APPLE!! (Authentic Alstroemeria Records feat. nomico)
// Arranged in E minor at the real 138 BPM
// -------------------------------------------------------------
const BAD_APPLE_BPM = 138

const BAD_APPLE_SEQUENCE: [string, number][] = [
  // --- Intro: Iconic driving melody ---
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['A4', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['A4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 1.0],

  // Intro repeat with variation
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['A4', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['A4', 1.0],
  ['G4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 2.0],

  // --- Verse 1: "Nagareteku toki no naka de demo" ---
  ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['B4', 0.5], ['C5', 0.5], ['A4', 1.5], ['REST', 0.5],
  // "Kedarusa ga hora guruguru mawatte"
  ['A4', 0.5], ['A4', 0.5], ['A4', 0.5], ['A4', 0.5], ['A4', 0.5], ['A4', 0.5], ['A4', 0.5], ['G4', 0.5],
  ['A4', 0.5], ['B4', 0.5], ['G4', 1.5], ['REST', 0.5],
  // "Watashi kara hanareru kokoro mo"
  ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['G4', 0.5], ['A4', 0.5], ['F#4', 1.5], ['REST', 0.5],
  // "Mienai furi shite tsudzukeru"
  ['E4', 0.5], ['E4', 0.5], ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5],
  ['B4', 2.0],

  // --- Pre-Chorus ---
  ['B4', 0.5], ['C5', 0.5], ['D5', 0.5], ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5],
  ['B4', 0.5], ['C5', 0.5], ['D5', 1.0], ['D5', 0.5], ['E5', 0.5], ['F#5', 1.0],
  ['E5', 0.5], ['D5', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 0.5],
  ['B4', 1.0], ['B4', 1.0], ['B4', 2.0],

  // --- Chorus: "Ugokidaseba tomaranai" ---
  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 1.5], ['REST', 0.5],

  // "Mawaru mawaru sekai no sumi de"
  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 1.0], ['E5', 1.0],
  ['D5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 1.0], ['E4', 0.5], ['F#4', 0.5], ['E4', 2.0],

  // --- Chorus Repeat / Climax ---
  ['E5', 0.5], ['E5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['F#5', 0.5], ['D5', 1.0],
  ['B4', 0.5], ['B4', 0.5], ['D5', 0.5], ['E5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 0.5], ['C5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5],
  ['E4', 0.5], ['F#4', 0.5], ['G4', 0.5], ['A4', 0.5], ['B4', 1.5], ['REST', 0.5],

  ['E5', 0.5], ['D5', 0.5], ['B4', 0.5], ['A4', 0.5], ['G4', 0.5], ['F#4', 0.5], ['E4', 1.0],
  ['G4', 0.5], ['A4', 0.5], ['B4', 1.0], ['D5', 0.5], ['B4', 0.5], ['E5', 2.0],
]

// -------------------------------------------------------------
// 2. THE SAILOR'S HORNPIPE / RAKE HORNPIPE (Complete Traditional Song)
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

  // --- Chorus ---
  ['G5', 3.0], ['G5', 1.5], ['F#5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 2.0], ['A4', 1.0], ['A4', 1.5], ['G#4', 0.5], ['A4', 1.0],
  ['B4', 2.0], ['G#4', 1.0], ['E4', 2.0], ['REST', 1.0],

  ['G5', 3.0], ['G5', 1.5], ['F#5', 0.5], ['E5', 1.0],
  ['D5', 2.0], ['B4', 1.0], ['G4', 1.5], ['A4', 0.5], ['B4', 1.0],
  ['C5', 1.5], ['B4', 0.5], ['A4', 1.0], ['G#4', 1.5], ['F#4', 0.5], ['G#4', 1.0],
  ['A4', 4.0], ['REST', 1.0],
]

// -------------------------------------------------------------
// 4. TETRIS THEME (Korobeiniki - Full Russian Folk Song)
// Arranged for Soprano Recorder at 140 BPM
// -------------------------------------------------------------
const TETRIS_BPM = 140

const TETRIS_SEQUENCE: [string, number][] = [
  // --- Part A ---
  ['E5', 1.0], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0], ['C5', 0.5], ['B4', 0.5],
  ['A4', 1.0], ['A4', 0.5], ['C5', 0.5], ['E5', 1.0], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.5], ['C5', 0.5], ['D5', 1.0], ['E5', 1.0],
  ['C5', 1.0], ['A4', 1.0], ['A4', 2.0],

  ['D5', 1.5], ['F5', 0.5], ['A5', 1.0], ['G5', 0.5], ['F5', 0.5],
  ['E5', 1.5], ['C5', 0.5], ['E5', 1.0], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.0], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0], ['E5', 1.0],
  ['C5', 1.0], ['A4', 1.0], ['A4', 2.0],

  // --- Part B (Bass drop & repeat) ---
  ['E5', 1.0], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0], ['C5', 0.5], ['B4', 0.5],
  ['A4', 1.0], ['A4', 0.5], ['C5', 0.5], ['E5', 1.0], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.5], ['C5', 0.5], ['D5', 1.0], ['E5', 1.0],
  ['C5', 1.0], ['A4', 1.0], ['A4', 2.0],

  ['D5', 1.5], ['F5', 0.5], ['A5', 1.0], ['G5', 0.5], ['F5', 0.5],
  ['E5', 1.5], ['C5', 0.5], ['E5', 1.0], ['D5', 0.5], ['C5', 0.5],
  ['B4', 1.0], ['B4', 0.5], ['C5', 0.5], ['D5', 1.0], ['E5', 1.0],
  ['C5', 1.0], ['A4', 1.0], ['A4', 2.0],

  // --- Part C (Coda / Accelerando finish) ---
  ['E4', 2.0], ['C4', 2.0], ['D4', 2.0], ['B3', 2.0],
  ['C4', 2.0], ['A3', 2.0], ['G#3', 2.0], ['B3', 2.0],
  ['E4', 2.0], ['C4', 2.0], ['D4', 2.0], ['B3', 2.0],
  ['C4', 1.0], ['E4', 1.0], ['A4', 2.0], ['A4', 2.0],
]

// -------------------------------------------------------------
// 5. BEETHOVEN - ODE TO JOY (Complete Theme)
// -------------------------------------------------------------
const ODE_TO_JOY_TEMPO = 120

const ODE_TO_JOY_SEQUENCE: [string, number][] = [
  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['B4', 1.5], ['A4', 0.5], ['A4', 2.0],

  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['A4', 1.5], ['G4', 0.5], ['G4', 2.0],

  ['A4', 1.0], ['A4', 1.0], ['B4', 1.0], ['G4', 1.0],
  ['A4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 1.0], ['G4', 1.0],
  ['A4', 1.0], ['B4', 0.5], ['C5', 0.5], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['A4', 1.0], ['D4', 2.0],

  ['B4', 1.0], ['B4', 1.0], ['C5', 1.0], ['D5', 1.0],
  ['D5', 1.0], ['C5', 1.0], ['B4', 1.0], ['A4', 1.0],
  ['G4', 1.0], ['G4', 1.0], ['A4', 1.0], ['B4', 1.0],
  ['A4', 1.5], ['G4', 0.5], ['G4', 3.0],
]

// -------------------------------------------------------------
// 6. A BREEZE FROM HOME (Epic Battle Fantasy 5 - Phyrnna)
// Complete Soprano Recorder Arrangement in D Major (92 BPM)
// -------------------------------------------------------------
const BREEZE_BPM = 92

const BREEZE_SEQUENCE: [string, number][] = [
  // Intro theme
  ['D5', 2.0], ['A4', 2.0], ['F#4', 1.0], ['G4', 1.0], ['A4', 2.0],
  ['B4', 2.0], ['C#5', 2.0], ['D5', 4.0],
  ['E5', 2.0], ['C#5', 2.0], ['A4', 1.0], ['B4', 1.0], ['C#5', 2.0],
  ['D5', 2.0], ['E5', 2.0], ['F#5', 4.0],

  // Theme A
  ['F#5', 2.0], ['E5', 1.0], ['D5', 1.0], ['E5', 2.0], ['A4', 2.0],
  ['F#5', 2.0], ['G5', 1.0], ['A5', 1.0], ['B5', 4.0],
  ['A5', 2.0], ['G5', 1.0], ['F#5', 1.0], ['E5', 2.0], ['D5', 2.0],
  ['C#5', 2.0], ['D5', 1.0], ['E5', 1.0], ['D5', 4.0],

  // Measure 81 (From the user's MuseScore score!)
  ['A5', 2.5], ['B5', 0.5], ['A5', 0.5], ['F#5', 0.5], ['E5', 4.0],
  ['D5', 2.0], ['E5', 2.0], ['F#5', 4.0],
  ['A5', 2.5], ['B5', 0.5], ['A5', 0.5], ['F#5', 0.5], ['E5', 4.0],
  ['D5', 2.0], ['F#5', 2.0], ['E5', 4.0],

  // Resolution
  ['D5', 4.0], ['A4', 4.0], ['D5', 4.0],
]

export const PRESET_SONGS: SongMetadata[] = [
  {
    id: 'breeze-from-home',
    title: 'A Breeze From Home',
    subtitle: 'Epic Battle Fantasy 5 • Phyrnna (Score 7833518)',
    artist: 'Phyrnna / Arr. poseidis',
    category: 'Gaming & Pop',
    tempo: BREEZE_BPM,
    bannerCta: 'Epic Battle Fantasy 5 Soundtrack',
    speedLabel: '92 BPM',
    bottomTitle: 'A BREEZE FROM HOME',
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'greentea',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(BREEZE_SEQUENCE, BREEZE_BPM),
  },
  {
    id: 'bad-apple',
    title: 'Bad Apple!!',
    subtitle: 'Alstroemeria Records feat. nomico (Official 138 BPM)',
    artist: 'ZUN / Masayoshi Minoshima',
    category: 'Touhou & Anime',
    tempo: BAD_APPLE_BPM,
    bannerCta: 'Learn with Recorder Rhythm Game',
    speedLabel: '138 BPM',
    bottomTitle: 'BAD APPLE!!',
    bottomSubtitle: 'Recorder Tutorial',
    silhouettePreset: 'reimu',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(BAD_APPLE_SEQUENCE, BAD_APPLE_BPM),
  },
  {
    id: 'tetris',
    title: 'Tetris Theme (Korobeiniki)',
    subtitle: 'Famous Russian Folk Dance',
    artist: 'Nikolay Nekrasov / Hirokazu Tanaka',
    category: 'Gaming & Pop',
    tempo: TETRIS_BPM,
    bannerCta: 'Rhythm Game Classic',
    speedLabel: '140 BPM',
    bottomTitle: 'TETRIS THEME',
    bottomSubtitle: 'Korobeiniki',
    silhouettePreset: 'tetris',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(TETRIS_SEQUENCE, TETRIS_BPM),
  },
  {
    id: 'sailors-hornpipe',
    title: "The Sailor's Hornpipe",
    subtitle: 'The Rake Hornpipe • Complete Song',
    artist: 'Traditional Hornpipe Dance',
    category: 'Folk & Sea Shanty',
    tempo: HORNPIPE_TEMPO,
    bannerCta: 'Traditional Sea Shanty Classics',
    speedLabel: '116 BPM',
    bottomTitle: "THE SAILOR'S HORNPIPE",
    bottomSubtitle: 'Rake Hornpipe',
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
    speedLabel: '96 BPM',
    bottomTitle: 'GREENSLEEVES',
    bottomSubtitle: '16th Century Ballad',
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
    speedLabel: '120 BPM',
    bottomTitle: 'ODE TO JOY',
    bottomSubtitle: 'Beethoven',
    silhouettePreset: 'beethoven',
    fingeringSystem: 'baroque',
    notes: createNotesFromSequence(ODE_TO_JOY_SEQUENCE, ODE_TO_JOY_TEMPO),
  },
]
