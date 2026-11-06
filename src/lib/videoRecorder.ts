// Video export utility using MediaRecorder to capture Canvas 60 FPS + Web Audio

export class CanvasVideoRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private isRecording: boolean = false

  public isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined'
  }

  public startRecording(
    canvas: HTMLCanvasElement,
    audioStreamDestination: MediaStreamAudioDestinationNode | null
  ): boolean {
    if (!this.isSupported()) {
      alert('MediaRecorder is not supported in this browser.')
      return false
    }

    this.recordedChunks = []

    try {
      const canvasStream = canvas.captureStream(60)
      const combinedStream = new MediaStream()

      // Add video tracks
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track))

      // Add audio tracks if available
      if (audioStreamDestination && audioStreamDestination.stream.getAudioTracks().length > 0) {
        audioStreamDestination.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track))
      }

      // Check supported mime types
      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4'
        }
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality 1080p
      })

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data)
        }
      }

      this.mediaRecorder.start(100) // Collect chunks every 100ms
      this.isRecording = true
      return true
    } catch (err) {
      console.error('Failed to start video recording:', err)
      return false
    }
  }

  public stopRecording(filename: string = 'recorder-tutorial.webm'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not initialized'))
        return
      }

      this.mediaRecorder.onstop = () => {
        this.isRecording = false
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm',
        })

        // Trigger automatic download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)

        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  public get recording(): boolean {
    return this.isRecording
  }
}

export const videoRecorder = new CanvasVideoRecorder()
