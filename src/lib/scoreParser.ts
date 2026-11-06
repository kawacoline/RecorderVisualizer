import { Midi } from '@tonejs/midi'
import JSZip from 'jszip'
import type { NoteEvent } from '../types/music'
import {
  calculateBestTransposition,
  getDisplayLabels,
  getFingering,
  midiToNoteName,
} from './recorderFingering'

export interface TrackOption {
  id: string | number
  name: string
  noteCount: number
  isRecommended: boolean
}

export interface ParsedScore {
  title: string
  composer?: string
  tempo: number
  notes: NoteEvent[]
  availableTracks: TrackOption[]
  selectedTrackId: string | number
  timeSignature?: string
  keySignature?: string
  needsTransposition?: boolean
  recommendedShift?: number
}

/**
 * Filter chord notes to keep monophonic soprano melody (highest pitch per timestamp)
 */
function filterToMonophonicMelody(notes: { pitch: string; midi: number; startTime: number; duration: number; measure?: number }[]) {
  if (notes.length === 0) return []

  // Group notes starting within 0.05 seconds of each other
  const timeThreshold = 0.04
  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime)
  const result: typeof notes = []

  let currentCluster: typeof notes = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i]
    if (Math.abs(n.startTime - currentCluster[0].startTime) < timeThreshold) {
      currentCluster.push(n)
    } else {
      // Pick highest note from cluster
      currentCluster.sort((a, b) => b.midi - a.midi)
      result.push(currentCluster[0])
      currentCluster = [n]
    }
  }

  if (currentCluster.length > 0) {
    currentCluster.sort((a, b) => b.midi - a.midi)
    result.push(currentCluster[0])
  }

  return result
}

/**
 * Parses a MIDI file from ArrayBuffer
 */
export async function parseMidiFile(
  data: ArrayBuffer,
  fingeringSystem: 'baroque' | 'german' = 'baroque',
  targetTrackId?: string | number
): Promise<ParsedScore> {
  const midi = new Midi(data)
  const title = midi.name || 'Imported MIDI'
  const tempo = midi.header.tempos.length > 0 ? Math.round(midi.header.tempos[0].bpm) : 120

  // Inspect all tracks
  const availableTracks: TrackOption[] = midi.tracks
    .map((track, idx) => {
      const name = track.name?.trim() || `Track ${idx + 1}`
      const isRecommended = /recorder|rec\b|flute|flauta|dulce|soprano|melody|lead|solo/i.test(name)
      return {
        id: idx,
        name: `${name} (${track.notes.length} notes)`,
        noteCount: track.notes.length,
        isRecommended,
      }
    })
    .filter((t) => t.noteCount > 0)

  if (availableTracks.length === 0) {
    throw new Error('No musical notes found in this MIDI file.')
  }

  // Choose track: targetTrackId if provided, or first recommended track, or highest note count
  let selectedIdx = typeof targetTrackId === 'number' ? targetTrackId : -1
  if (selectedIdx < 0 || selectedIdx >= midi.tracks.length) {
    const recTrack = availableTracks.find((t) => t.isRecommended)
    if (recTrack) {
      selectedIdx = recTrack.id as number
    } else {
      selectedIdx = availableTracks[0].id as number
    }
  }

  const selectedTrack = midi.tracks[selectedIdx] || midi.tracks[0]

  // Filter chords to monophonic lead melody
  const rawEvents = selectedTrack.notes.map((n) => ({
    pitch: n.name,
    midi: n.midi,
    startTime: n.time,
    duration: n.duration,
  }))
  const monophonic = filterToMonophonicMelody(rawEvents)

  // Check if transposition is needed
  const rawMidis = monophonic.map((n) => n.midi)
  const shift = calculateBestTransposition(rawMidis)

  const notes: NoteEvent[] = monophonic.map((n, idx) => {
    const finalMidi = n.midi + shift
    const { letter, solfege } = getDisplayLabels(finalMidi)
    const fingering = getFingering(finalMidi, fingeringSystem)
    const { name, octave } = midiToNoteName(finalMidi)

    return {
      id: `midi-note-${idx}`,
      pitch: `${name}${octave}`,
      midi: finalMidi,
      startTime: n.startTime,
      duration: Math.max(0.1, n.duration),
      letter,
      solfege,
      holes: fingering.holes,
      noteIndex: idx,
    }
  })

  notes.sort((a, b) => a.startTime - b.startTime)

  return {
    title,
    tempo,
    notes,
    availableTracks,
    selectedTrackId: selectedIdx,
    timeSignature: midi.header.timeSignatures.length > 0
      ? `${midi.header.timeSignatures[0].timeSignature[0]}/${midi.header.timeSignatures[0].timeSignature[1]}`
      : '4/4',
    needsTransposition: shift !== 0,
    recommendedShift: shift,
  }
}

