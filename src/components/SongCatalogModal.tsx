import React, { useState, useMemo } from 'react'
import {
  Search,
  X,
  Play,
  Upload,
  Sparkles,
  Music2,
  Clock,
  Gauge,
  CheckCircle,
} from 'lucide-react'
import type { SongMetadata } from '../types/music'

interface Props {
  isOpen: boolean
  onClose: () => void
  songs: SongMetadata[]
  currentSongId: string
  onSelectSong: (song: SongMetadata) => void
  onOpenUploadModal: () => void
}

type CategoryFilter = 'all' | 'Gaming & Pop' | 'Touhou & Anime' | 'Folk & Sea Shanty' | 'Classical' | 'Custom'

export const SongCatalogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  songs,
  currentSongId,
  onSelectSong,
  onOpenUploadModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all')

  const categories: { key: CategoryFilter; label: string; count: number }[] = useMemo(() => {
    return [
      { key: 'all', label: 'Todas las Canciones', count: songs.length },
      { key: 'Gaming & Pop', label: '🎮 Videojuegos (EBF & Más)', count: songs.filter((s) => s.category === 'Gaming & Pop').length },
      { key: 'Touhou & Anime', label: '🌸 Anime & Touhou', count: songs.filter((s) => s.category === 'Touhou & Anime').length },
      { key: 'Folk & Sea Shanty', label: '⚓ Folk & Tradicional', count: songs.filter((s) => s.category === 'Folk & Sea Shanty').length },
      { key: 'Classical', label: '🎻 Clásica', count: songs.filter((s) => s.category === 'Classical').length },
      { key: 'Custom', label: '📁 Partituras Subidas', count: songs.filter((s) => s.category === 'Custom').length },
    ]
  }, [songs])

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesCategory = selectedCategory === 'all' || song.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesSearch =
        song.title.toLowerCase().includes(query) ||
        song.subtitle.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.tempo.toString().includes(query)

      return matchesCategory && matchesSearch
    })
  }, [songs, selectedCategory, searchQuery])

  if (!isOpen) return null

  const formatDuration = (notes: SongMetadata['notes']) => {
    if (notes.length === 0) return '0:00'
    const last = notes[notes.length - 1]
    const totalSecs = Math.round(last.startTime + last.duration)
    const mins = Math.floor(totalSecs / 60)
    const secs = totalSecs % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getPitchRange = (notes: SongMetadata['notes']) => {
    if (notes.length === 0) return 'N/A'
    const midiValues = notes.map((n) => n.midi)
    const minMidi = Math.min(...midiValues)
    const maxMidi = Math.max(...midiValues)
    const minNote = notes.find((n) => n.midi === minMidi)?.pitch || 'C4'
    const maxNote = notes.find((n) => n.midi === maxMidi)?.pitch || 'D6'
    return `${minNote} – ${maxNote}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Music2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                Catálogo de Canciones para Flauta
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {songs.length} disponibles
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecciona una canción completa para practicar con digitaciones reales o sube la tuya.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="p-4 md:px-6 bg-slate-900/90 border-b border-slate-800 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título (Bad Apple, Journey to the East...), compositor o BPM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  selectedCategory === cat.key
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.key ? 'bg-black/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Songs Grid Container */}
        <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-3">
          {filteredSongs.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <Music2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 font-medium">No se encontraron canciones con ese criterio.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredSongs.map((song) => {
                const isSelected = song.id === currentSongId
                const noteRange = getPitchRange(song.notes)
                const duration = formatDuration(song.notes)

                return (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song)
                      onClose()
                    }}
                    className={`group relative p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/50">
                          {song.category}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-cyan-400 font-bold flex items-center gap-1 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/40">
                            <Gauge className="w-3 h-3" />
                            {song.tempo} BPM
                          </span>
                          {isSelected && (
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                              <CheckCircle className="w-3 h-3" />
                              Activa
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Artist */}
                      <h3 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition leading-snug">
                        {song.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {song.subtitle} • {song.artist}
                      </p>
                    </div>

                    {/* Stats & Play Button */}
                    <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {duration}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {song.notes.length} notas
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                          Rango: {noteRange}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectSong(song)
                          onClose()
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-200 group-hover:bg-cyan-500 group-hover:text-slate-950'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isSelected ? 'Jugando' : 'Seleccionar'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:px-6 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>¿Tienes tu propia partitura? Súbela en MusicXML, MIDI o código ABC</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                onOpenUploadModal()
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              Subir Nueva Partitura
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
