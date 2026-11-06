import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Gauge, Palette } from 'lucide-react'
import type { Fingering, NoteEvent, SongMetadata } from '../types/music'
import { getFingering } from '../lib/recorderFingering'
import { VISUALIZER_SKINS } from '../types/skins'

interface Props {
  song: SongMetadata
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  fingeringSystem: 'baroque' | 'german'
  onSeek: (time: number) => void
  onNoteTrigger?: (note: NoteEvent) => void
}

interface Ripple {
  x: number
  y: number
  radius: number
  alpha: number
  color: string
}

const FINGER_KEYS: { id: number; key: string; label: string; name: string }[] = [
  { id: 0, key: 'Space', label: 'T', name: 'Pulgar (Atrás)' },
  { id: 1, key: 'A', label: '1', name: 'Índice Izq' },
  { id: 2, key: 'S', label: '2', name: 'Medio Izq' },
  { id: 3, key: 'D', label: '3', name: 'Anular Izq' },
  { id: 4, key: 'J', label: '4', name: 'Índice Der' },
  { id: 5, key: 'K', label: '5', name: 'Medio Der' },
  { id: 6, key: 'L', label: '6', name: 'Anular Der' },
  { id: 7, key: ';', label: '7', name: 'Meñique Der' },
]

export const RecorderVisualizer: React.FC<Props> = ({
  song,
  currentTime,
  playbackRate,
  fingeringSystem,
  onSeek,
  onNoteTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Customization states
  const [selectedSkinId, setSelectedSkinId] = useState<string>('cyan-capsule')
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.5) // 1.0x to 3.0x
  const [showPitchLabels, setShowPitchLabels] = useState<boolean>(true)
  const [userHoles, setUserHoles] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0])
  const userHolesRef = useRef<number[]>([0, 0, 0, 0, 0, 0, 0, 0])

  const activeSkin = useMemo(() => {
    return VISUALIZER_SKINS.find((s) => s.id === selectedSkinId) || VISUALIZER_SKINS[0]
  }, [selectedSkinId])

  // Real-time animation refs
  const currentTimeRef = useRef(currentTime)
  const songRef = useRef(song)
  const playbackRateRef = useRef(playbackRate)
  const activeSkinRef = useRef(activeSkin)
  const speedMultiplierRef = useRef(speedMultiplier)
  const showLabelsRef = useRef(showPitchLabels)
  const onNoteTriggerRef = useRef(onNoteTrigger)

  useEffect(() => {
    currentTimeRef.current = currentTime
    songRef.current = song
    playbackRateRef.current = playbackRate
    activeSkinRef.current = activeSkin
    speedMultiplierRef.current = speedMultiplier
    showLabelsRef.current = showPitchLabels
    onNoteTriggerRef.current = onNoteTrigger
  }, [currentTime, song, playbackRate, activeSkin, speedMultiplier, showPitchLabels, onNoteTrigger])

  const lastTriggeredNoteId = useRef<string | null>(null)
  const ripplesRef = useRef<Ripple[]>([])

  // Find currently active note
  const currentNote = song.notes.find(
    (n) => currentTime >= n.startTime && currentTime < n.startTime + n.duration
  )

  // Current fingering for active note
  const currentFingering: Fingering = useMemo(() => {
    if (!currentNote) {
      return { holes: [0, 0, 0, 0, 0, 0, 0, 0], name: '--', solfege: '--', octave: 4 }
    }
    return getFingering(currentNote.midi, fingeringSystem)
  }, [currentNote, fingeringSystem])

  // Keyboard input listeners for physical finger practice
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

  // 60FPS High-Performance Visualizer Canvas Render Loop
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

      // Background - Deep modern obsidian stage
      ctx.fillStyle = '#0f1117'
      ctx.fillRect(0, 0, width, height)

      const time = currentTimeRef.current
      const currentSong = songRef.current
      const skin = activeSkinRef.current
      const pRate = playbackRateRef.current
      const scrollSpeed = 260 * speedMultiplierRef.current * pRate // pixels per second

      // Compute geometry
      // The recorder is positioned at ~28% of the width, giving 72% runway for incoming notes
      const fluteX = Math.max(160, Math.min(340, width * 0.28))
      const fluteWidth = 42
      const topPadding = 45
      const bottomPadding = 40
      const usableHeight = height - topPadding - bottomPadding
      const holeSpacing = usableHeight / 8.2

      // Exact Y coordinates for each of the 8 holes
      // Hole 0 (Thumb) is offset on the left to avoid any visual collision with Hole 1
      const holeYPositions = [
        topPadding + holeSpacing * 0.85, // Thumb (0)
        topPadding + holeSpacing * 1.15, // Hole 1 (Left index)
        topPadding + holeSpacing * 2.15, // Hole 2 (Left middle)
        topPadding + holeSpacing * 3.15, // Hole 3 (Left ring)
        topPadding + holeSpacing * 4.35, // Hole 4 (Right index)
        topPadding + holeSpacing * 5.35, // Hole 5 (Right middle)
        topPadding + holeSpacing * 6.45, // Hole 6 (Right ring - double)
        topPadding + holeSpacing * 7.55, // Hole 7 (Right pinky - double)
      ]

      // 1. Draw subtle horizontal note track guidelines
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      for (let i = 0; i < 8; i++) {
        const y = holeYPositions[i]
        const isThumb = i === 0
        const startLineX = isThumb ? fluteX - 42 : fluteX

        ctx.beginPath()
        ctx.moveTo(startLineX, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 2. Draw Hit Line / Reception Boundary
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(fluteX, 20)
      ctx.lineTo(fluteX, height - 20)
      ctx.stroke()
      ctx.setLineDash([])

      // 3. Draw Scrolling Note Blocks (Right to Left towards the Flute)
      const visibleTimeWindow = Math.max(3.8, (width - fluteX) / scrollSpeed)
      const activeAndUpcoming = currentSong.notes.filter(
        (n) => n.startTime + n.duration >= time - 0.2 && n.startTime <= time + visibleTimeWindow + 0.5
      )

      activeAndUpcoming.forEach((note) => {
        const timeOffset = note.startTime - time
        const blockX = fluteX + timeOffset * scrollSpeed
        const blockWidth = Math.max(
          skin.shape === 'circle' ? 24 : 16,
          note.duration * scrollSpeed - 5
        )

        // Draw note shape for each covered hole
        note.holes.forEach((holeState, hIdx) => {
          if (holeState === 0) return // Skip open holes (no white dots!)

          const isThumb = hIdx === 0
          const holeY = holeYPositions[hIdx]
          const blockH = isThumb ? 18 : 20
          const noteColor = isThumb ? skin.thumbColor : skin.primaryColor
          const actualX = isThumb ? blockX - 42 : blockX

          ctx.save()
          ctx.fillStyle = noteColor
          ctx.shadowColor = skin.glowColor
          ctx.shadowBlur = 12

          if (skin.shape === 'capsule') {
            const radius = blockH / 2
            ctx.beginPath()
            ctx.roundRect(actualX, holeY - blockH / 2, blockWidth, blockH, radius)
            ctx.fill()
          } else if (skin.shape === 'rectangle') {
            ctx.beginPath()
            ctx.roundRect(actualX, holeY - blockH / 2, blockWidth, blockH, 3)
            ctx.fill()
          } else {
            // Circle skin
            const radius = 10
            ctx.beginPath()
            ctx.arc(actualX + 12, holeY, radius, 0, Math.PI * 2)
            ctx.fill()
          }

          // Pinched / Half hole indicator
          if (holeState === 0.5) {
            ctx.fillStyle = '#0b0d13'
            ctx.fillRect(actualX, holeY - blockH / 2, blockWidth / 2, blockH)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5
            ctx.strokeRect(actualX, holeY - blockH / 2, blockWidth, blockH)
          }

          // Note Pitch Text Label inside block
          if (showLabelsRef.current && hIdx === 1 && blockWidth > 38) {
            ctx.fillStyle = '#000000'
            ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(note.letter, actualX + blockWidth / 2, holeY)
          }

          ctx.restore()
        })
      })

      // 4. Draw Animated Impact Ripples when notes hit the flute
      ripplesRef.current.forEach((r, idx) => {
        ctx.save()
        ctx.strokeStyle = r.color
        ctx.lineWidth = 3
        ctx.globalAlpha = Math.max(0, r.alpha)
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        r.radius += 1.8
        r.alpha -= 0.04
        if (r.alpha <= 0) {
          ripplesRef.current.splice(idx, 1)
        }
      })

      // 5. Draw the Center Soprano Flute (Instrument Body & Holes)
      const fluteTop = topPadding - 25
      const fluteBottom = height - bottomPadding + 20

      // Flute wood/ivory gradient body
      const fluteGrad = ctx.createLinearGradient(fluteX - fluteWidth / 2, 0, fluteX + fluteWidth / 2, 0)
      fluteGrad.addColorStop(0, '#c7ba9d')
      fluteGrad.addColorStop(0.25, '#f5ecd6')
      fluteGrad.addColorStop(0.75, '#ede1c4')
      fluteGrad.addColorStop(1, '#b0a284')

      ctx.save()
      ctx.fillStyle = fluteGrad
      ctx.strokeStyle = '#433c2f'
      ctx.lineWidth = 2

      // Main flute cylinder
      ctx.beginPath()
      ctx.roundRect(fluteX - fluteWidth / 2, fluteTop + 35, fluteWidth, fluteBottom - fluteTop - 35, 8)
      ctx.fill()
      ctx.stroke()

      // Mouthpiece / Beak at top
      ctx.beginPath()
      ctx.moveTo(fluteX - fluteWidth * 0.42, fluteTop + 35)
      ctx.bezierCurveTo(fluteX - fluteWidth * 0.46, fluteTop + 14, fluteX - fluteWidth * 0.28, fluteTop, fluteX - fluteWidth * 0.2, fluteTop)
      ctx.lineTo(fluteX + fluteWidth * 0.2, fluteTop)
      ctx.bezierCurveTo(fluteX + fluteWidth * 0.28, fluteTop, fluteX + fluteWidth * 0.46, fluteTop + 14, fluteX + fluteWidth * 0.42, fluteTop + 35)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Labium / Sound window
      ctx.fillStyle = '#29241b'
      ctx.beginPath()
      ctx.arc(fluteX, fluteTop + 28, 9, 0, Math.PI, true)
      ctx.fill()
      ctx.stroke()

      // Joint rings
      ctx.fillStyle = '#8f8369'
      ctx.fillRect(fluteX - fluteWidth / 2 - 1, fluteTop + 55, fluteWidth + 2, 4)
      ctx.fillRect(fluteX - fluteWidth / 2 - 1, fluteBottom - 25, fluteWidth + 2, 4)

      // Active note detection for hole glowing
      const curNote = currentSong.notes.find(
        (n) => time >= n.startTime && time < n.startTime + n.duration
      )

      if (curNote && curNote.id !== lastTriggeredNoteId.current) {
        lastTriggeredNoteId.current = curNote.id
        onNoteTriggerRef.current?.(curNote)

        // Spawn pulse ripples on active holes
        curNote.holes.forEach((h, hIdx) => {
          if (h > 0) {
            const hX = hIdx === 0 ? fluteX - 42 : fluteX
            const hY = holeYPositions[hIdx]
            ripplesRef.current.push({
              x: hX,
              y: hY,
              radius: 10,
              alpha: 0.9,
              color: hIdx === 0 ? skin.thumbColor : skin.primaryColor,
            })
          }
        })
      }

      // Draw the 8 Holes on the Flute
      for (let i = 0; i < 8; i++) {
        const isThumb = i === 0
        const holeY = holeYPositions[i]
        const isNoteActive = curNote ? curNote.holes[i] > 0 : false
        const isUserPressed = userHolesRef.current[i] > 0
        const isClosed = isNoteActive || isUserPressed
        const isHalf = curNote ? curNote.holes[i] === 0.5 : false

        if (isThumb) {
          // ----------------- THUMB HOLE (Hole 0) -----------------
          // Dedicated back hole placed to the left with connecting dotted bracket
          const thumbX = fluteX - 42
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)'
          ctx.lineWidth = 1.5
          ctx.setLineDash([3, 2])
          ctx.beginPath()
          ctx.moveTo(thumbX + 12, holeY)
          ctx.lineTo(fluteX - fluteWidth / 2, holeY)
          ctx.stroke()
          ctx.setLineDash([])

          // Thumb Hole Circle
          ctx.save()
          if (isClosed) {
            ctx.fillStyle = skin.thumbColor
            ctx.shadowColor = skin.thumbColor
            ctx.shadowBlur = 16
          } else {
            ctx.fillStyle = '#1c1917'
          }
          ctx.strokeStyle = skin.thumbColor
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(thumbX, holeY, 11, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          if (isHalf) {
            ctx.fillStyle = '#1c1917'
            ctx.beginPath()
            ctx.arc(thumbX, holeY, 11, -Math.PI / 2, Math.PI / 2)
            ctx.fill()
          }

          // Hole 'T' label
          ctx.fillStyle = isClosed ? '#000000' : '#ffffff'
          ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('T', thumbX, holeY)
          ctx.restore()
        } else if (i === 6 || i === 7) {
          // ----------------- DOUBLE HOLES 6 & 7 -----------------
          const dRadius = 4.5
          const leftHoleX = fluteX - 6
          const rightHoleX = fluteX + 6

          ctx.save()
          if (isClosed) {
            ctx.fillStyle = skin.primaryColor
            ctx.shadowColor = skin.glowColor
            ctx.shadowBlur = 14
          } else {
            ctx.fillStyle = '#221f1a'
          }
          ctx.strokeStyle = isClosed ? '#ffffff' : '#453f35'
          ctx.lineWidth = 1.8

          // Left sub-hole
          ctx.beginPath()
          ctx.arc(leftHoleX, holeY, dRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Right sub-hole
          ctx.beginPath()
          ctx.arc(rightHoleX, holeY, dRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        } else {
          // ----------------- SINGLE FRONT HOLES 1-5 -----------------
          const radius = i <= 3 ? 8 : 7.5

          ctx.save()
          if (isClosed) {
            ctx.fillStyle = skin.primaryColor
            ctx.shadowColor = skin.glowColor
            ctx.shadowBlur = 16
          } else {
            ctx.fillStyle = '#221f1a'
          }
          ctx.strokeStyle = isClosed ? '#ffffff' : '#453f35'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(fluteX, holeY, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Number label inside hole
          ctx.fillStyle = isClosed ? '#000000' : '#a89a7d'
          ctx.font = 'bold 8px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(i.toString(), fluteX, holeY)
          ctx.restore()
        }
      }

      ctx.restore() // Restore main scale

      // 6. Incoming note countdown prompt if song just started
      const firstNote = currentSong.notes[0]
      if (firstNote && firstNote.startTime > time) {
        const remainingTime = Math.max(0, firstNote.startTime - time).toFixed(1)
        ctx.save()
        ctx.fillStyle = skin.primaryColor
        ctx.shadowColor = skin.glowColor
        ctx.shadowBlur = 10
        ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`PRIMERA NOTA EN: ${remainingTime}s`, width / 2 + 50, 32)
        ctx.restore()
      }

      animId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <div className="w-full flex flex-col gap-3.5">
      {/* Visualizer Top Bar: Active Note HUD + Skin & Scroll Speed Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-md shadow-xl">
        {/* Active Note Big Card */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-slate-800 to-slate-900 border border-cyan-500/40 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/10">
            <span className="text-xl font-black text-cyan-400 font-mono leading-none">
              {currentNote ? currentNote.letter : '--'}
            </span>
            <span className="text-[11px] font-bold text-slate-300 font-sans mt-0.5">
              {currentNote ? currentNote.solfege : 'Listo'}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {currentNote ? `Nota: ${currentNote.pitch}` : 'Esperando nota...'}
              </span>
              {currentFingering.isHighOctave && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Octava Alta (½ Pulgar)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {currentNote
                ? `Digitación: [T: ${currentNote.holes[0] === 0.5 ? '½' : currentNote.holes[0]} | ${currentNote.holes.slice(1, 4).join('')} | ${currentNote.holes.slice(4).join('')}]`
                : 'Presiona Play o toca las teclas (Space, A S D, J K L ;)'}
            </p>
          </div>
        </div>

        {/* Right Controls: Skin Selector & Scroll Speed */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Scroll Speed (Juego de ritmo profesional) */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400 font-bold mr-1">Speed:</span>
            {[1.0, 1.5, 2.0, 2.5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title={`Velocidad de desplazamiento: ${spd}x`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Skins (Diseño de notas: cápsula, cuadrada, circular) */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Palette className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs text-slate-400 font-bold mr-1">Skin:</span>
            <select
              value={selectedSkinId}
              onChange={(e) => setSelectedSkinId(e.target.value)}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
            >
              {VISUALIZER_SKINS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Note Labels */}
          <button
            onClick={() => setShowPitchLabels(!showPitchLabels)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              showPitchLabels
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800'
            }`}
            title="Mostrar u ocultar los nombres de las notas en las barras"
          >
            {showPitchLabels ? 'Etiquetas ON' : 'Etiquetas OFF'}
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage Canvas */}
      <div
        ref={containerRef}
        className="w-full h-[520px] md:h-[580px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl"
      >
        <canvas
          id="recorder-visualizer-canvas"
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
          onClick={(e) => {
            // Clicking canvas seeks to relative timestamp
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            const clickX = e.clientX - rect.left
            const fluteX = Math.max(160, Math.min(340, rect.width * 0.28))
            const scrollSpeed = 260 * speedMultiplier * playbackRate
            const timeDiff = (clickX - fluteX) / scrollSpeed
            const targetTime = Math.max(0, currentTime + timeDiff)
            onSeek(targetTime)
          }}
        />

        {/* Floating Quick Keybindings Guide on bottom right */}
        <div className="absolute bottom-3 right-4 bg-slate-900/80 border border-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] text-slate-400 flex items-center gap-2 select-none pointer-events-none">
          <span className="font-semibold text-slate-300">Teclado:</span>
          <span className="font-mono text-amber-400">[Space]=T</span>
          <span className="font-mono text-cyan-400">[A S D]=1-3</span>
          <span className="font-mono text-emerald-400">[J K L ;]=4-7</span>
        </div>
      </div>

      {/* Keyboard Quick Finger Testing Ribbon */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 bg-slate-900/70 border border-slate-800 p-2.5 rounded-2xl backdrop-blur-md">
        {FINGER_KEYS.map((item) => {
          const isPressed = userHoles[item.id] > 0
          const isNoteClosed = currentNote ? currentNote.holes[item.id] > 0 : false
          const isThumb = item.id === 0

          return (
            <button
              key={item.id}
              onMouseDown={() => {
                userHolesRef.current[item.id] = 1
                setUserHoles([...userHolesRef.current])
              }}
              onMouseUp={() => {
                userHolesRef.current[item.id] = 0
                setUserHoles([...userHolesRef.current])
              }}
              onTouchStart={() => {
                userHolesRef.current[item.id] = 1
                setUserHoles([...userHolesRef.current])
              }}
              onTouchEnd={() => {
                userHolesRef.current[item.id] = 0
                setUserHoles([...userHolesRef.current])
              }}
              className={`p-2 rounded-xl text-center transition select-none cursor-pointer flex flex-col items-center justify-between border ${
                isPressed
                  ? isThumb
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                    : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20 font-black'
                  : isNoteClosed
                    ? 'bg-slate-800/90 border-cyan-500/40 text-cyan-300 font-bold'
                    : 'bg-slate-950/80 border-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black">{item.label}</span>
                <span className="text-[10px] opacity-70 font-mono">[{item.key}]</span>
              </div>
              <span className="text-[9px] mt-0.5 truncate max-w-full">
                {item.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
