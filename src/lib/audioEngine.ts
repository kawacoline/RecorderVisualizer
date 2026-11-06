// Realistic Soprano Recorder Web Audio Synthesizer

export class RecorderAudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private destinationNode: MediaStreamAudioDestinationNode | null = null
  private activeVoices: Map<number, { stop: () => void }> = new Map()
  private volume: number = 0.8
  private isMuted: boolean = false

  public init(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime)

      // Media stream destination for capturing audio into recorded video
      this.destinationNode = this.ctx.createMediaStreamDestination()
      this.masterGain.connect(this.destinationNode)
      this.masterGain.connect(this.ctx.destination)
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    return this.ctx
  }

  public getAudioStreamDestination(): MediaStreamAudioDestinationNode | null {
    if (!this.ctx) this.init()
    return this.destinationNode
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime, 0.02)
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.02)
    }
  }

  public midiToFrequency(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  /**
   * Synthesize a note with realistic recorder acoustics:
   * - Fundamental sine oscillator
   * - 2nd harmonic sine with subtle brightness
   * - Subtle vibrato LFO (4.8 Hz, 4 cents)
   * - Soft breath noise attack ("chiff")
   * - Gentle ADSR envelope
   */
  public playNote(midi: number, duration: number, when: number = 0) {
    if (this.isMuted) return
    const ctx = this.init()
    const startTime = when > 0 ? when : ctx.currentTime
    const stopTime = startTime + duration
    const freq = this.midiToFrequency(midi)

    // Main fundamental oscillator
    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(freq, startTime)

    // Harmonic overtone oscillator (octave up with lower gain)
    const osc2 = ctx.createOscillator()
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(freq * 2, startTime)

    // Vibrato LFO
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.setValueAtTime(4.8, startTime)

    const lfoGain = ctx.createGain()
    // 3 to 5 cents depth
    lfoGain.gain.setValueAtTime(freq * 0.005, startTime)
    lfo.connect(lfoGain)
    lfoGain.connect(osc1.frequency)
    lfoGain.connect(osc2.frequency)

    // Note Envelope (ADSR)
    const noteGain = ctx.createGain()
    noteGain.gain.setValueAtTime(0, startTime)
    // Quick breath attack (30ms)
    noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.03)
    // Steady sustain body
    noteGain.gain.setValueAtTime(0.45, Math.max(startTime + 0.03, stopTime - 0.05))
    // Soft breath decay release (50ms)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, stopTime + 0.05)

    // Harmonic blend gain
    const osc2Gain = ctx.createGain()
    osc2Gain.gain.setValueAtTime(0.12, startTime)

    // Lowpass filter to simulate wooden bore resonance
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(Math.min(10000, freq * 3.5), startTime)
    filter.Q.setValueAtTime(1.2, startTime)

    // Wire up
    osc1.connect(noteGain)
    osc2.connect(osc2Gain)
    osc2Gain.connect(noteGain)
    noteGain.connect(filter)
    if (this.masterGain) {
      filter.connect(this.masterGain)
    }

    // Breath noise burst at attack ("Chiff")
    try {
      const bufferSize = ctx.sampleRate * 0.04 // 40ms noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const noiseFilter = ctx.createBiquadFilter()
      noiseFilter.type = 'bandpass'
      noiseFilter.frequency.setValueAtTime(freq, startTime)
      noiseFilter.Q.setValueAtTime(2.0, startTime)

      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0.08, startTime)
      noiseGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.035)

      noise.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      if (this.masterGain) {
        noiseGain.connect(this.masterGain)
      }

      noise.start(startTime)
      noise.stop(startTime + 0.04)
    } catch {
      // Ignore if noise buffer fails in older browsers
    }

    lfo.start(startTime)
    osc1.start(startTime)
    osc2.start(startTime)

    lfo.stop(stopTime + 0.06)
    osc1.stop(stopTime + 0.06)
    osc2.stop(stopTime + 0.06)

    const voiceKey = Date.now() + Math.random()
    this.activeVoices.set(voiceKey, {
      stop: () => {
        try {
          noteGain.gain.cancelScheduledValues(ctx.currentTime)
          noteGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.01)
          osc1.stop(ctx.currentTime + 0.02)
          osc2.stop(ctx.currentTime + 0.02)
          lfo.stop(ctx.currentTime + 0.02)
        } catch {
          // ignore
        }
      },
    })

    setTimeout(() => {
      this.activeVoices.delete(voiceKey)
    }, (duration + 0.1) * 1000)
  }

  public stopAll() {
    this.activeVoices.forEach((v) => v.stop())
    this.activeVoices.clear()
  }
}

export const audioEngine = new RecorderAudioEngine()

