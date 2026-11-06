import React, { useEffect, useRef } from 'react'
import type { AspectRatio, NoteEvent, SongMetadata } from '../types/music'
import { SILHOUETTES } from '../lib/silhouettes'

interface Props {
  song: SongMetadata
  currentTime: number
  isPlaying: boolean
  playbackRate: number
  aspectRatio: AspectRatio
  fingeringSystem: 'baroque' | 'german'
  onNoteTrigger?: (note: NoteEvent) => void
}

export const RecorderVisualizerCanvas: React.FC<Props> = ({
  song,
  currentTime,
  playbackRate,
  aspectRatio,
  onNoteTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastTriggeredNoteId = useRef<string | null>(null)
  const activeRippleRef = useRef<{ x: number; y: number; radius: number; alpha: number }[]>([])
  const needleAngleRef = useRef<number>(0) // For smooth needle dial animation

  // Reference dimensions (Virtual canvas space is always 1080x1920 in 9:16 or 1920x1080 in 16:9)
  const V_WIDTH = aspectRatio === '16:9' ? 1920 : 1080
  const V_HEIGHT = aspectRatio === '16:9' ? 1080 : 1920

  // Recorder hole relative positions (Y coordinates on virtual canvas)
  const stageTop = V_HEIGHT * 0.32
  const stageHeight = V_HEIGHT * 0.38
  const stageCenterY = stageTop + stageHeight / 2
  const fluteX = V_WIDTH * (aspectRatio === '16:9' ? 0.45 : 0.52)

  // 8 Hole Y coordinates
  // 0: Thumb (slightly left of hole 1)
  // 1-7: Front holes
  const holeSpacing = stageHeight * 0.088
  const startHoleY = stageTop + stageHeight * 0.16

  const holeYPositions = [
    startHoleY + holeSpacing * 0.8, // 0: Thumb (displayed offset left)
    startHoleY + holeSpacing * 0.8, // 1: Left Index
    startHoleY + holeSpacing * 1.8, // 2: Left Middle
    startHoleY + holeSpacing * 2.8, // 3: Left Ring
    startHoleY + holeSpacing * 4.2, // 4: Right Index
    startHoleY + holeSpacing * 5.2, // 5: Right Middle
    startHoleY + holeSpacing * 6.2, // 6: Right Ring (Double)
    startHoleY + holeSpacing * 7.2, // 7: Right Pinky (Double)
  ]

  // Track scroll speed (pixels per second)
  const scrollSpeed = 380 * playbackRate

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    // Cache silhouette image if possible
    const silhouetteImg = new Image()
    let silhouetteLoaded = false
    const rawSvg = SILHOUETTES[song.silhouettePreset] || SILHOUETTES.reimu
    const blob = new Blob([rawSvg], { type: 'image/svg+xml' })
    const svgUrl = song.customSilhouetteUrl || URL.createObjectURL(blob)
    silhouetteImg.src = svgUrl
    silhouetteImg.onload = () => {
      silhouetteLoaded = true
    }

    const render = () => {
      ctx.save()

      // Set internal canvas resolution
      if (canvas.width !== V_WIDTH || canvas.height !== V_HEIGHT) {
        canvas.width = V_WIDTH
        canvas.height = V_HEIGHT
      }

      // Find current active note
      const currentNote = song.notes.find(
        (n) => currentTime >= n.startTime && currentTime < n.startTime + n.duration
      )

      if (currentNote && currentNote.id !== lastTriggeredNoteId.current) {
        lastTriggeredNoteId.current = currentNote.id
        onNoteTrigger?.(currentNote)

        // Trigger ripple effects on covered holes
        currentNote.holes.forEach((h, hIdx) => {
          if (h > 0) {
            const hX = hIdx === 0 ? fluteX - 38 : fluteX
            const hY = holeYPositions[hIdx]
            activeRippleRef.current.push({
              x: hX,
              y: hY,
              radius: 12,
              alpha: 0.9,
            })
          }
        })
      }

      // Clear Canvas
      ctx.fillStyle = '#0f1115'
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT)

      // -------------------------------------------------------------
      // ZONE 1: HEADER & SILHOUETTE (Top Section)
      // -------------------------------------------------------------
      const headerH = stageTop
      // Background gradient
      const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH)
      headerGrad.addColorStop(0, '#ffffff')
      headerGrad.addColorStop(0.85, '#ffffff')
      headerGrad.addColorStop(1, '#ebebeb')
      ctx.fillStyle = headerGrad
      ctx.fillRect(0, 0, V_WIDTH, headerH)

      // Silhouette image on top right
      if (silhouetteLoaded) {
        ctx.save()
        const silW = V_WIDTH * 0.44
        const silH = headerH * 0.78
        const silX = V_WIDTH - silW - 20
        const silY = 30
        ctx.drawImage(silhouetteImg, silX, silY, silW, silH)
        ctx.restore()
      }

      // Title & Subtitle on Top Left
      ctx.save()
      ctx.fillStyle = '#0a0a0c'
      ctx.font = 'italic 900 82px "Times New Roman", Georgia, serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(song.title, 60, 110)

      // Subtitle / feat
      ctx.font = 'italic 600 30px "Times New Roman", Georgia, serif'
      ctx.fillStyle = '#444'
      ctx.fillText(song.subtitle, 65, 205)

      // Call to action button / banner ("Subscribe for daily tutorials")
      ctx.font = '900 38px "Arial Black", Impact, sans-serif'
      ctx.textAlign = 'center'
      const ctaY = headerH - 85
      const ctaText = song.bannerCta || 'Subscribe for daily tutorials'
      // Stroke outline
      ctx.lineJoin = 'round'
      ctx.lineWidth = 14
      ctx.strokeStyle = '#ffffff'
      ctx.strokeText(ctaText, V_WIDTH / 2, ctaY)
      ctx.lineWidth = 8
      ctx.strokeStyle = '#000000'
      ctx.strokeText(ctaText, V_WIDTH / 2, ctaY)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(ctaText, V_WIDTH / 2, ctaY)
      ctx.restore()

      // -------------------------------------------------------------
      // ZONE 2: STAGE & HORIZONTAL ROLL (Center Section)
      // -------------------------------------------------------------
      // Stage Background
      ctx.fillStyle = '#1e1f24'
      ctx.fillRect(0, stageTop, V_WIDTH, stageHeight)

      // Subtle horizontal track guidelines behind notes
      ctx.lineWidth = 1
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)'
      holeYPositions.forEach((y, idx) => {
        if (idx > 0) {
          ctx.beginPath()
          ctx.moveTo(fluteX, y)
          ctx.lineTo(V_WIDTH, y)
          ctx.stroke()
        }
      })

      // Watermark in background: "Powered by Recorder Studio"
      ctx.save()
      ctx.font = '600 24px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.textAlign = 'center'
      ctx.fillText('POWERED BY RECORDER VISUALIZER', fluteX + 160, stageCenterY - 40)
      ctx.restore()

      // Draw Scrolling Note Blocks (Synthesia for recorder)
      const visibleTimeWindow = (V_WIDTH - fluteX) / scrollSpeed
      const upcomingNotes = song.notes.filter(
        (n) => n.startTime + n.duration >= currentTime - 0.5 && n.startTime <= currentTime + visibleTimeWindow + 1
      )

      upcomingNotes.forEach((note) => {
        const timeOffset = note.startTime - currentTime
        const blockX = fluteX + timeOffset * scrollSpeed
        const blockWidth = Math.max(18, note.duration * scrollSpeed - 6)

        // Draw pill/circle blocks for each hole
        note.holes.forEach((holeState, hIdx) => {
          const holeY = holeYPositions[hIdx]
          const blockH = 20

          if (holeState > 0) {
            // Active / Covered hole -> Vivid Cyan Rounded Capsule
            ctx.save()
            ctx.fillStyle = '#00e5ff'
            ctx.shadowColor = 'rgba(0, 229, 255, 0.65)'
            ctx.shadowBlur = 10

            const radius = 10
            ctx.beginPath()
            ctx.roundRect(blockX, holeY - blockH / 2, blockWidth, blockH, radius)
            ctx.fill()
            ctx.restore()
          } else if (hIdx >= 5) {
            // Guide dots for lower resting fingers (like in reference video)
            ctx.save()
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            ctx.beginPath()
            ctx.arc(blockX + 10, holeY, 9, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
          }
        })
      })

      // Draw animated ripples on active holes
      activeRippleRef.current.forEach((r, idx) => {
        ctx.save()
        ctx.strokeStyle = `rgba(0, 229, 255, ${r.alpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()

        r.radius += 1.8
        r.alpha -= 0.04
        if (r.alpha <= 0) {
          activeRippleRef.current.splice(idx, 1)
        }
      })

      // -------------------------------------------------------------
      // DRAW CENTER SOPRANO RECORDER
      // -------------------------------------------------------------
      ctx.save()
      const fluteWidth = 46
      const fluteTop = stageTop + 10
      const fluteBottom = stageTop + stageHeight - 10

      // Recorder Body (Ivory wood gradient)
      const fluteGrad = ctx.createLinearGradient(fluteX - fluteWidth / 2, 0, fluteX + fluteWidth / 2, 0)
      fluteGrad.addColorStop(0, '#dcd0b1')
      fluteGrad.addColorStop(0.3, '#f9f1dd')
      fluteGrad.addColorStop(0.7, '#f4ebd2')
      fluteGrad.addColorStop(1, '#c5b898')

      // Main tube
      ctx.fillStyle = fluteGrad
      ctx.strokeStyle = '#4a4436'
      ctx.lineWidth = 2.5

      // Beak / Mouthpiece
      ctx.beginPath()
      ctx.moveTo(fluteX - fluteWidth * 0.45, fluteTop + 45)
      ctx.bezierCurveTo(
        fluteX - fluteWidth * 0.5,
        fluteTop + 20,
        fluteX - fluteWidth * 0.35,
        fluteTop,
        fluteX - fluteWidth * 0.25,
        fluteTop
      )
      ctx.lineTo(fluteX + fluteWidth * 0.25, fluteTop)
      ctx.bezierCurveTo(
        fluteX + fluteWidth * 0.35,
        fluteTop,
        fluteX + fluteWidth * 0.5,
        fluteTop + 20,
        fluteX + fluteWidth * 0.45,
        fluteTop + 45
      )
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Labium / Window block
      ctx.fillStyle = '#3a342a'
      ctx.beginPath()
      ctx.arc(fluteX, fluteTop + 36, 11, 0, Math.PI, true)
      ctx.fill()
      ctx.stroke()

      // Main tube body
      ctx.fillStyle = fluteGrad
      ctx.beginPath()
      ctx.moveTo(fluteX - fluteWidth * 0.46, fluteTop + 45)
      ctx.lineTo(fluteX - fluteWidth * 0.42, fluteBottom - 45)
      // Bell flare at bottom
      ctx.bezierCurveTo(
        fluteX - fluteWidth * 0.42,
        fluteBottom - 20,
        fluteX - fluteWidth * 0.65,
        fluteBottom - 8,
        fluteX - fluteWidth * 0.6,
        fluteBottom
      )
      ctx.lineTo(fluteX + fluteWidth * 0.6, fluteBottom)
      ctx.bezierCurveTo(
        fluteX + fluteWidth * 0.65,
        fluteBottom - 8,
        fluteX + fluteWidth * 0.42,
        fluteBottom - 20,
        fluteX + fluteWidth * 0.42,
        fluteBottom - 45
      )
      ctx.lineTo(fluteX + fluteWidth * 0.46, fluteTop + 45)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Decorative joint rings
      const rings = [fluteTop + 45, fluteTop + 85, fluteBottom - 50]
      ctx.fillStyle = '#c5b898'
      rings.forEach((ry) => {
        ctx.strokeRect(fluteX - fluteWidth * 0.48, ry, fluteWidth * 0.96, 6)
        ctx.fillRect(fluteX - fluteWidth * 0.48, ry, fluteWidth * 0.96, 6)
      })

      // Cursive 'c' logo on headjoint (just like in video!)
      ctx.font = 'italic 700 24px "Brush Script MT", "Segoe Script", cursive'
      ctx.fillStyle = '#00a8cc'
      ctx.textAlign = 'center'
      ctx.fillText('c', fluteX - 1, fluteTop + 76)

      // Active holes state
      const activeHoles = currentNote?.holes || [0, 0, 0, 0, 0, 0, 0, 0]

      // Draw Thumb Hole (0) on the Left
      const thumbX = fluteX - 40
      const thumbY = holeYPositions[0]
      const thumbState = activeHoles[0]

      // Thumb connector stem
      ctx.strokeStyle = '#5a554a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(thumbX + 11, thumbY)
      ctx.lineTo(fluteX - fluteWidth * 0.45, thumbY)
      ctx.stroke()

      // Thumb ring outer
      ctx.fillStyle = thumbState > 0 ? '#00e5ff' : '#23252b'
      ctx.strokeStyle = '#5a554a'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(thumbX, thumbY, 11, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      if (thumbState === 0.5) {
        // Pinched thumb: half circle
        ctx.fillStyle = '#23252b'
        ctx.beginPath()
        ctx.arc(thumbX, thumbY, 11, -Math.PI / 2, Math.PI / 2, false)
        ctx.fill()
      }

      // Draw Front Tone Holes 1 to 7
      for (let i = 1; i <= 7; i++) {
        const hy = holeYPositions[i]
        const state = activeHoles[i]
        const isDouble = i === 6 || i === 7

        if (!isDouble) {
          // Single Hole
          const radius = i === 3 ? 10 : 11
          ctx.save()
          if (state > 0) {
            ctx.fillStyle = '#00e5ff'
            ctx.shadowColor = '#00e5ff'
            ctx.shadowBlur = 14
          } else {
            ctx.fillStyle = '#23252b'
          }
          ctx.strokeStyle = '#3d382e'
          ctx.lineWidth = 2.5
          ctx.beginPath()
          ctx.arc(fluteX, hy, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        } else {
          // Double Holes (two smaller holes side by side)
          const dRadius = 6.5
          const offset = 8.5
          ctx.save()
          if (state > 0) {
            ctx.fillStyle = '#00e5ff'
            ctx.shadowColor = '#00e5ff'
            ctx.shadowBlur = 12
          } else {
            ctx.fillStyle = '#23252b'
          }
          ctx.strokeStyle = '#3d382e'
          ctx.lineWidth = 2

          // Left sub-hole
          ctx.beginPath()
          ctx.arc(fluteX - offset, hy, dRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()

          // Right sub-hole
          ctx.beginPath()
          ctx.arc(fluteX + offset, hy, dRadius, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
          ctx.restore()
        }
      }
      ctx.restore()

      // -------------------------------------------------------------
      // DRAW DUAL-ROW NOTE & SOLFÈGE TICKER (Left HUD)
      // -------------------------------------------------------------
      ctx.save()
      const hudCenterX = fluteX * 0.48
      const topRowY = stageCenterY - 60
      const bottomRowY = stageCenterY + 60
      const noteSpacingX = 85

      // Get note sequence around current time (5 notes in top, 5 notes in bottom)
      const currentIndex = song.notes.findIndex((n) => n.id === currentNote?.id)
      const safeIndex = currentIndex >= 0 ? currentIndex : 0

      // Alternating row assignment
      const isTopRowActive = safeIndex % 2 === 0
      const targetAngle = isTopRowActive ? -0.55 : 0.55
      needleAngleRef.current += (targetAngle - needleAngleRef.current) * 0.18

      // Draw 5 slots centered around current note
      for (let offset = -2; offset <= 2; offset++) {
        const slotIdx = safeIndex + offset * 2
        const slotX = hudCenterX + offset * noteSpacingX

        // Top Row Item
        const topNoteIdx = isTopRowActive ? slotIdx : slotIdx - 1
        const topNote = song.notes[topNoteIdx]

        if (topNote) {
          const isActive = topNote.id === currentNote?.id
          if (isActive) {
            // Glowing cyan rounded badge
            ctx.save()
            ctx.fillStyle = '#00e5ff'
            ctx.shadowColor = '#00e5ff'
            ctx.shadowBlur = 18
            ctx.beginPath()
            ctx.roundRect(slotX - 34, topRowY - 32, 68, 64, 14)
            ctx.fill()
            ctx.restore()
          }

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = isActive ? '#000000' : '#ffffff'
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.fillText(topNote.letter, slotX, topRowY - 10)

          ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.fillText(topNote.solfege, slotX, topRowY + 18)
        }

        // Bottom Row Item
        const bottomNoteIdx = !isTopRowActive ? slotIdx : slotIdx + 1
        const bottomNote = song.notes[bottomNoteIdx]

        if (bottomNote) {
          const isActive = bottomNote.id === currentNote?.id
          if (isActive) {
            ctx.save()
            ctx.fillStyle = '#00e5ff'
            ctx.shadowColor = '#00e5ff'
            ctx.shadowBlur = 18
            ctx.beginPath()
            ctx.roundRect(slotX - 34, bottomRowY - 32, 68, 64, 14)
            ctx.fill()
            ctx.restore()
          }

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = isActive ? '#000000' : '#ffffff'
          ctx.font = '900 32px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.fillText(bottomNote.letter, slotX, bottomRowY - 10)

          ctx.font = '700 22px -apple-system, BlinkMacSystemFont, sans-serif'
          ctx.fillText(bottomNote.solfege, slotX, bottomRowY + 18)
        }
      }

      // Draw Center Dial & Needle
      const dialX = hudCenterX + 1.2 * noteSpacingX
      const dialY = stageCenterY

      // Elliptical dial base
      ctx.strokeStyle = '#555866'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.ellipse(dialX, dialY, 26, 12, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Dual-tip Needle
      ctx.save()
      ctx.translate(dialX, dialY)
      ctx.rotate(needleAngleRef.current)

      // Top tip (Gold/Yellow capsule)
      ctx.fillStyle = '#ffb300'
      ctx.beginPath()
      ctx.roundRect(-7, -46, 14, 46, 7)
      ctx.fill()

      // Bottom tip (Red/Coral capsule)
      ctx.fillStyle = '#ff4757'
      ctx.beginPath()
      ctx.roundRect(-7, 0, 14, 46, 7)
      ctx.fill()

      // Center pivot cap
      ctx.fillStyle = '#2f3542'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()

      ctx.restore()

      // -------------------------------------------------------------
      // ZONE 3: FOOTER & LARGE TITLE (Bottom Section)
      // -------------------------------------------------------------
      const footerY = stageTop + stageHeight + 40
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      // Line 1: Main Title e.g. "BAD APPLE"
      ctx.font = '900 86px "Arial Black", Impact, sans-serif'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 20
      ctx.strokeStyle = '#000000'
      ctx.strokeText(song.bottomTitle || song.title.toUpperCase(), V_WIDTH / 2, footerY + 30)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(song.bottomTitle || song.title.toUpperCase(), V_WIDTH / 2, footerY + 30)

      // Line 2: Speed / Mode e.g. '"SLOWED"'
      ctx.font = '900 78px "Arial Black", Impact, sans-serif'
      ctx.lineWidth = 18
      ctx.strokeStyle = '#000000'
      ctx.strokeText(song.speedLabel || '"SLOWED"', V_WIDTH / 2, footerY + 140)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(song.speedLabel || '"SLOWED"', V_WIDTH / 2, footerY + 140)

      // Line 3: Subtitle e.g. "Recorder Tutorial"
      ctx.font = '900 72px "Arial Black", Impact, sans-serif'
      ctx.lineWidth = 18
      ctx.strokeStyle = '#000000'
      ctx.strokeText(song.bottomSubtitle || 'Recorder Tutorial', V_WIDTH / 2, footerY + 250)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(song.bottomSubtitle || 'Recorder Tutorial', V_WIDTH / 2, footerY + 250)
      ctx.restore()

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [song, currentTime, playbackRate, aspectRatio, fluteX, stageTop, stageHeight, stageCenterY, V_WIDTH, V_HEIGHT])

  return (
    <div className="relative flex justify-center items-center w-full h-full bg-black/40 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
      <canvas
        ref={canvasRef}
        id="recorder-visualizer-canvas"
        className={`w-full max-h-[82vh] object-contain transition-all duration-300 ${
          aspectRatio === '9:16' ? 'aspect-[9/16]' : aspectRatio === '16:9' ? 'aspect-[16/9]' : 'aspect-auto'
        }`}
      />
    </div>
  )
}
