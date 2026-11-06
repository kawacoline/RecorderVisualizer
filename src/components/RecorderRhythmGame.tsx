import React, { useEffect, useRef, useState } from 'react'
import {
  Hand,
  ArrowRight,
  ArrowDown,
  Info,
  Flame,
} from 'lucide-react'
import type { NoteEvent, SongMetadata } from '../types/music'

interface Props {
  song: SongMetadata
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  fingeringSystem: 'baroque' | 'german'
  onSeek: (time: number) => void
  onNoteHit?: (note: NoteEvent) => void
}

// Finger metadata for the 8 recorder holes
const FINGER_LANES = [
  { id: 0, label: 'T', name: 'Thumb', hand: 'Left Hand (Back)', key: 'Space', color: '#f59e0b', ringColor: 'ring-amber-500' },
  { id: 1, label: '1', name: 'Index', hand: 'Left Hand (Front)', key: 'A', color: '#00e5ff', ringColor: 'ring-cyan-400' },
  { id: 2, label: '2', name: 'Middle', hand: 'Left Hand (Front)', key: 'S', color: '#00e5ff', ringColor: 'ring-cyan-400' },
  { id: 3, label: '3', name: 'Ring', hand: 'Left Hand (Front)', key: 'D', color: '#00e5ff', ringColor: 'ring-cyan-400' },
  { id: 4, label: '4', name: 'Index', hand: 'Right Hand (Front)', key: 'J', color: '#10b981', ringColor: 'ring-emerald-400' },
  { id: 5, label: '5', name: 'Middle', hand: 'Right Hand (Front)', key: 'K', color: '#10b981', ringColor: 'ring-emerald-400' },
  { id: 6, label: '6', name: 'Ring (Double)', hand: 'Right Hand (Front)', key: 'L', color: '#10b981', ringColor: 'ring-emerald-400' },
  { id: 7, label: '7', name: 'Pinky (Double)', hand: 'Right Hand (Front)', key: ';', color: '#10b981', ringColor: 'ring-emerald-400' },
]

