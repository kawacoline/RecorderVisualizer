/**
 * Recorder Studio - Modern Soprano Flute Visualizer & Rhythm Game
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Music2,
  Video,
  BookOpen,
  Upload,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileAudio,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Trash2,
} from 'lucide-react'
import type { SongMetadata } from './types/music'
import { PRESET_SONGS } from './lib/songsLibrary'
import {
  loadSongsFromDb,
  saveSongToDb,
  deleteSongFromDb,
  restorePresetSongsInDb,
} from './lib/songDatabase'
import { RecorderVisualizer } from './components/RecorderVisualizer'
import { UploadPartitureModal } from './components/UploadPartitureModal'
import { FingeringGuideModal } from './components/FingeringGuideModal'
import { SongCatalogModal } from './components/SongCatalogModal'
import { audioEngine } from './lib/audioEngine'
import { videoRecorder } from './lib/videoRecorder'

export function App() {
  const [songs, setSongs] = useState<SongMetadata[]>(PRESET_SONGS)
  const [currentSong, setCurrentSong] = useState<SongMetadata | null>(PRESET_SONGS[0])
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0) // 1.0x standard tempo default
  const [fingeringSystem, setFingeringSystem] = useState<'baroque' | 'german'>('baroque')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)
  const [isFingeringGuideOpen, setIsFingeringGuideOpen] = useState<boolean>(false)
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false)
  const [songToDelete, setSongToDelete] = useState<SongMetadata | null>(null)
  const [selectedRibbonCategory, setSelectedRibbonCategory] = useState<string>('all')
  const [volume, setVolume] = useState<number>(0.8)
  const [isMuted, setIsMuted] = useState<boolean>(false)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  // A-B Looper & Backing Audio
  const [loopA, setLoopA] = useState<number | null>(null)
  const [loopB, setLoopB] = useState<number | null>(null)
  const [backingAudioUrl, setBackingAudioUrl] = useState<string | null>(null)
  const backingAudioRef = useRef<HTMLAudioElement | null>(null)
  const backingFileInputRef = useRef<HTMLInputElement | null>(null)
  const songScrollRef = useRef<HTMLDivElement | null>(null)

  const playedNoteIdsRef = useRef<Set<string>>(new Set())
  const lastFrameTimeRef = useRef<number | null>(null)

  // Load songs from IndexedDB on startup
  useEffect(() => {
    let isMounted = true
    loadSongsFromDb().then((loaded) => {
      if (!isMounted) return
      if (loaded.length > 0) {
        setSongs(loaded)
        setCurrentSong((prev) => {
          if (!prev) return loaded[0]
          const match = loaded.find((s) => s.id === prev.id)
          return match || loaded[0]
        })
      } else {
        setSongs([])
        setCurrentSong(null)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Calculate song duration
  const lastNote = currentSong?.notes ? currentSong.notes[currentSong.notes.length - 1] : undefined
  const songDuration = lastNote ? lastNote.startTime + lastNote.duration + 1.0 : 10

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = null
      if (backingAudioRef.current) {
        backingAudioRef.current.pause()
      }
      return
    }

    let animId: number
    lastFrameTimeRef.current = performance.now()

    if (backingAudioRef.current) {
      backingAudioRef.current.playbackRate = playbackRate
      backingAudioRef.current.play().catch(() => {})
    }

    const tick = (now: number) => {
      if (lastFrameTimeRef.current !== null) {
        const rawDelta = (now - lastFrameTimeRef.current) / 1000
        // Strictly prevent negative delta (moving in reverse) and limit max step to 0.1s
        const deltaSeconds = Math.min(0.1, Math.max(0, rawDelta)) * playbackRate

        setCurrentTime((prev) => {
          const next = prev + deltaSeconds

          // A-B Loop boundary check
          if (loopB !== null && next >= loopB) {
            const loopTarget = loopA !== null ? loopA : 0
            if (backingAudioRef.current) {
              backingAudioRef.current.currentTime = loopTarget
            }
            return loopTarget
          }

          if (next >= songDuration) {
            setIsPlaying(false)
            if (backingAudioRef.current) {
              backingAudioRef.current.pause()
            }
            return songDuration
          }
          return next
        })
      }
      lastFrameTimeRef.current = now
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(animId)
      lastFrameTimeRef.current = null
    }
  }, [isPlaying, playbackRate, songDuration, loopA, loopB])

  // Trigger audio note synthesis
  useEffect(() => {
    if (!isPlaying || !currentSong) return

    currentSong.notes.forEach((note) => {
      if (
        currentTime >= note.startTime &&
        currentTime < note.startTime + note.duration &&
        !playedNoteIdsRef.current.has(note.id)
      ) {
        playedNoteIdsRef.current.add(note.id)
        const synthDuration = note.duration / playbackRate
        audioEngine.playNote(note.midi, synthDuration)
      }
    })
  }, [currentTime, isPlaying, currentSong, playbackRate])

  const handlePlayPause = () => {
    if (!currentSong) return
    if (currentTime >= songDuration) {
      setCurrentTime(0)
      playedNoteIdsRef.current.clear()
    }
    lastFrameTimeRef.current = performance.now()
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (time: number) => {
    setCurrentTime(time)
    audioEngine.stopAll()
    if (backingAudioRef.current) {
      backingAudioRef.current.currentTime = time
    }
    lastFrameTimeRef.current = performance.now()
    if (currentSong) {
      playedNoteIdsRef.current.forEach((id) => {
        const note = currentSong.notes.find((n) => n.id === id)
        if (note && note.startTime > time) {
          playedNoteIdsRef.current.delete(id)
        }
      })
    }
  }

  const handleRestart = () => {
    audioEngine.stopAll()
    const restartTime = loopA !== null ? loopA : 0
    setCurrentTime(restartTime)
    if (backingAudioRef.current) {
      backingAudioRef.current.currentTime = restartTime
    }
    playedNoteIdsRef.current.clear()
    lastFrameTimeRef.current = null
    setIsPlaying(false)
  }

  const handleBackingAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setBackingAudioUrl(url)
    }
  }

  const handleSongChange = (newSong: SongMetadata) => {
    audioEngine.stopAll()
    saveSongToDb(newSong)
    setSongs((prev) => {
      if (prev.some((s) => s.id === newSong.id)) {
        return prev.map((s) => (s.id === newSong.id ? newSong : s))
      }
      return [newSong, ...prev]
    })
    setCurrentSong(newSong)
    setCurrentTime(0)
    playedNoteIdsRef.current.clear()
    lastFrameTimeRef.current = null
    setIsPlaying(false)
    if (backingAudioRef.current) {
      backingAudioRef.current.pause()
      backingAudioRef.current.currentTime = 0
    }
  }

  const handleDeleteSong = async (songId: string) => {
    await deleteSongFromDb(songId)
    setSongs((prev) => {
      const updated = prev.filter((s) => s.id !== songId)
      if (currentSong?.id === songId) {
        if (updated.length > 0) {
          handleSongChange(updated[0])
        } else {
          setCurrentSong(null)
          setIsPlaying(false)
          audioEngine.stopAll()
        }
      }
      return updated
    })
  }

  const handleRestoreDefaults = async () => {
    const restored = await restorePresetSongsInDb()
    setSongs(restored)
    if (restored.length > 0) {
      handleSongChange(restored[0])
    }
  }

  const filteredRibbonSongs = useMemo(() => {
    if (selectedRibbonCategory === 'all') return songs
    return songs.filter((s) => s.category === selectedRibbonCategory)
  }, [songs, selectedRibbonCategory])

  const scrollSongs = (direction: 'left' | 'right') => {
    if (songScrollRef.current) {
      const offset = direction === 'left' ? -280 : 280
      songScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const handleSongRibbonWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && songScrollRef.current) {
      songScrollRef.current.scrollLeft += e.deltaY
    }
  }

  const handleToggleMute = () => {
    const next = !isMuted
    setIsMuted(next)
    audioEngine.setMuted(next)
  }

  const handleVolumeChange = (v: number) => {
    setVolume(v)
    audioEngine.setVolume(v)
    if (isMuted && v > 0) {
      setIsMuted(false)
      audioEngine.setMuted(false)
    }
  }

  const handleExportVideo = async () => {
    const canvas = document.getElementById('recorder-visualizer-canvas') as HTMLCanvasElement
    if (!canvas || !currentSong) {
      return
    }

    setIsExporting(true)
    handleRestart()

    const audioDest = audioEngine.getAudioStreamDestination()
    videoRecorder.startRecording(canvas, audioDest)

    if (!isPlaying) {
      handlePlayPause()
    }

    const checkInterval = setInterval(async () => {
      const remaining = songDuration - currentTime
      if (remaining <= 0.2 || !videoRecorder.recording) {
        clearInterval(checkInterval)
        const safeTitle = currentSong ? currentSong.title : 'recorder-song'
        await videoRecorder.stopRecording(`${safeTitle.toLowerCase().replace(/\s+/g, '-')}-recorder-tutorial.webm`)
        setIsExporting(false)
      }
    }, 500)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
              <Music2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              RECORDER STUDIO
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Visualizer
              </span>
            </h1>
            <p className="text-xs text-slate-400">Interactive Partiture & Finger Training</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFingeringGuideOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Fingering Chart
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Partiture
          </button>

          <a
            href="https://github.com/kawacoline/RecorderVisualizer"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="GitHub Repository"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 flex flex-col gap-6">
        {/* Responsive Song Selector Console */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md space-y-2.5 shadow-xl">
          {/* Top Row: Categories & All Songs Modal Button */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Music2 className="w-3.5 h-3.5 text-cyan-400" />
                Canciones:
              </span>
              {[
                { key: 'all', label: 'Todas' },
                { key: 'Gaming & Pop', label: '🎮 EBF & Juegos' },
                { key: 'Touhou & Anime', label: '🌸 Bad Apple' },
                { key: 'Folk & Sea Shanty', label: '⚓ Folk & Marinera' },
                { key: 'Classical', label: '🎻 Clásica' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedRibbonCategory(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    selectedRibbonCategory === cat.key
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Catalog & Upload shortcut */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCatalogModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Abrir catálogo con buscador y todas las canciones"
              >
                <ListMusic className="w-4 h-4 text-cyan-400" />
                <span>Ver Catálogo Completo ({songs.length})</span>
              </button>
            </div>
          </div>

          {/* Carousel Row with Scroll Buttons */}
          <div className="relative flex items-center gap-2">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollSongs('left')}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition flex-shrink-0 border border-slate-700 shadow-md cursor-pointer"
              title="Desplazar a la izquierda"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable Song List Container */}
            <div
              ref={songScrollRef}
              onWheel={handleSongRibbonWheel}
              className="flex-1 flex items-center gap-2.5 overflow-x-auto py-1.5 px-1 scroll-smooth"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#06b6d4 #1e293b',
              }}
            >
              {filteredRibbonSongs.length === 0 ? (
                <div className="py-2 px-3 text-xs text-slate-400 italic flex items-center gap-2">
                  <span>No hay canciones en esta categoría.</span>
                  <button
                    onClick={handleRestoreDefaults}
                    className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                  >
                    Restablecer Predeterminadas
                  </button>
                </div>
              ) : (
                filteredRibbonSongs.map((song) => {
                  const isSelected = currentSong?.id === song.id
                  return (
                    <div
                      key={song.id}
                      className={`group/btn px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 flex-shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 ring-2 ring-cyan-400'
                          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => handleSongChange(song)}
                        className="cursor-pointer text-left flex items-center gap-2"
                      >
                        <span className="font-semibold">{song.title}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            isSelected
                              ? 'bg-black/20 text-slate-950 font-bold'
                              : 'bg-slate-950 text-cyan-400 border border-slate-800'
                          }`}
                        >
                          {song.tempo} BPM
                        </span>
                      </button>

                      {/* Quick Delete Icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSongToDelete(song)
                        }}
                        className={`p-1 rounded-md transition cursor-pointer ${
                          isSelected
                            ? 'hover:bg-black/20 text-slate-950/70 hover:text-red-900'
                            : 'opacity-40 group-hover/btn:opacity-100 hover:bg-red-500/20 text-slate-500 hover:text-red-400'
                        }`}
                        title={`Eliminar "${song.title}" de la base de datos`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Scroll Right Button */}
            <button
              onClick={() => scrollSongs('right')}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition flex-shrink-0 border border-slate-700 shadow-md cursor-pointer"
              title="Desplazar a la derecha (ver más canciones)"
              aria-label="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Display */}
        {!currentSong ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <Music2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white">Tu biblioteca está vacía</h2>
            <p className="text-sm text-slate-400">
              Has eliminado todas las canciones de tu base de datos local. Puedes restaurar las 7 canciones predeterminadas o subir una partitura nueva.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestoreDefaults}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Restablecer Canciones Predeterminadas
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Subir Partitura
              </button>
            </div>
          </div>
        ) : (
          /* Unified Soprano Recorder Visualizer */
          <RecorderVisualizer
            song={currentSong}
            currentTime={currentTime}
            isPlaying={isPlaying}
            playbackRate={playbackRate}
            fingeringSystem={fingeringSystem}
            onSeek={handleSeek}
          />
        )}

        {/* Bottom Playback & Rhythm Control Console */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-xl shadow-2xl space-y-3">
          {/* Progress Timeline Slider */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span className="font-semibold text-slate-300">
                {currentSong ? `${currentSong.title} (${currentSong.notes.length} notes)` : 'Sin canción'}
              </span>
              <span>{formatTime(songDuration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1, songDuration)}
              step={0.05}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Transport Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {/* Play / Restart */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Restart Song"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handlePlayPause}
                className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black transition shadow-lg shadow-cyan-400/25 flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>

              {/* Tempo / Speed selector */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { r: 0.5, label: '0.5x Slow' },
                  { r: 0.75, label: '0.75x' },
                  { r: 1.0, label: '1.0x Real' },
                  { r: 1.25, label: '1.25x' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => setPlaybackRate(item.r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      playbackRate === item.r
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* A-B Loop Practice & Audio Backing */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setLoopA(currentTime)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    loopA !== null ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Marcar inicio de bucle A"
                >
                  Loop A {loopA !== null ? `(${formatTime(loopA)})` : ''}
                </button>
                <button
                  onClick={() => setLoopB(currentTime)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    loopB !== null ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Marcar fin de bucle B"
                >
                  Loop B {loopB !== null ? `(${formatTime(loopB)})` : ''}
                </button>
                {(loopA !== null || loopB !== null) && (
                  <button
                    onClick={() => {
                      setLoopA(null)
                      setLoopB(null)
                    }}
                    className="px-2 py-1 text-slate-500 hover:text-red-400 transition"
                    title="Borrar bucle de práctica"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Backing Track audio upload */}
              <input
                type="file"
                ref={backingFileInputRef}
                accept="audio/*"
                onChange={handleBackingAudioUpload}
                className="hidden"
              />
              <button
                onClick={() => backingFileInputRef.current?.click()}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 cursor-pointer ${
                  backingAudioUrl
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800'
                }`}
                title="Cargar pista de audio MP3 de acompañamiento"
              >
                <FileAudio className="w-3.5 h-3.5 text-cyan-400" />
                <span>{backingAudioUrl ? 'Pista MP3 Activa' : '+ Audio MP3'}</span>
              </button>
            </div>

            {/* Fingering system & Audio */}
            <div className="flex items-center gap-3">
              {/* Fingering System Toggle */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setFingeringSystem('baroque')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    fingeringSystem === 'baroque'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Baroque/English fingering"
                >
                  Baroque
                </button>
                <button
                  onClick={() => setFingeringSystem('german')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    fingeringSystem === 'german'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="German fingering"
                >
                  German
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-800">
                <button onClick={handleToggleMute} className="text-slate-400 hover:text-white">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-16 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Video Export button */}
              <button
                onClick={handleExportVideo}
                disabled={isExporting}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                title="Grabar y descargar video WebM del visualizador"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Grabando...' : 'Exportar Video'}</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Partiture Modal */}
      <UploadPartitureModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSongLoaded={handleSongChange}
        currentFingeringSystem={fingeringSystem}
      />

      {/* Fingering Guide Modal */}
      <FingeringGuideModal
        isOpen={isFingeringGuideOpen}
        onClose={() => setIsFingeringGuideOpen(false)}
        system={fingeringSystem}
      />

      {/* Song Catalog Explorer Modal */}
      <SongCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        songs={songs}
        currentSongId={currentSong?.id || ''}
        onSelectSong={handleSongChange}
        onDeleteSong={handleDeleteSong}
        onRestoreDefaults={handleRestoreDefaults}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
      />

      {/* Delete Confirmation Dialog for Ribbon trigger */}
      {songToDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar canción de la BD?</h3>
                <p className="text-xs text-slate-400">Esta acción removerá la canción de tu biblioteca local.</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <p className="text-sm font-bold text-white">{songToDelete.title}</p>
              <p className="text-xs text-slate-400">{songToDelete.subtitle} • {songToDelete.artist}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {songToDelete.notes.length} notas • {songToDelete.tempo} BPM • {songToDelete.category}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSongToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDeleteSong(songToDelete.id)
                  setSongToDelete(null)
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar de la BD</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Backing Track Audio Element */}
      {backingAudioUrl && (
        <audio ref={backingAudioRef} src={backingAudioUrl} />
      )}
    </div>
  )
}
export default App
