import React, { useState } from 'react'
import { FileMusic, Upload, Sparkles, X, Music, AlertCircle } from 'lucide-react'
import { parsePartitureFile, parseAbcNotation } from '../lib/scoreParser'
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

  // Custom song form metadata
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('Recorder Tutorial')
  const [artist, setArtist] = useState('Uploaded Score')
  const [speedLabel, setSpeedLabel] = useState('"SLOWED"')
  const [bannerCta, setBannerCta] = useState('Subscribe for daily tutorials')
  const [silhouettePreset, setSilhouettePreset] = useState<'reimu' | 'sailor' | 'greentea' | 'beethoven' | 'tetris' | 'titanic' | 'custom'>('reimu')
  const [customSilhouetteUrl, setCustomSilhouetteUrl] = useState<string | undefined>(undefined)

  // ABC text editor state
  const [abcText, setAbcText] = useState(`X:1
T:Scarborough Fair
M:3/4
L:1/8
Q:100
K:Dm
D2 | D2 A2 A2 | E3 F D2 | E2 F2 G2 | A4 D2 |
A2 d2 d2 | c3 B A2 | G2 F2 E2 | D4 :|`)

  if (!isOpen) return null

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const parsed = await parsePartitureFile(file, currentFingeringSystem)
      if (parsed.notes.length === 0) {
        throw new Error('No playable notes detected in this file.')
      }

      const song: SongMetadata = {
        id: `upload-${Date.now()}`,
        title: title || parsed.title || file.name.replace(/\.[^/.]+$/, ''),
        subtitle: subtitle || 'Uploaded Partiture',
        artist: artist || parsed.composer || 'Recorder Arrangement',
        category: 'Custom',
        tempo: parsed.tempo,
        bannerCta,
        speedLabel,
        bottomTitle: (title || parsed.title || file.name.replace(/\.[^/.]+$/, '')).toUpperCase(),
        bottomSubtitle: 'Recorder Tutorial',
        silhouettePreset,
        customSilhouetteUrl,
        fingeringSystem: currentFingeringSystem,
        notes: parsed.notes,
      }

      onSongLoaded(song)
      onClose()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to parse partiture file.')
    } finally {
      setIsLoading(false)
    }
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
        speedLabel,
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

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCustomSilhouetteUrl(url)
      setSilhouettePreset('custom')
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
              <h2 className="text-xl font-bold text-white">Upload Recorder Partiture</h2>
              <p className="text-xs text-slate-400">Support for MusicXML, MIDI, and ABC Notation</p>
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
            Upload File (.mid / .xml / .mxml / .abc)
          </button>
          <button
            onClick={() => setActiveTab('abc')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'abc'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Paste ABC Notation / Code
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
                  Drag & drop your partiture file here, or <span className="text-cyan-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Accepts Standard MIDI (.mid), MusicXML (.xml, .mxml), and ABC tune files (.abc)
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">ABC Sheet Music Notation</label>
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
              Video Branding & Styling
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Song Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bad Apple / Sailor's Hornpipe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Subtitle / Artist</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => {
                    setSubtitle(e.target.value)
                    setArtist(e.target.value)
                  }}
                  placeholder="e.g. feat. SEKAI"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Speed Badge (Bottom)</label>
                <input
                  type="text"
                  value={speedLabel}
                  onChange={(e) => setSpeedLabel(e.target.value)}
                  placeholder='"SLOWED" or "TEMPO"'
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Top Banner Call-To-Action</label>
                <input
                  type="text"
                  value={bannerCta}
                  onChange={(e) => setBannerCta(e.target.value)}
                  placeholder="Subscribe for daily tutorials"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Silhouette Selector */}
            <div>
              <label className="text-xs text-slate-400 block mb-2">Silhouette Artwork (Top Right)</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'reimu', label: 'Reimu (Apple)' },
                  { id: 'sailor', label: 'Sailor (Pipe)' },
                  { id: 'greentea', label: 'Maiden (Flute)' },
                  { id: 'beethoven', label: 'Beethoven' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSilhouettePreset(p.id as any)
                      setCustomSilhouetteUrl(undefined)
                    }}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                      silhouettePreset === p.id && !customSilhouetteUrl
                        ? 'border-cyan-400 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                <label className="relative py-2 px-3 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white cursor-pointer text-center flex items-center justify-center">
                  <span>Custom Art</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                  />
                </label>
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
            Cancel
          </button>
          {activeTab === 'abc' && (
            <button
              onClick={handleAbcSubmit}
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              Visualize ABC Score
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
