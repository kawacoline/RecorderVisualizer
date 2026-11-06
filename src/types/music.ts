export type HoleState = 0 | 1 | 0.5 // 0 = open, 1 = closed, 0.5 = half/pinched

export interface Fingering {
  // [Thumb(0), H1, H2, H3, H4, H5, H6, H7]
  holes: [HoleState, HoleState, HoleState, HoleState, HoleState, HoleState, HoleState, HoleState]
  name: string
  solfege: string
  octave: number
  isHighOctave?: boolean
}

export interface NoteEvent {
  id: string
  pitch: string // e.g. "E4", "F#4", "G4", "A4", "B4", "C5", "D5", "E5"
  midi: number // MIDI note number (e.g. 64 = E4)
  startTime: number // in seconds
  duration: number // in seconds
  letter: string // e.g. "E", "F#", "G", "A", "B", "E'", "D'"
  solfege: string // e.g. "Mi", "Fa#", "Sol", "La", "Si", "Mi'", "Ré'"
  holes: [HoleState, HoleState, HoleState, HoleState, HoleState, HoleState, HoleState, HoleState]
  measureIndex?: number
  noteIndex?: number
}

export type ThemeColor = 'cyan' | 'emerald' | 'purple' | 'amber' | 'monochrome'

export interface SongMetadata {
  id: string
  title: string
  subtitle: string
  artist: string
  category: 'Touhou & Anime' | 'Folk & Sea Shanty' | 'Classical' | 'Gaming & Pop' | 'Custom'
  tempo: number // BPM
  bannerCta: string // e.g. "Subscribe for daily tutorials"
  speedLabel: string // e.g. '"SLOWED"'
  bottomTitle: string // e.g. "BAD APPLE"
  bottomSubtitle: string // e.g. "Recorder Tutorial"
  channelHandle?: string
  themeColor?: ThemeColor
  silhouettePreset: 'reimu' | 'sailor' | 'greentea' | 'beethoven' | 'tetris' | 'titanic' | 'custom'
  customSilhouetteUrl?: string
  fingeringSystem: 'baroque' | 'german'
  notes: NoteEvent[]
}

export type AspectRatio = '9:16' | '16:9' | 'responsive'