/**
 * Parses MusicXML or compressed .mxml
 */
export async function parseMusicXML(
  fileData: ArrayBuffer | string,
  fingeringSystem: 'baroque' | 'german' = 'baroque',
  targetPartId?: string | number
): Promise<ParsedScore> {
  let xmlString = ''

  if (typeof fileData === 'string') {
    xmlString = fileData
  } else {
    try {
      const zip = await JSZip.loadAsync(fileData)
      const containerFile = zip.file('META-INF/container.xml')
      let rootXmlPath = ''
      if (containerFile) {
        const containerText = await containerFile.async('text')
        const parser = new DOMParser()
        const doc = parser.parseFromString(containerText, 'application/xml')
        const rootfile = doc.querySelector('rootfile')
        if (rootfile) {
          rootXmlPath = rootfile.getAttribute('full-path') || ''
        }
      }

      if (!rootXmlPath) {
        for (const filename of Object.keys(zip.files)) {
          if (filename.endsWith('.xml') && !filename.startsWith('META-INF')) {
            rootXmlPath = filename
            break
          }
        }
      }

      if (rootXmlPath && zip.file(rootXmlPath)) {
        xmlString = await zip.file(rootXmlPath)!.async('text')
      } else {
        const decoder = new TextDecoder('utf-8')
        xmlString = decoder.decode(fileData)
      }
    } catch {
      const decoder = new TextDecoder('utf-8')
      xmlString = decoder.decode(fileData)
    }
  }

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'application/xml')

  const title =
    doc.querySelector('movement-title')?.textContent?.trim() ||
    doc.querySelector('work-title')?.textContent?.trim() ||
    doc.querySelector('part-name')?.textContent?.trim() ||
    'Imported Score'

  const composer = doc.querySelector('creator[type="composer"]')?.textContent?.trim() || ''

  // Look for tempo
  let tempo = 120
  const soundNode = doc.querySelector('sound[tempo]')
  if (soundNode) {
    const t = parseFloat(soundNode.getAttribute('tempo') || '120')
    if (t > 0) tempo = Math.round(t)
  }

  // Discover all parts / instruments
  const scoreParts = doc.querySelectorAll('score-part')
  const availableTracks: TrackOption[] = []

  scoreParts.forEach((sp) => {
    const partId = sp.getAttribute('id') || ''
    const partName = sp.querySelector('part-name')?.textContent?.trim() || partId
    // Count notes in this part
    const partNode = doc.querySelector(`part[id="${partId}"]`)
    const noteCount = partNode ? partNode.querySelectorAll('note:not(rest)').length : 0
    const isRecommended = /recorder|rec\b|flute|flauta|dulce|soprano|melody|lead|solo/i.test(partName)

    if (noteCount > 0) {
      availableTracks.push({
        id: partId,
        name: `${partName} (${noteCount} notes)`,
        noteCount,
        isRecommended,
      })
    }
  })

  // Select target part
  let chosenPartId = typeof targetPartId === 'string' ? targetPartId : ''
  if (!chosenPartId || !availableTracks.some((t) => t.id === chosenPartId)) {
    const recPart = availableTracks.find((t) => t.isRecommended)
    chosenPartId = recPart ? (recPart.id as string) : (availableTracks[0]?.id as string) || ''
  }

  // Parse notes from target part ONLY
  const targetPartNode = chosenPartId ? doc.querySelector(`part[id="${chosenPartId}"]`) : doc.querySelector('part')
  const measures = targetPartNode ? targetPartNode.querySelectorAll('measure') : doc.querySelectorAll('part measure')

  const stepToMidiBase: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }

  const rawNotes: {
    pitch: string
    midi: number
    startTime: number
    duration: number
    measure: number
  }[] = []

  let divisions = 1
  let currentTime = 0
  let measureIndex = 0

  measures.forEach((measure) => {
    measureIndex++
    const divNode = measure.querySelector('divisions')
    if (divNode) {
      const d = parseFloat(divNode.textContent || '1')
      if (d > 0) divisions = d
    }

    const measureSound = measure.querySelector('sound[tempo]')
    if (measureSound) {
      const t = parseFloat(measureSound.getAttribute('tempo') || '120')
      if (t > 0) tempo = Math.round(t)
    }

    const secondsPerDivision = 60 / (tempo * divisions)
    const notesInMeasure = measure.querySelectorAll('note')

    notesInMeasure.forEach((note) => {
      const isRest = note.querySelector('rest') !== null
      const durationVal = parseFloat(note.querySelector('duration')?.textContent || '0')
      const durationSeconds = durationVal * secondsPerDivision

      if (isRest) {
        currentTime += durationSeconds
        return
      }

      const pitchNode = note.querySelector('pitch')
      if (!pitchNode) {
        currentTime += durationSeconds
        return
      }

      const step = pitchNode.querySelector('step')?.textContent?.trim() || 'C'
      const alter = parseFloat(pitchNode.querySelector('alter')?.textContent || '0')
      const octave = parseInt(pitchNode.querySelector('octave')?.textContent || '4', 10)

      const base = stepToMidiBase[step] ?? 0
      const midi = (octave + 1) * 12 + base + alter
      const isChord = note.querySelector('chord') !== null
      const noteStartTime = isChord ? currentTime - durationSeconds : currentTime

      rawNotes.push({
        pitch: `${step}${alter > 0 ? '#' : alter < 0 ? 'b' : ''}${octave}`,
        midi,
        startTime: Math.max(0, noteStartTime),
        duration: Math.max(0.1, durationSeconds),
        measure: measureIndex,
      })

      if (!isChord) {
        currentTime += durationSeconds
      }
    })
  })

  if (rawNotes.length === 0) {
    throw new Error('No notes found in the selected score part.')
  }

  // Filter chords to monophonic lead line
  const monophonic = filterToMonophonicMelody(rawNotes)

  // Calculate transposition
  const rawMidis = monophonic.map((n) => n.midi)
  const shift = calculateBestTransposition(rawMidis)

  const notes: NoteEvent[] = monophonic.map((n, idx) => {
    const finalMidi = n.midi + shift
    const { letter, solfege } = getDisplayLabels(finalMidi)
    const fingering = getFingering(finalMidi, fingeringSystem)
    const { name, octave } = midiToNoteName(finalMidi)

    return {
      id: `xml-note-${idx}`,
      pitch: `${name}${octave}`,
      midi: finalMidi,
      startTime: n.startTime,
      duration: n.duration,
      letter,
      solfege,
      holes: fingering.holes,
      measureIndex: (n as any).measure,
      noteIndex: idx,
    }
  })

  notes.sort((a, b) => a.startTime - b.startTime)

  return {
    title,
    composer,
    tempo,
    notes,
    availableTracks,
    selectedTrackId: chosenPartId,
    needsTransposition: shift !== 0,
    recommendedShift: shift,
  }
}