export const RecorderRhythmGame: React.FC<Props> = ({
  song,
  currentTime,
  playbackRate,
  onNoteHit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [flowDirection, setFlowDirection] = useState<'horizontal' | 'vertical'>('horizontal')
  const [combo, setCombo] = useState<number>(0)
  const [lastJudgement, setLastJudgement] = useState<string>('READY')
  const [userHoles, setUserHoles] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const userHolesRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const lastNoteIdRef = useRef<string | null>(null)
  const ripplesRef = useRef<{ lane: number; progress: number; color: string }[]>([])

  const currentTimeRef = useRef(currentTime)
  currentTimeRef.current = currentTime

  const songRef = useRef(song)
  songRef.current = song

  const playbackRateRef = useRef(playbackRate)
  playbackRateRef.current = playbackRate

  const flowDirectionRef = useRef(flowDirection)
  flowDirectionRef.current = flowDirection

  // Keyboard input listeners for practicing fingerings
  useEffect(() => {
    const keyMap: Record<string, number> = {
      ' ': 0,
      q: 0,
      Q: 0,
      a: 1,
      A: 1,
      s: 2,
      S: 2,
      d: 3,
      D: 3,
      j: 4,
      J: 4,
      k: 5,
      K: 5,
      l: 6,
      L: 6,
      ';': 7,
      p: 7,
      P: 7,
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const lane = keyMap[e.key]
      if (lane !== undefined) {
        userHolesRef.current[lane] = 1
        setUserHoles([...userHolesRef.current])
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const lane = keyMap[e.key]
      if (lane !== undefined) {
        userHolesRef.current[lane] = 0
        setUserHoles([...userHolesRef.current])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Find currently active note
  const currentNote = song.notes.find(
    (n) => currentTime >= n.startTime && currentTime < n.startTime + n.duration
  )

  // Find upcoming notes for preview
  const upcomingNotes = song.notes
    .filter((n) => n.startTime > currentTime)
    .slice(0, 4)

  useEffect(() => {
    if (currentNote && currentNote.id !== lastNoteIdRef.current) {
      lastNoteIdRef.current = currentNote.id
      onNoteHit?.(currentNote)
      setCombo((prev) => prev + 1)
      setLastJudgement('PERFECT!')

      // Trigger burst on active lanes
      currentNote.holes.forEach((h, laneIdx) => {
        if (h > 0) {
          ripplesRef.current.push({
            lane: laneIdx,
            progress: 0,
            color: FINGER_LANES[laneIdx].color,
          })
        }
      })
    }
  }, [currentNote, onNoteHit])

  // Canvas render loop for the rhythm game tracks
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const render = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const width = rect.width
      const height = rect.height

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
      }

      ctx.save()
      ctx.scale(dpr, dpr)

      // Background
      ctx.fillStyle = '#0b0d13'
      ctx.fillRect(0, 0, width, height)

      const numLanes = 8
      const isHorizontal = flowDirectionRef.current === 'horizontal'
      const speed = 400 * playbackRateRef.current // pixels per second
      const time = currentTimeRef.current
      const currentSong = songRef.current
      const curNote = currentSong.notes.find(
        (n) => time >= n.startTime && time < n.startTime + n.duration
      )

      if (isHorizontal) {
        // HORIZONTAL RHYTHM LANES (Notes flow right to left into hit line)
        const laneHeight = height / numLanes
        const hitX = 140 // Position of the judgment line

        // Draw Lane Backgrounds & Dividers
        for (let i = 0; i < numLanes; i++) {
          const laneY = i * laneHeight
          const isThumb = i === 0
          const isLeftHand = i >= 1 && i <= 3

          // Lane background shading
          ctx.fillStyle = isThumb
            ? 'rgba(245, 158, 11, 0.04)'
            : isLeftHand
              ? 'rgba(0, 229, 255, 0.03)'
              : 'rgba(16, 185, 129, 0.03)'
          ctx.fillRect(0, laneY, width, laneHeight)

          // Lane divider
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(0, laneY)
          ctx.lineTo(width, laneY)
          ctx.stroke()

          // Lane track guideline
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)'
          ctx.beginPath()
          ctx.moveTo(hitX, laneY + laneHeight / 2)
          ctx.lineTo(width, laneY + laneHeight / 2)
          ctx.stroke()
        }

        // Draw Hit Zone / Judgment Line
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(hitX, 0)
        ctx.lineTo(hitX, height)
        ctx.stroke()

        // Glowing receptor pads at hit line
        for (let i = 0; i < numLanes; i++) {
          const centerY = i * laneHeight + laneHeight / 2
          const isActive = curNote ? curNote.holes[i] > 0 : false
          const isUserPressing = userHolesRef.current[i] > 0
          const laneMeta = FINGER_LANES[i]

          ctx.save()
          if (isActive || isUserPressing) {
            ctx.fillStyle = laneMeta.color
            ctx.shadowColor = laneMeta.color
            ctx.shadowBlur = isUserPressing ? 22 : 16
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
          }
          ctx.beginPath()
          ctx.arc(hitX, centerY, isUserPressing ? 16 : 14, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = isUserPressing ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = isUserPressing ? 3.5 : 2
          ctx.stroke()
          ctx.restore()
        }
        ctx.restore()

        // Countdown prompt if first note has not arrived yet
        const firstNote = currentSong.notes[0]
        if (firstNote && firstNote.startTime > time) {
          const remainingTime = Math.max(0, firstNote.startTime - time).toFixed(1)
          ctx.save()
          ctx.fillStyle = '#06b6d4'
          ctx.shadowColor = 'rgba(6, 182, 212, 0.6)'
          ctx.shadowBlur = 8
          ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`PRIMERA NOTA EN: ${remainingTime}s`, width / 2, 28)
          ctx.restore()
        }

        // Draw Scrolling Note Blocks
        const visibleWindow = Math.max(4.0, (width - hitX) / speed)
        const activeAndUpcoming = currentSong.notes.filter(
          (n) => n.startTime + n.duration >= time - 0.2 && n.startTime <= time + visibleWindow + 0.5
        )

        activeAndUpcoming.forEach((note) => {
          const timeOffset = note.startTime - time
          const blockX = hitX + timeOffset * speed
          const blockWidth = Math.max(16, note.duration * speed - 4)

          note.holes.forEach((holeState, laneIdx) => {
            if (holeState === 0) return
            const laneY = laneIdx * laneHeight
            const blockH = laneHeight * 0.65
            const blockY = laneY + (laneHeight - blockH) / 2
            const laneMeta = FINGER_LANES[laneIdx]

            ctx.save()
            // Active block body
            ctx.fillStyle = laneMeta.color
            ctx.shadowColor = laneMeta.color
            ctx.shadowBlur = 12

            const radius = 8
            ctx.beginPath()
            ctx.roundRect(blockX, blockY, blockWidth, blockH, radius)
            ctx.fill()

            // If half-hole / pinched thumb
            if (holeState === 0.5) {
              ctx.fillStyle = '#0b0d13'
              ctx.fillRect(blockX, blockY, blockWidth / 2, blockH)
              ctx.strokeStyle = '#ffffff'
              ctx.strokeRect(blockX, blockY, blockWidth, blockH)
            }

            // Note pitch label inside block if wide enough
            if (blockWidth > 40 && laneIdx === 0) {
              ctx.fillStyle = '#000000'
              ctx.font = 'bold 12px sans-serif'
              ctx.textAlign = 'center'
              ctx.textBaseline = 'middle'
              ctx.fillText(note.letter, blockX + blockWidth / 2, blockY + blockH / 2)
            }
            ctx.restore()
          })
        })

        // Draw impact ripples
        ripplesRef.current.forEach((r, idx) => {
          const laneY = r.lane * laneHeight + laneHeight / 2
          ctx.save()
          ctx.strokeStyle = r.color
          ctx.lineWidth = 3
          ctx.globalAlpha = Math.max(0, 1 - r.progress)
          ctx.beginPath()
          ctx.arc(hitX, laneY, 14 + r.progress * 30, 0, Math.PI * 2)
          ctx.stroke()
          ctx.restore()

          r.progress += 0.06
          if (r.progress >= 1) {
            ripplesRef.current.splice(idx, 1)
          }
        })
      } else {
        // VERTICAL RHYTHM LANES (Notes fall from top to bottom)
        const laneWidth = width / numLanes
        const hitY = height - 90

        // Draw Lane Backgrounds & Dividers
        for (let i = 0; i < numLanes; i++) {
          const laneX = i * laneWidth
          const isThumb = i === 0
          const isLeftHand = i >= 1 && i <= 3

          ctx.fillStyle = isThumb
            ? 'rgba(245, 158, 11, 0.04)'
            : isLeftHand
              ? 'rgba(0, 229, 255, 0.03)'
              : 'rgba(16, 185, 129, 0.03)'
          ctx.fillRect(laneX, 0, laneWidth, height)

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(laneX, 0)
          ctx.lineTo(laneX, height)
          ctx.stroke()
        }

        // Hit line
        ctx.save()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(0, hitY)
        ctx.lineTo(width, hitY)
        ctx.stroke()

        // Receptor pads
        for (let i = 0; i < numLanes; i++) {
          const centerX = i * laneWidth + laneWidth / 2
          const isActive = curNote ? curNote.holes[i] > 0 : false
          const isUserPressing = userHolesRef.current[i] > 0
          const laneMeta = FINGER_LANES[i]

          ctx.save()
          if (isActive || isUserPressing) {
            ctx.fillStyle = laneMeta.color
            ctx.shadowColor = laneMeta.color
            ctx.shadowBlur = isUserPressing ? 22 : 16
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
          }
          ctx.beginPath()
          ctx.arc(centerX, hitY, isUserPressing ? 16 : 14, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = isUserPressing ? '#ffffff' : 'rgba(255, 255, 255, 0.5)'
          ctx.lineWidth = isUserPressing ? 3.5 : 2
          ctx.stroke()
          ctx.restore()
        }
        ctx.restore()

        // Countdown prompt if first note has not arrived yet
        const firstNote = currentSong.notes[0]
        if (firstNote && firstNote.startTime > time) {
          const remainingTime = Math.max(0, firstNote.startTime - time).toFixed(1)
          ctx.save()
          ctx.fillStyle = '#06b6d4'
          ctx.shadowColor = 'rgba(6, 182, 212, 0.6)'
          ctx.shadowBlur = 8
          ctx.font = 'bold 15px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`PRIMERA NOTA EN: ${remainingTime}s`, width / 2, 28)
          ctx.restore()
        }

        // Falling note blocks
        const visibleWindow = Math.max(4.0, hitY / speed)
        const activeAndUpcoming = currentSong.notes.filter(
          (n) => n.startTime + n.duration >= time - 0.2 && n.startTime <= time + visibleWindow + 0.5
        )

        activeAndUpcoming.forEach((note) => {
          const timeOffset = note.startTime - time
          const blockHeight = Math.max(16, note.duration * speed - 4)
          const blockY = hitY - timeOffset * speed - blockHeight

          note.holes.forEach((holeState, laneIdx) => {
            if (holeState === 0) return
            const laneX = laneIdx * laneWidth
            const blockW = laneWidth * 0.7
            const blockX = laneX + (laneWidth - blockW) / 2
            const laneMeta = FINGER_LANES[laneIdx]

            ctx.save()
            ctx.fillStyle = laneMeta.color
            ctx.shadowColor = laneMeta.color
            ctx.shadowBlur = 12
            const radius = 8
            ctx.beginPath()
            ctx.roundRect(blockX, blockY, blockW, blockHeight, radius)
            ctx.fill()
            ctx.restore()
          })
        })
      }

      ctx.restore()
      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Top Rhythm Game HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
        {/* Active Note Big Card */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-slate-800 to-cyan-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10">
            <span className="text-3xl font-black text-white tracking-wider">
              {currentNote ? currentNote.letter : '—'}
            </span>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest mt-0.5">
              {currentNote ? currentNote.solfege : 'Rest'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {song.title}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {song.tempo} BPM
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-base font-extrabold text-white">
                {combo} <span className="text-xs font-medium text-slate-400">Streak</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {lastJudgement}
              </span>
            </div>
          </div>
        </div>

        {/* Upcoming Notes Queue */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold mr-1 flex items-center gap-1">
            Next <ArrowRight className="w-3.5 h-3.5" />
          </span>
          {upcomingNotes.map((note, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
            >
              <span className="text-sm font-bold">{note.letter}</span>
              <span className="text-[10px] text-slate-400">{note.solfege}</span>
            </div>
          ))}
        </div>

        {/* Flow Direction & Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFlowDirection('horizontal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${flowDirection === 'horizontal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <ArrowRight className="w-3.5 h-3.5" />
              Horizontal Flow
            </button>
            <button
              onClick={() => setFlowDirection('vertical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${flowDirection === 'vertical'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <ArrowDown className="w-3.5 h-3.5" />
              Vertical Flow
            </button>
          </div>
        </div>
      </div>

      {/* Main Game Stage: Lane Headers + Rhythm Canvas + Interactive Flute */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 8 Finger Lanes & Canvas (9 Columns) */}
        <div className="lg:col-span-9 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {/* Lane Labels Bar (for horizontal flow) */}
          {flowDirection === 'horizontal' ? (
            <div className="flex flex-row w-full h-[540px]">
              {/* Lane Headers on the Left */}
              <div className="w-36 flex flex-col justify-around bg-slate-900/90 border-r border-slate-800 py-1 px-2 flex-shrink-0 select-none">
                {FINGER_LANES.map((lane) => {
                  const isActive = currentNote ? currentNote.holes[lane.id] > 0 : false
                  const isThumb = lane.id === 0
                  return (
                    <div
                      key={lane.id}
                      className={`flex items-center justify-between px-2 py-1 rounded-lg transition-all ${isActive
                          ? 'bg-slate-800 border border-slate-700 shadow-sm'
                          : 'opacity-80'
                        }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black"
                          style={{
                            backgroundColor: isActive ? lane.color : 'rgba(255,255,255,0.1)',
                            color: isActive ? '#000000' : '#ffffff',
                          }}
                        >
                          {lane.label}
                        </span>
                        <div className="flex flex-col">
                          <span className={`text-[11px] font-bold ${isThumb ? 'text-amber-400' : 'text-slate-200'}`}>
                            {lane.name}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {lane.id <= 3 ? 'Left' : 'Right'}
                          </span>
                        </div>
                      </div>

                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {lane.key}
                      </kbd>
                    </div>
                  )
                })}
              </div>

              {/* Canvas Playfield */}
              <div ref={containerRef} className="flex-1 h-full relative">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>
          ) : (
            /* Vertical Flow */
            <div className="w-full h-[540px] relative flex flex-col">
              <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900/90 py-2 px-2 text-center select-none">
                {FINGER_LANES.map((lane) => (
                  <div key={lane.id} className="flex flex-col items-center">
                    <span
                      className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-black mb-1"
                      style={{ backgroundColor: lane.color, color: '#000000' }}
                    >
                      {lane.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{lane.name}</span>
                    <kbd className="text-[9px] font-mono text-slate-400">{lane.key}</kbd>
                  </div>
                ))}
              </div>
              <div className="flex-1 w-full relative">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Anatomical Soprano Flute Diagram & Hands Guide (3 Columns) */}
        <div className="lg:col-span-3 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hand className="w-4 h-4 text-cyan-400" />
              Recorder Fingering Guide
            </h3>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Live Flute
            </span>
          </div>

          {/* Interactive Soprano Recorder SVG */}
          <div className="flex justify-center items-center py-2 bg-slate-950/70 rounded-xl border border-slate-800/80 p-4">
            <svg viewBox="0 0 160 420" className="w-40 h-80 drop-shadow-2xl">
              {/* Flute Body */}
              <defs>
                <linearGradient id="woodGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d1c4a5" />
                  <stop offset="35%" stopColor="#f5ecd5" />
                  <stop offset="70%" stopColor="#ede1c4" />
                  <stop offset="100%" stopColor="#b8aa8b" />
                </linearGradient>
                <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00e5ff" />
                </filter>
                <filter id="amberGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" />
                </filter>
                <filter id="emeraldGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#10b981" />
                </filter>
              </defs>

              {/* Headjoint / Mouthpiece */}
              <path
                d="M 68 20 C 65 20 60 35 60 55 L 100 55 C 100 35 95 20 92 20 Z"
                fill="url(#woodGradient)"
                stroke="#4a4436"
                strokeWidth="2"
              />
              {/* Labium Window */}
              <rect x="72" y="44" width="16" height="8" rx="2" fill="#2d281f" stroke="#4a4436" />

              {/* Main Tube */}
              <path
                d="M 60 55 L 62 370 C 62 385 54 395 52 400 L 108 400 C 106 395 98 385 98 370 L 100 55 Z"
                fill="url(#woodGradient)"
                stroke="#4a4436"
                strokeWidth="2"
              />

              {/* Decorative Rings */}
              <rect x="59" y="55" width="42" height="4" fill="#a89a7d" />
              <rect x="61" y="100" width="38" height="4" fill="#a89a7d" />
              <rect x="61" y="370" width="38" height="4" fill="#a89a7d" />

              {/* Script C logo */}
              <text x="80" y="90" fontSize="18" fontStyle="italic" fontWeight="bold" fill="#0099b8" textAnchor="middle">
                c
              </text>

              {/* ----------------- HOLE 0: THUMB (BACK HOLE) ----------------- */}
              {/* Distinct Thumb Hole to the left with connecting bracket */}
              <g>
                <path d="M 40 120 L 61 120" stroke="#78716c" strokeWidth="2" strokeDasharray="3 2" />
                <circle
                  cx="35"
                  cy="120"
                  r="12"
                  fill={
                    (currentNote && currentNote.holes[0] > 0) || userHoles[0] > 0
                      ? '#f59e0b'
                      : '#1c1917'
                  }
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  filter={(currentNote && currentNote.holes[0] > 0) || userHoles[0] > 0 ? 'url(#amberGlow)' : undefined}
                />
                {/* Pinched thumb half indicator */}
                {currentNote && currentNote.holes[0] === 0.5 && (
                  <path d="M 35 108 A 12 12 0 0 1 35 132 Z" fill="#1c1917" />
                )}
                <text x="35" y="124" fontSize="10" fontWeight="bold" fill="#ffffff" textAnchor="middle">
                  T
                </text>
                <text x="35" y="145" fontSize="9" fontWeight="bold" fill="#f59e0b" textAnchor="middle">
                  {currentNote?.holes[0] === 0.5 ? '½ PINCH' : 'THUMB'}
                </text>
              </g>

              {/* ----------------- HOLES 1-3: LEFT HAND ----------------- */}
              {/* Hole 1 */}
              <circle
                cx="80"
                cy="120"
                r="8.5"
                fill={(currentNote && currentNote.holes[1] > 0) || userHoles[1] > 0 ? '#00e5ff' : '#1c1917'}
                stroke="#00e5ff"
                strokeWidth="2"
                filter={(currentNote && currentNote.holes[1] > 0) || userHoles[1] > 0 ? 'url(#cyanGlow)' : undefined}
              />
              <text x="80" y="123" fontSize="8" fontWeight="bold" fill={(currentNote?.holes[1] || userHoles[1]) ? '#000' : '#fff'} textAnchor="middle">1</text>

              {/* Hole 2 */}
              <circle
                cx="80"
                cy="150"
                r="8.5"
                fill={(currentNote && currentNote.holes[2] > 0) || userHoles[2] > 0 ? '#00e5ff' : '#1c1917'}
                stroke="#00e5ff"
                strokeWidth="2"
                filter={(currentNote && currentNote.holes[2] > 0) || userHoles[2] > 0 ? 'url(#cyanGlow)' : undefined}
              />
              <text x="80" y="153" fontSize="8" fontWeight="bold" fill={(currentNote?.holes[2] || userHoles[2]) ? '#000' : '#fff'} textAnchor="middle">2</text>

              {/* Hole 3 */}
              <circle
                cx="80"
                cy="180"
                r="8.5"
                fill={(currentNote && currentNote.holes[3] > 0) || userHoles[3] > 0 ? '#00e5ff' : '#1c1917'}
                stroke="#00e5ff"
                strokeWidth="2"
                filter={(currentNote && currentNote.holes[3] > 0) || userHoles[3] > 0 ? 'url(#cyanGlow)' : undefined}
              />
              <text x="80" y="183" fontSize="8" fontWeight="bold" fill={(currentNote?.holes[3] || userHoles[3]) ? '#000' : '#fff'} textAnchor="middle">3</text>

              {/* Hand Separator Bracket */}
              <text x="115" y="152" fontSize="9" fill="#00e5ff" fontWeight="bold">
                Left Hand
              </text>

              {/* ----------------- HOLES 4-7: RIGHT HAND ----------------- */}
              {/* Hole 4 */}
              <circle
                cx="80"
                cy="225"
                r="8.5"
                fill={(currentNote && currentNote.holes[4] > 0) || userHoles[4] > 0 ? '#10b981' : '#1c1917'}
                stroke="#10b981"
                strokeWidth="2"
                filter={(currentNote && currentNote.holes[4] > 0) || userHoles[4] > 0 ? 'url(#emeraldGlow)' : undefined}
              />
              <text x="80" y="228" fontSize="8" fontWeight="bold" fill={(currentNote?.holes[4] || userHoles[4]) ? '#000' : '#fff'} textAnchor="middle">4</text>

              {/* Hole 5 */}
              <circle
                cx="80"
                cy="255"
                r="8.5"
                fill={(currentNote && currentNote.holes[5] > 0) || userHoles[5] > 0 ? '#10b981' : '#1c1917'}
                stroke="#10b981"
                strokeWidth="2"
                filter={(currentNote && currentNote.holes[5] > 0) || userHoles[5] > 0 ? 'url(#emeraldGlow)' : undefined}
              />
              <text x="80" y="258" fontSize="8" fontWeight="bold" fill={(currentNote?.holes[5] || userHoles[5]) ? '#000' : '#fff'} textAnchor="middle">5</text>

              {/* Hole 6 (Double Hole) */}
              <g>
                <circle
                  cx="74"
                  cy="290"
                  r="5"
                  fill={(currentNote && currentNote.holes[6] > 0) || userHoles[6] > 0 ? '#10b981' : '#1c1917'}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <circle
                  cx="86"
                  cy="290"
                  r="5"
                  fill={(currentNote && currentNote.holes[6] > 0) || userHoles[6] > 0 ? '#10b981' : '#1c1917'}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <text x="80" y="304" fontSize="7" fill="#10b981" textAnchor="middle">6 (double)</text>
              </g>

              {/* Hole 7 (Double Hole) */}
              <g>
                <circle
                  cx="74"
                  cy="330"
                  r="5"
                  fill={currentNote && currentNote.holes[7] > 0 ? '#10b981' : '#1c1917'}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <circle
                  cx="86"
                  cy="330"
                  r="5"
                  fill={currentNote && currentNote.holes[7] > 0 ? '#10b981' : '#1c1917'}
                  stroke="#10b981"
                  strokeWidth="1.5"
                />
                <text x="80" y="344" fontSize="7" fill="#10b981" textAnchor="middle">7 (double)</text>
              </g>

              <text x="115" y="285" fontSize="9" fill="#10b981" fontWeight="bold">
                Right Hand
              </text>
            </svg>
          </div>

          {/* Quick Practice Tip */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-cyan-400">
              <Info className="w-3.5 h-3.5" />
              <span>Finger Coordination</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong className="text-amber-400">Thumb (T)</strong> is on the <strong className="text-white">back</strong> of the flute.
              Holes 1, 2, 3 are for your <strong className="text-cyan-300">Left Hand</strong>, and 4, 5, 6, 7 are for your <strong className="text-emerald-300">Right Hand</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
