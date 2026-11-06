import { useState, useEffect, useRef } from 'react'
import { Music2, Sparkles } from 'lucide-react'
import type { AspectRatio, SongMetadata } from './types/music'
import { PRESET_SONGS } from './lib/songsLibrary'
import { RecorderVisualizerCanvas } from './components/RecorderVisualizerCanvas'
import { VisualizerControls } from './components/VisualizerControls'
import { UploadPartitureModal } from './components/UploadPartitureModal'
import { audioEngine } from './lib/audioEngine'

export function App() {
  const [currentSong, setCurrentSong] = useState<SongMetadata>(PRESET_SONGS[0])
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackRate, setPlaybackRate] = useState<number>(0.5) // Default to 0.5x "Slowed Tutorial" like reference video
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [fingeringSystem, setFingeringSystem] = useState<'baroque' | 'german'>('baroque')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)

  const playedNoteIdsRef = useRef<Set<string>>(new Set())
  const lastFrameTimeRef = useRef<number | null>(null)

  // Calculate song duration
  const lastNote = currentSong.notes[currentSong.notes.length - 1]
  const songDuration = lastNote ? lastNote.startTime + lastNote.duration + 1.0 : 10

  // Playback timer loop
  useEffect(() => {
    let animId: number

    const tick = (now: number) => {
      if (lastFrameTimeRef.current !== null && isPlaying) {
        const deltaSeconds = ((now - lastFrameTimeRef.current) / 1000) * playbackRate
        setCurrentTime((prev) => {
          const next = prev + deltaSeconds
          if (next >= songDuration) {
            setIsPlaying(false)
            return songDuration
          }
          return next
        })
      }
      lastFrameTimeRef.current = now
      animId = requestAnimationFrame(tick)
    }

    if (isPlaying) {
      lastFrameTimeRef.current = performance.now()
      animId = requestAnimationFrame(tick)
    } else {
      lastFrameTimeRef.current = null
    }

    return () => cancelAnimationFrame(animId)
  }, [isPlaying, playbackRate, songDuration])

  // Trigger audio note synthesis
  useEffect(() => {
    if (!isPlaying) return

    // Find notes that should play now
    currentSong.notes.forEach((note) => {
      if (
        currentTime >= note.startTime &&
        currentTime < note.startTime + note.duration &&
        !playedNoteIdsRef.current.has(note.id)
      ) {
        playedNoteIdsRef.current.add(note.id)
        // Adjust audio duration according to playback rate
        const synthDuration = note.duration / playbackRate
        audioEngine.playNote(note.midi, synthDuration)
      }
    })
  }, [currentTime, isPlaying, currentSong, playbackRate])

  const handlePlayPause = () => {
    if (currentTime >= songDuration) {
      setCurrentTime(0)
      playedNoteIdsRef.current.clear()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
    audioEngine.stopAll()
    // Reset notes that are ahead of new seek time
    playedNoteIdsRef.current.forEach((id) => {
      const note = currentSong.notes.find((n) => n.id === id)
      if (note && note.startTime > time) {
        playedNoteIdsRef.current.delete(id)
      }
    })
  }

  const handleRestart = () => {
    audioEngine.stopAll()
    setCurrentTime(0)
    playedNoteIdsRef.current.clear()
    setIsPlaying(false)
  }

  const handleSongChange = (newSong: SongMetadata) => {
    audioEngine.stopAll()
    setCurrentSong(newSong)
    setCurrentTime(0)
    playedNoteIdsRef.current.clear()
    setIsPlaying(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Music2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              RECORDER STUDIO
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Visualizer
              </span>
            </h1>
            <p className="text-xs text-slate-400">Upload partitures & generate TikTok/Shorts recorder tutorials</p>
          </div>
        </div>

        {/* Quick presets pills */}
        <div className="hidden md:flex items-center gap-2">
          {PRESET_SONGS.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSongChange(song)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentSong.id === song.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {song.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/kawacoline/RecorderVisualizer"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 items-center justify-center">
        {/* Left/Center: Visualizer Canvas Display */}
        <div className="w-full max-w-md lg:max-w-lg flex flex-col items-center">
          <RecorderVisualizerCanvas
            song={currentSong}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            aspectRatio={aspectRatio}
            fingeringSystem={fingeringSystem}
          />
        </div>

        {/* Right: Controls & Tutorial Info */}
        <div className="w-full lg:max-w-xl flex flex-col space-y-6">
          <VisualizerControls
            currentSong={currentSong}
            currentTime={currentTime}
            duration={songDuration}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            aspectRatio={aspectRatio}
            fingeringSystem={fingeringSystem}
            onPlayPause={handlePlayPause}
            onSeek={handleSeek}
            onRestart={handleRestart}
            onPlaybackRateChange={setPlaybackRate}
            onAspectRatioChange={setAspectRatio}
            onFingeringSystemChange={setFingeringSystem}
            onSongChange={handleSongChange}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
          />

          {/* Quick Info & Tutorial Guide Card */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Soprano Recorder Tutorial Features
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="font-semibold text-slate-200 block">8-Hole Fingering Roll</span>
                <p>Cyan capsules show closed tone holes. White circles show open guide positions.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="font-semibold text-slate-200 block">Dual Notation & Solfège</span>
                <p>Displays both letters (E, F#, G) and Do-Re-Mi Solfège with the animated 3D needle.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="font-semibold text-slate-200 block">Universal Partiture Ingestion</span>
                <p>Drop any MIDI file, MusicXML (.xml/.mxml), or ABC notation file with auto-transposition.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1">
                <span className="font-semibold text-slate-200 block">1-Click Video Export</span>
                <p>Exports high-definition 9:16 vertical video directly formatted for TikTok, Reels & Shorts.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Partiture Upload Modal */}
      <UploadPartitureModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSongLoaded={handleSongChange}
        currentFingeringSystem={fingeringSystem}
      />
    </div>
  )
}
export default App