/**
 * Parses ABC notation tunes
 */
export function parseAbcNotation(
  abcString: string,
  fingeringSystem: 'baroque' | 'german' = 'baroque'
): ParsedScore {
  const lines = abcString.split('\n')
  let title = 'Imported ABC Tune'
  let tempo = 120
  let defaultLength = 1 / 8
  let key = 'C'

  const notes: NoteEvent[] = []
  let musicBody = ''

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('T:')) {
      title = trimmed.slice(2).trim()
    } else if (trimmed.startsWith('Q:')) {
      const tempoMatch = trimmed.match(/(\d+)/)
      if (tempoMatch) tempo = parseInt(tempoMatch[1], 10)
    } else if (trimmed.startsWith('L:')) {
      const match = trimmed.slice(2).trim().match(/(\d+)\/(\d+)/)
      if (match) {
        defaultLength = parseInt(match[1], 10) / parseInt(match[2], 10)
      }
    } else if (trimmed.startsWith('K:')) {
      key = trimmed.slice(2).trim()
    } else if (!trimmed.startsWith('%') && !trimmed.match(/^[A-Z]:/)) {
      musicBody += ' ' + trimmed
    }
  }

  const tokenRegex = /([_\\^=]*)([A-Ga-g])([,']*)(\d*\/?\d*)/g
  const secondsPerWholeNote = (60 / tempo) * 4
  const baseNoteDuration = secondsPerWholeNote * defaultLength

  let currentTime = 0
  let match: RegExpExecArray | null
  let noteIndex = 0

  const keySharps: Record<string, string[]> = {
    G: ['F'],
    D: ['F', 'C'],
    A: ['F', 'C', 'G'],
    E: ['F', 'C', 'G', 'D'],
    B: ['F', 'C', 'G', 'D', 'A'],
    Em: ['F'],
    Bm: ['F', 'C'],
    'F#m': ['F', 'C', 'G'],
    'C#m': ['F', 'C', 'G', 'D'],
  }

  const sharpsInKey = keySharps[key] || []

  while ((match = tokenRegex.exec(musicBody)) !== null) {
    const accidental = match[1]
    const noteChar = match[2]
    const octaveMod = match[3]
    const durationMod = match[4]

    if (!noteChar) continue

    const isLower = noteChar === noteChar.toLowerCase()
    let octave = isLower ? 5 : 4
    for (const char of octaveMod) {
      if (char === "'") octave++
      if (char === ',') octave--
    }

    const step = noteChar.toUpperCase()
    let alter = 0
    if (accidental.includes('^')) alter = 1
    else if (accidental.includes('_')) alter = -1
    else if (accidental.includes('=')) alter = 0
    else if (sharpsInKey.includes(step)) alter = 1

    const stepBase: Record<string, number> = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11,
    }
    const midi = (octave + 1) * 12 + stepBase[step] + alter

    let mult = 1
    if (durationMod) {
      if (durationMod === '/') mult = 0.5
      else if (durationMod.includes('/')) {
        const parts = durationMod.split('/')
        const num = parts[0] ? parseFloat(parts[0]) : 1
        const den = parts[1] ? parseFloat(parts[1]) : 2
        mult = num / den
      } else {
        mult = parseFloat(durationMod) || 1
      }
    }
    const duration = baseNoteDuration * mult

    const finalMidi = midi
    const { letter, solfege } = getDisplayLabels(finalMidi)
    const fingering = getFingering(finalMidi, fingeringSystem)
    const { name } = midiToNoteName(finalMidi)

    notes.push({
      id: `abc-note-${noteIndex}`,
      pitch: `${name}${octave}`,
      midi: finalMidi,
      startTime: currentTime,
      duration: Math.max(0.1, duration),
      letter,
      solfege,
      holes: fingering.holes,
      noteIndex,
    })

    currentTime += duration
    noteIndex++
  }

  const midis = notes.map((n) => n.midi)
  const shift = calculateBestTransposition(midis)

  const finalNotes = notes.map((n) => {
    const shiftedMidi = n.midi + shift
    const { letter, solfege } = getDisplayLabels(shiftedMidi)
    const fingering = getFingering(shiftedMidi, fingeringSystem)
    const { name, octave } = midiToNoteName(shiftedMidi)
    return {
      ...n,
      midi: shiftedMidi,
      pitch: `${name}${octave}`,
      letter,
      solfege,
      holes: fingering.holes,
    }
  })

  return {
    title,
    tempo,
    notes: finalNotes,
    availableTracks: [{ id: 'abc-1', name: 'ABC Melody', noteCount: finalNotes.length, isRecommended: true }],
    selectedTrackId: 'abc-1',
    keySignature: key,
    needsTransposition: shift !== 0,
    recommendedShift: shift,
  }
}

/**
 * Universal dispatcher to parse any uploaded file
 */
export async function parsePartitureFile(
  file: File,
  fingeringSystem: 'baroque' | 'german' = 'baroque',
  targetTrackId?: string | number
): Promise<ParsedScore> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  const buffer = await file.arrayBuffer()

  if (ext === 'mid' || ext === 'midi') {
    return parseMidiFile(buffer, fingeringSystem, targetTrackId)
  }

  if (ext === 'xml' || ext === 'musicxml' || ext === 'mxml') {
    return parseMusicXML(buffer, fingeringSystem, targetTrackId)
  }

  if (ext === 'abc') {
    const text = new TextDecoder('utf-8').decode(buffer)
    return parseAbcNotation(text, fingeringSystem)
  }

  const text = new TextDecoder('utf-8').decode(buffer)
  if (text.includes('<?xml') || text.includes('<score-partwise') || text.includes('<score-timewise')) {
    return parseMusicXML(text, fingeringSystem, targetTrackId)
  }

  return parseAbcNotation(text, fingeringSystem)
}
