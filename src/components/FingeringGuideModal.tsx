import React, { useState } from 'react'
import { X, Volume2, BookOpen } from 'lucide-react'
import { BAROQUE_FINGERINGS, GERMAN_FINGERINGS } from '../lib/recorderFingering'
import { audioEngine } from '../lib/audioEngine'

interface Props {
  isOpen: boolean
  onClose: () => void
  system: 'baroque' | 'german'
}

export const FingeringGuideModal: React.FC<Props> = ({ isOpen, onClose, system }) => {
  const [selectedMidi, setSelectedMidi] = useState<number>(64) // E4 default

  if (!isOpen) return null

  const dictionary = system === 'german' ? GERMAN_FINGERINGS : BAROQUE_FINGERINGS
  const notesList = Object.keys(dictionary)
    .map(Number)
    .sort((a, b) => a - b)

  const activeFingering = dictionary[selectedMidi] || dictionary[64]

  const playNote = (midi: number) => {
    setSelectedMidi(midi)
    audioEngine.playNote(midi, 0.8)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Soprano Recorder Fingering Chart</h2>
              <p className="text-xs text-slate-400">
                Click any note to hear it and view the exact hole positions ({system === 'baroque' ? 'Baroque' : 'German'} System)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Note Selector Keyboard / Pill Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-2">Chromatic Note Range (C4 - D6)</label>
            <div className="flex flex-wrap gap-1.5">
              {notesList.map((midi) => {
                const info = dictionary[midi]
                const isSelected = selectedMidi === midi
                return (
                  <button
                    key={midi}
                    onClick={() => playNote(midi)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex flex-col items-center min-w-[50px] ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-105'
                        : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span>{info.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                      {info.solfege}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Note Inspection Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
            {/* Note Details */}
            <div className="space-y-4 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-cyan-300">{activeFingering.name}</span>
                  <span className="text-xs font-bold text-slate-400">{activeFingering.solfege}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {activeFingering.name} ({activeFingering.solfege})
                  </h3>
                  <p className="text-xs text-slate-400">MIDI Pitch: {selectedMidi} • Octave: {activeFingering.octave}</p>
                </div>
              </div>

              <button
                onClick={() => playNote(selectedMidi)}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <Volume2 className="w-4 h-4" />
                Play Note Audio
              </button>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Thumb Hole (Back):</span>
                  <span className="font-bold text-amber-400">
                    {activeFingering.holes[0] === 1 ? 'Covered' : activeFingering.holes[0] === 0.5 ? 'Half / Pinched' : 'Open'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Left Hand (Front 1-2-3):</span>
                  <span className="font-bold text-cyan-300">
                    {[1, 2, 3].map((h) => (activeFingering.holes[h] ? `● ${h}` : `○ ${h}`)).join('  ')}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Right Hand (Front 4-5-6-7):</span>
                  <span className="font-bold text-emerald-300">
                    {[4, 5, 6, 7].map((h) => (activeFingering.holes[h] ? `● ${h}` : `○ ${h}`)).join('  ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Flute Rendering for this note */}
            <div className="flex flex-col items-center justify-center bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <svg viewBox="0 0 140 380" className="w-32 h-64">
                {/* Tube */}
                <rect x="55" y="20" width="30" height="340" rx="6" fill="#ded5be" stroke="#574f3e" strokeWidth="2" />
                {/* Thumb Hole on Left */}
                <g>
                  <circle
                    cx="30"
                    cy="80"
                    r="10"
                    fill={activeFingering.holes[0] > 0 ? '#f59e0b' : '#1e1c18'}
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {activeFingering.holes[0] === 0.5 && (
                    <path d="M 30 70 A 10 10 0 0 1 30 90 Z" fill="#1e1c18" />
                  )}
                  <text x="30" y="84" fontSize="9" fontWeight="bold" fill="#ffffff" textAnchor="middle">T</text>
                </g>

                {/* Front Holes 1 to 7 */}
                {[
                  { id: 1, y: 80, r: 8, color: '#00e5ff' },
                  { id: 2, y: 110, r: 8, color: '#00e5ff' },
                  { id: 3, y: 140, r: 8, color: '#00e5ff' },
                  { id: 4, y: 185, r: 8, color: '#10b981' },
                  { id: 5, y: 215, r: 8, color: '#10b981' },
                  { id: 6, y: 250, r: 5, isDouble: true, color: '#10b981' },
                  { id: 7, y: 290, r: 5, isDouble: true, color: '#10b981' },
                ].map((hole) => {
                  const state = activeFingering.holes[hole.id]
                  if (hole.isDouble) {
                    return (
                      <g key={hole.id}>
                        <circle
                          cx="64"
                          cy={hole.y}
                          r={hole.r}
                          fill={state > 0 ? hole.color : '#1e1c18'}
                          stroke={hole.color}
                          strokeWidth="1.5"
                        />
                        <circle
                          cx="76"
                          cy={hole.y}
                          r={hole.r}
                          fill={state > 0 ? hole.color : '#1e1c18'}
                          stroke={hole.color}
                          strokeWidth="1.5"
                        />
                      </g>
                    )
                  }
                  return (
                    <circle
                      key={hole.id}
                      cx="70"
                      cy={hole.y}
                      r={hole.r}
                      fill={state > 0 ? hole.color : '#1e1c18'}
                      stroke={hole.color}
                      strokeWidth="2"
                    />
                  )
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  )
}
