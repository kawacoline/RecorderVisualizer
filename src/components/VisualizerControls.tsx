import React, { useState } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Upload,
  Video,
  Smartphone,
  Monitor,
  Music,
} from 'lucide-react'
import type { AspectRatio, SongMetadata } from '../types/music'
import { PRESET_SONGS } from '../lib/songsLibrary'
import { videoRecorder } from '../lib/videoRecorder'
import { audioEngine } from '../lib/audioEngine'

interface Props {
  currentSong: SongMetadata
  currentTime: number
  duration: number
  isPlaying: boolean
  playbackRate: number
  aspectRatio: AspectRatio
  fingeringSystem: 'baroque' | 'german'
  onPlayPause: () => void
  onSeek: (time: number) => void
  onRestart: () => void
  onPlaybackRateChange: (rate: number) => void
  onAspectRatioChange: (ratio: AspectRatio) => void
  onFingeringSystemChange: (system: 'baroque' | 'german') => void
  onSongChange: (song: SongMetadata) => void
  onOpenUploadModal: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const VisualizerControls: React.FC<Props> = ({
  currentSong,
  currentTime,
  duration,
  isPlaying,
  playbackRate,
  aspectRatio,
  fingeringSystem,
  onPlayPause,
  onSeek,
  onRestart,
  onPlaybackRateChange,
  onAspectRatioChange,
  onFingeringSystemChange,
  onSongChange,
  onOpenUploadModal,
}) => {
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [isExporting, setIsExporting] = useState(false)

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
    if (!canvas) return

    setIsExporting(true)
    onRestart()

    const audioDest = audioEngine.getAudioStreamDestination()
    videoRecorder.startRecording(canvas, audioDest)

    if (!isPlaying) {
      onPlayPause()
    }

    // Check when song reaches end to stop recording
    const checkInterval = setInterval(async () => {
      const remaining = duration - currentTime
      if (remaining <= 0.2 || !videoRecorder.recording) {
        clearInterval(checkInterval)
        await videoRecorder.stopRecording(`${currentSong.title.toLowerCase().replace(/\s+/g, '-')}-recorder-tutorial.webm`)
        setIsExporting(false)
      }
    }, 500)
  }

  const handleStopExportEarly = async () => {
    if (videoRecorder.recording) {
      await videoRecorder.stopRecording(`${currentSong.title.toLowerCase().replace(/\s+/g, '-')}-recorder-tutorial.webm`)
      setIsExporting(false)
    }
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-xl shadow-2xl space-y-4">
      {/* Top Bar: Song Selection & Main Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">{currentSong.title}</h3>
            <p className="text-xs text-slate-400">{currentSong.subtitle} • {currentSong.notes.length} notes</p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={currentSong.id}
            onChange={(e) => {
              const selected = PRESET_SONGS.find((s) => s.id === e.target.value)
              if (selected) onSongChange(selected)
            }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-400"
          >
            <optgroup label="Preset Songs (Complete Arrangements)">
              {PRESET_SONGS.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} ({song.category})
                </option>
              ))}
            </optgroup>
            {currentSong.category === 'Custom' && (
              <option value={currentSong.id}>Custom: {currentSong.title}</option>
            )}
          </select>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition"
          >
            <Upload className="w-4 h-4" />
            Upload Partiture
          </button>

          {isExporting ? (
            <button
              onClick={handleStopExportEarly}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-400 text-white transition animate-pulse"
            >
              <Video className="w-4 h-4" />
              Recording Video... (Click to Finish)
            </button>
          ) : (
            <button
              onClick={handleExportVideo}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20"
            >
              <Video className="w-4 h-4" />
              Export Video (9:16)
            </button>
          )}
        </div>
      </div>

      {/* Center: Playback Progress Slider */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={0.05}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Bottom Controls Grid */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {/* Play / Pause / Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRestart}
            title="Restart from beginning"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPause}
            className="p-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold transition shadow-lg shadow-cyan-400/25 flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { rate: 0.5, label: '0.5x Slowed' },
            { rate: 0.75, label: '0.75x' },
            { rate: 1.0, label: '1.0x Normal' },
            { rate: 1.25, label: '1.25x' },
          ].map((item) => (
            <button
              key={item.rate}
              onClick={() => onPlaybackRateChange(item.rate)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                playbackRate === item.rate
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Aspect Ratio & Fingering Settings */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onAspectRatioChange('9:16')}
              title="9:16 Vertical for TikTok / Reels / Shorts"
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                aspectRatio === '9:16'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              9:16 Shorts
            </button>

            <button
              onClick={() => onAspectRatioChange('16:9')}
              title="16:9 Landscape for YouTube"
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                aspectRatio === '16:9'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              16:9
            </button>
          </div>

          {/* Fingering System */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onFingeringSystemChange('baroque')}
              title="Baroque / English fingering (Universal standard)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                fingeringSystem === 'baroque'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Baroque
            </button>
            <button
              onClick={() => onFingeringSystemChange('german')}
              title="German fingering (Simplified 4th hole)"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                fingeringSystem === 'german'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              German
            </button>
          </div>

          {/* Audio Volume */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 px-3 rounded-xl border border-slate-800">
            <button
              onClick={handleToggleMute}
              className="text-slate-400 hover:text-white transition"
            >
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
        </div>
      </div>
    </div>
  )
}
