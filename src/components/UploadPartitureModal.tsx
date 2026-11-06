import React, { useState } from 'react'
import { FileMusic, Upload, Sparkles, X, Music, AlertCircle, CheckCircle2 } from 'lucide-react'
import { parsePartitureFile, parseAbcNotation, type ParsedScore } from '../lib/scoreParser'
import type { SongMetadata } from '../types/music'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSongLoaded: (newSong: SongMetadata) => void
  currentFingeringSystem: 'baroque' | 'german'
}

export const UploadPartitureModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSongLoaded,
  currentFingeringSystem,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'abc'>('file')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Multi-track state
  const [cachedFile, setCachedFile] = useState<File | null>(null)
  const [parsedScore, setParsedScore] = useState<ParsedScore | null>(null)
  const [selectedTrackId, setSelectedTrackId] = useState<string | number | null>(null)

  // Custom song form metadata
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('Recorder Tutorial')
  const [artist, setArtist] = useState('Uploaded Score')
  const [speedLabel, setSpeedLabel] = useState('120 BPM')
  const bannerCta = 'Learn with Recorder Rhythm Game'
  const silhouettePreset = 'reimu'
  const customSilhouetteUrl = undefined

  // ABC text editor state
  const [abcText, setAbcText] = useState(`X:1
T:A Breeze From Home (Theme)
M:4/4
L:1/8
Q:110
K:D
d4 A4 | F2 G2 A4 | B4 c4 | d8 |
e4 c4 | A2 B2 c4 | d4 e4 | f8 :|`)

  if (!isOpen) return null

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    setCachedFile(file)
    try {
      const parsed = await parsePartitureFile(file, currentFingeringSystem)
      if (parsed.notes.length === 0) {
        throw new Error('No playable notes detected in this file.')
      }

      setParsedScore(parsed)
      setSelectedTrackId(parsed.selectedTrackId)
      setTitle(parsed.title || file.name.replace(/\.[^/.]+$/, ''))
      if (parsed.composer) setArtist(parsed.composer)
      setSpeedLabel(`${parsed.tempo} BPM`)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to parse partiture file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrackChange = async (trackId: string | number) => {
    if (!cachedFile) return
    setIsLoading(true)
    setSelectedTrackId(trackId)
    try {
      const parsed = await parsePartitureFile(cachedFile, currentFingeringSystem, trackId)
      setParsedScore(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch instrument track.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmLoad = () => {
    if (!parsedScore) return
    const song: SongMetadata = {
      id: `upload-${Date.now()}`,
      title: title || parsedScore.title,
      subtitle: subtitle || 'Uploaded Partiture',
      artist: artist || parsedScore.composer || 'Recorder Arrangement',
      category: 'Custom',
      tempo: parsedScore.tempo,
      bannerCta,
      speedLabel,
      bottomTitle: (title || parsedScore.title).toUpperCase(),
      bottomSubtitle: 'Recorder Tutorial',
      silhouettePreset,
      customSilhouetteUrl,
      fingeringSystem: currentFingeringSystem,
      notes: parsedScore.notes,
    }

    onSongLoaded(song)
    onClose()
  }

  const handleAbcSubmit = () => {
    setIsLoading(true)
    setError(null)
    try {
      const parsed = parseAbcNotation(abcText, currentFingeringSystem)
      if (parsed.notes.length === 0) {
        throw new Error('Could not parse any notes from ABC notation.')
      }

      const song: SongMetadata = {
        id: `abc-${Date.now()}`,
        title: title || parsed.title,
        subtitle: subtitle || 'ABC Notation Score',
        artist: artist || 'Traditional',
        category: 'Custom',
        tempo: parsed.tempo,
        bannerCta,
        speedLabel: `${parsed.tempo} BPM`,
        bottomTitle: (title || parsed.title).toUpperCase(),
        bottomSubtitle: 'Recorder Tutorial',
        silhouettePreset,
        customSilhouetteUrl,
        fingeringSystem: currentFingeringSystem,
        notes: parsed.notes,
      }

      onSongLoaded(song)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error parsing ABC code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <FileMusic className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Subir Partitura para Flauta Dulce</h2>
              <p className="text-xs text-slate-400">Archivos MusicXML (.mxml / .xml), MIDI (.mid), y notación ABC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'file'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Subir Archivo (.mxml / .xml / .mid / .abc)
          </button>
          <button
            onClick={() => setActiveTab('abc')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'abc'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Pegar Código ABC / Texto
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'file' ? (
            <div className="space-y-4">
              {!parsedScore ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition cursor-pointer text-center ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="hidden"
                    accept=".mid,.midi,.xml,.musicxml,.mxml,.abc"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                  <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <p className="text-base font-semibold text-white mb-1">
                      Arrastra y suelta tu partitura aquí, o <span className="text-cyan-400 underline">examinar</span>
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Descarga desde MuseScore como MusicXML (.mxml/.xml) o MIDI (.mid). Detecta automáticamente la voz de la flauta dulce.
                    </p>
                  </label>
                </div>
              ) : (
                /* Multi-Track Instrument Selector Card */
                <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Partitura Cargada: {parsedScore.title}</span>
                    </div>
                    <button
                      onClick={() => {
                        setParsedScore(null)
                        setCachedFile(null)
                      }}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      Subir otro archivo
                    </button>
                  </div>

                  {parsedScore.availableTracks.length > 1 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-300">
                          Selecciona el instrumento a tocar en tu flauta:
                        </label>
                        <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-500/10 px-2 py-0.5 rounded">
                          {parsedScore.availableTracks.length} instrumentos encontrados
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {parsedScore.availableTracks.map((track) => (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => handleTrackChange(track.id)}
                            className={`p-3 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition ${
                              selectedTrackId === track.id
                                ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-2">
                              {track.name}
                              {track.isRecommended && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  Recomendado para Flauta
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {track.noteCount} notas
                            </span>
                          </button>
                        ))}
                      </div>

                      <p className="text-[11px] text-slate-400 italic">
                        💡 Si la partitura tiene piano, bajo y batería, solo extraemos la voz melódica seleccionada para tu flauta dulce.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span>Tempo: <strong className="text-slate-200">{parsedScore.tempo} BPM</strong></span>
                    <span>Notas melódicas: <strong className="text-cyan-400">{parsedScore.notes.length}</strong></span>
                    {parsedScore.needsTransposition && (
                      <span className="text-amber-400 font-semibold">
                        Ajustado automáticamente al rango de la flauta (+{parsedScore.recommendedShift} semitonos)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Notación Musical ABC</label>
              <textarea
                value={abcText}
                onChange={(e) => setAbcText(e.target.value)}
                rows={7}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                placeholder="X:1&#10;T:Song Title&#10;M:4/4&#10;L:1/8&#10;K:C&#10;C D E F G A B c..."
              />
            </div>
          )}

          {/* Metadata Customization */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Detalles de la Canción
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Título de la Canción</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A Breeze From Home"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Subtítulo / Compositor</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => {
                    setSubtitle(e.target.value)
                    setArtist(e.target.value)
                  }}
                  placeholder="e.g. Epic Battle Fantasy 5 • Phyrnna"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-white transition"
          >
            Cancelar
          </button>
          {activeTab === 'file' ? (
            <button
              onClick={handleConfirmLoad}
              disabled={isLoading || !parsedScore}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Cargar en el Juego
            </button>
          ) : (
            <button
              onClick={handleAbcSubmit}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Visualizar Código ABC
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
