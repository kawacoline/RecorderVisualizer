import React, { useEffect, useRef, useState, useMemo } from 'react'
import { Gauge, Palette } from 'lucide-react'
import type { Fingering, NoteEvent, SongMetadata } from '../types/music'
import { getFingering } from '../lib/recorderFingering'
import { VISUALIZER_SKINS, getHoleColors } from '../types/skins'

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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.5) // 1.0x to 2.5x
  const [showPitchLabels, setShowPitchLabels] = useState<boolean>(true)

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
      const fluteWidth = 44
      const topPadding = 50
      const bottomPadding = 40
      const usableHeight = height - topPadding - bottomPadding
      const holeStep = usableHeight / 8.5

      // All 8 holes (0 to 7) centered along fluteX
      // Hole 0: Pulgar (Cyan)
      // Hole 1: Dedo 1 (Cyan)
      // Hole 2: Dedo 2 (Cyan)
      // Hole 3: Dedo 3 (Blanco)
      // Hole 4: Dedo 4 (Blanco)
      // Hole 5: Dedo 5 (Blanco)
      // Hole 6: Dedo 6 (Blanco)
      // Hole 7: Dedo 7 (Blanco)
      const holeYPositions = [
        topPadding + holeStep * 0.7, // Hole 0 (Pulgar)
        topPadding + holeStep * 1.7, // Hole 1 (Dedo 1)
        topPadding + holeStep * 2.7, // Hole 2 (Dedo 2)
        topPadding + holeStep * 3.7, // Hole 3 (Dedo 3)
        topPadding + holeStep * 4.9, // Hole 4 (Dedo 4) - natural hand separation
        topPadding + holeStep * 5.9, // Hole 5 (Dedo 5)
        topPadding + holeStep * 6.9, // Hole 6 (Dedo 6)
        topPadding + holeStep * 7.9, // Hole 7 (Dedo 7)
      ]

      // 1. Draw subtle horizontal note track guidelines
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      for (let i = 0; i < 8; i++) {
        const y = holeYPositions[i]
        ctx.beginPath()
        ctx.moveTo(fluteX, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      // 2. Draw Hit Line / Reception Boundary
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
      ctx.lineWidth = 1.5
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
          if (holeState === 0) return // Skip open holes (no ghost white dots)

          const holeY = holeYPositions[hIdx]
          const blockH = 20
          // Colors: Pulgar, 1 y 2 -> Cyan; 3, 4, 5, 6, 7 -> Blanco
          const { color: noteColor, glow: noteGlow } = getHoleColors(hIdx, skin)

          ctx.save()
          ctx.fillStyle = noteColor
          ctx.shadowColor = noteGlow
          ctx.shadowBlur = 12

          if (skin.shape === 'capsule') {
            const radius = blockH / 2
            ctx.beginPath()
            ctx.roundRect(blockX, holeY - blockH / 2, blockWidth, blockH, radius)
            ctx.fill()
          } else if (skin.shape === 'rectangle') {
            ctx.beginPath()
            ctx.roundRect(blockX, holeY - blockH / 2, blockWidth, blockH, 3)
            ctx.fill()
          } else {
            // Circle skin
            const radius = 10
            ctx.beginPath()
            ctx.arc(blockX + 12, holeY, radius, 0, Math.PI * 2)
            ctx.fill()
          }

          // Pinched / Half hole indicator
          if (holeState === 0.5) {
            ctx.fillStyle = '#0b0d13'
            ctx.fillRect(blockX, holeY - blockH / 2, blockWidth / 2, blockH)
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5
            ctx.strokeRect(blockX, holeY - blockH / 2, blockWidth, blockH)
          }

          // Note Pitch Text Label inside block
          // Shown on Hole 1, or on Hole 0 if Hole 1 is open
          const isPrimaryLabelLane = hIdx === 1 || (note.holes[1] === 0 && hIdx === 0)
          if (showLabelsRef.current && isPrimaryLabelLane && blockWidth > 32) {
            const { textContrast } = getHoleColors(hIdx, skin)
            ctx.fillStyle = textContrast
            ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(note.letter, blockX + blockWidth / 2, holeY)
          }

          ctx.restore()
        })
      })

      // 4. Draw Animated Impact Ripples when notes hit the flute
      ripplesRef.current.forEach((r, idx) => {
        ctx.save()
        ctx.strokeStyle = r.color
        ctx.lineWidth = 2.5
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
      const fluteTop = topPadding - 32
      const fluteBottom = topPadding + holeStep * 8.4

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
      ctx.fillRect(fluteX - fluteWidth / 2 - 1, fluteTop + 48, fluteWidth + 2, 4)
      ctx.fillRect(fluteX - fluteWidth / 2 - 1, fluteBottom - 20, fluteWidth + 2, 4)

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
            const hY = holeYPositions[hIdx]
            const { color: rColor } = getHoleColors(hIdx, skin)
            ripplesRef.current.push({
              x: fluteX,
              y: hY,
              radius: 10,
              alpha: 0.9,
              color: rColor,
            })
          }
        })
      }

      // Draw the 8 Holes on the Flute (All centered along fluteX)
      for (let i = 0; i < 8; i++) {
        const holeY = holeYPositions[i]
        const isNoteActive = curNote ? curNote.holes[i] > 0 : false
        const isClosed = isNoteActive
        const isHalf = curNote ? curNote.holes[i] === 0.5 : false
        const { color: holeColor, glow: holeGlow } = getHoleColors(i, skin)

        if (i === 6 || i === 7) {
          // Double holes 6 and 7 (centered at fluteX)
          const dRadius = 4.5
          const leftHoleX = fluteX - 6
          const rightHoleX = fluteX + 6

          ctx.save()
          if (isClosed) {
            ctx.fillStyle = holeColor
            ctx.shadowColor = holeGlow
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
          if (isHalf) {
            ctx.fillStyle = '#221f1a'
            ctx.strokeStyle = '#453f35'
          }
          ctx.beginPath()
          ctx.arc(rightHoleX, holeY, dRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        } else {
          // Single front holes: 0 (Pulgar), 1, 2, 3, 4, 5
          const radius = i === 0 ? 8.5 : i <= 3 ? 8 : 7.5

          ctx.save()
          if (isClosed) {
            ctx.fillStyle = holeColor
            ctx.shadowColor = holeGlow
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

          // Pinched / half hole
          if (isHalf) {
            ctx.fillStyle = '#221f1a'
            ctx.beginPath()
            ctx.arc(fluteX, holeY, radius, -Math.PI / 2, Math.PI / 2)
            ctx.fill()
          }

          // Number label inside hole: '0' for Pulgar, '1' for 1, '2' for 2, etc.
          const { textContrast: holeTextContrast } = getHoleColors(i, skin)
          ctx.fillStyle = isClosed ? holeTextContrast : '#a89a7d'
          ctx.font = 'bold 8.5px -apple-system, BlinkMacSystemFont, sans-serif'
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
        ctx.fillStyle = skin.cyanColor
        ctx.shadowColor = skin.glowCyan
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
                ? `Digitación: [Pulgar: ${currentNote.holes[0] === 0.5 ? '½' : currentNote.holes[0]} | ${currentNote.holes.slice(1, 4).join('')} | ${currentNote.holes.slice(4).join('')}]`
                : 'Presiona Play para iniciar la visualización'}
            </p>
            <div className="flex items-center gap-2 text-[10px] font-mono mt-1 text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
                Pulgar (0) & Dedo 7: Rojo
              </span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-sm shadow-cyan-400/50"></span>
                Dedos 1, 2, 3: Cian
              </span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-white inline-block shadow-sm shadow-white/50"></span>
                Dedos 4, 5, 6: Blanco
              </span>
            </div>
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
        className="w-full h-[540px] md:h-[600px] bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl"
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
      </div>
    </div>
  )
}
