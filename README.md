# 🪈 Recorder Studio — Visualizer & Tutorial Generator

An interactive **Soprano Recorder Visualizer and Tutorial Video Generator** designed to produce high-definition **9:16 vertical videos** (1080×1920) optimized for TikTok, YouTube Shorts, and Instagram Reels (as well as 16:9 for YouTube).

Inspired by viral instrument tutorial animations, this web application lets you upload any sheet music or partiture (MIDI, MusicXML, ABC notation) and automatically transforms it into an animated, synchronized recorder fingering tutorial.

---

## ✨ Features

- **8-Hole Soprano Recorder Model (in C)**:
  - Accurate fingering charts for both **Baroque/English** (international standard) and **German** fingering systems.
  - Distinct thumb register hole (open, half/pinched for high notes like $E_5, F_5, G_5$, or closed) plus 7 front tone holes including lower double holes.
  - Real-time hole glow animations with cyan pulses and acoustic impact bursts.

- **Horizontal "Synthesia" Finger-Roll Timeline**:
  - 8 parallel tracks perfectly aligned with each recorder hole.
  - Cyan pill capsules represent active covered holes with duration-proportional lengths.
  - White circular guide markers display open resting finger positions.
  - Right-to-left scrolling into the recorder's vertical axis.

- **Dual-Row Note & Solfège Ticker (Left HUD)**:
  - 10-note scrolling window showing upcoming and past notes.
  - Dual notation: **Letter pitch** (`E`, `F#`, `G`, `E'`, `D'`) and **Do-Re-Mi Solfège** (`Mi`, `Fa#`, `Sol`, `Mi'`, `Ré'`).
  - Animated 3D-styled indicator needle that smoothly pivots between rows to point to the active note.
  - Glowing active note badge.

- **Universal Partiture & Sheet Music Ingestion**:
  - **Standard MIDI (`.mid`, `.midi`)**: Automatically extracts melody tracks, tempo changes, and note timings.
  - **MusicXML (`.xml`, `.musicxml`, `.mxml`)**: Reads measures, divisions, pitches, accidentals, and unzips compressed `.mxml` scores.
  - **ABC Notation (`.abc`)**: Paste or upload ABC notation tunes.
  - **Smart Auto-Transposition**: Detects if uploaded music lies outside soprano recorder range ($C_4$ to $D_6$) and transposes it to the optimal octave and key.

- **Full Preset Songs Included**:
  - **Bad Apple!!** (Full song arrangement by ZUN / Alstroemeria Records)
  - **The Sailor's Hornpipe / Rake Hornpipe** (Complete traditional sea shanty hornpipe dance)
  - **Greensleeves** (Complete 16th-century English ballad & variations)
  - **Beethoven's Ode to Joy** (Complete Symphony No. 9 theme)

- **Acoustic Woodwind Synthesizer**:
  - Built-in Web Audio engine with realistic soprano recorder harmonics, attack chiff/breath noise, gentle envelope, and natural vibrato.
  - Zero external soundfont dependencies required.

- **1-Click High-Definition Video Export**:
  - Directly capture the 60 FPS HTML5 canvas and synthesized audio using `MediaRecorder`.
  - Download high-bitrate ready-to-post 9:16 vertical videos directly in your browser.

- **Branding & Customization**:
  - Customizable song titles, subtitles, tempo labels (e.g. `"SLOWED"` vs `"STANDARD TEMPO"`), and call-to-actions.
  - Silhouette artwork presets (Reimu Hakurei, Sailor, Renaissance Maiden, Beethoven) or upload your own custom PNG/SVG artwork.
  - Toggle between **9:16 Vertical (Shorts/TikTok)** and **16:9 Landscape (YouTube)**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm, pnpm, or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/kawacoline/RecorderVisualizer.git
cd RecorderVisualizer

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```

---

## 🎼 Supported Formats

| Format | Extensions | Description |
|---|---|---|
| **MIDI** | `.mid`, `.midi` | Standard MIDI files exported from DAWs, MuseScore, or Synthesia |
| **MusicXML** | `.xml`, `.musicxml`, `.mxml` | Sheet music XML from Finale, Sibelius, MuseScore, or Flat.io |
| **ABC** | `.abc`, raw text | Compact text-based musical notation |

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4
- **Graphics**: HTML5 2D Canvas with custom 60 FPS animation loop
- **Audio**: Web Audio API (Synthesized Woodwind Physics Engine)
- **Score Parsing**: `@tonejs/midi`, `jszip`, custom XML/ABC parsers
- **Icons**: Lucide React

---

## 📄 License

MIT License. Free to use for personal, educational, and commercial recorder tutorials!
