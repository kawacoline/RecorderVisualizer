export type NoteShape = 'capsule' | 'rectangle' | 'circle'
export type ColorTheme = 'cyan' | 'emerald' | 'purple'

export interface VisualizerSkin {
  id: string
  name: string
  shape: NoteShape
  theme: ColorTheme
  redColor: string       // Pulgar (0) y Dedo 7 (Rojo)
  cyanColor: string      // Dedos 1, 2, 3 (Cian)
  whiteColor: string     // Dedos 4, 5, 6 (Blanco)
  glowRed: string
  glowCyan: string
  glowWhite: string
}

export const VISUALIZER_SKINS: VisualizerSkin[] = [
  {
    id: 'cyan-capsule',
    name: 'Cápsulas (Rojo, Cian, Blanco)',
    shape: 'capsule',
    theme: 'cyan',
    redColor: '#ff3344',
    cyanColor: '#00e5ff',
    whiteColor: '#ffffff',
    glowRed: 'rgba(255, 51, 68, 0.8)',
    glowCyan: 'rgba(0, 229, 255, 0.8)',
    glowWhite: 'rgba(255, 255, 255, 0.8)',
  },
  {
    id: 'cyan-square',
    name: 'Barras Cuadradas',
    shape: 'rectangle',
    theme: 'cyan',
    redColor: '#ff3344',
    cyanColor: '#00e5ff',
    whiteColor: '#ffffff',
    glowRed: 'rgba(255, 51, 68, 0.65)',
    glowCyan: 'rgba(0, 229, 255, 0.65)',
    glowWhite: 'rgba(255, 255, 255, 0.65)',
  },
  {
    id: 'circle-rhythm',
    name: 'Círculos / Puntos',
    shape: 'circle',
    theme: 'cyan',
    redColor: '#ff3344',
    cyanColor: '#00e5ff',
    whiteColor: '#ffffff',
    glowRed: 'rgba(255, 51, 68, 0.8)',
    glowCyan: 'rgba(0, 229, 255, 0.8)',
    glowWhite: 'rgba(255, 255, 255, 0.8)',
  },
  {
    id: 'emerald-capsule',
    name: 'Esmeralda, Blanco & Rojo',
    shape: 'capsule',
    theme: 'emerald',
    redColor: '#ff3344',
    cyanColor: '#10b981',
    whiteColor: '#ffffff',
    glowRed: 'rgba(255, 51, 68, 0.8)',
    glowCyan: 'rgba(16, 185, 129, 0.8)',
    glowWhite: 'rgba(255, 255, 255, 0.8)',
  },
  {
    id: 'purple-square',
    name: 'Synthwave Púrpura, Blanco & Rojo',
    shape: 'rectangle',
    theme: 'purple',
    redColor: '#ff2a6d',
    cyanColor: '#c084fc',
    whiteColor: '#ffffff',
    glowRed: 'rgba(255, 42, 109, 0.8)',
    glowCyan: 'rgba(192, 132, 252, 0.8)',
    glowWhite: 'rgba(255, 255, 255, 0.8)',
  },
]

/**
 * Returns the exact color and glow for a given hole:
 * Hole 0 (Pulgar) -> Rojo
 * Holes 1, 2, 3 (Dedos 1, 2, 3) -> Cian
 * Holes 4, 5, 6 (Dedos 4, 5, 6) -> Blanco
 * Hole 7 (Dedo 7) -> Rojo
 */
export function getHoleColors(
  holeIndex: number,
  skin: VisualizerSkin
): { color: string; glow: string; textContrast: string } {
  // Pulgar (0) y Dedo 7 -> Rojo
  if (holeIndex === 0 || holeIndex === 7) {
    return {
      color: skin.redColor,
      glow: skin.glowRed,
      textContrast: '#ffffff',
    }
  }

  // Dedos 1, 2, 3 -> Cian
  if (holeIndex >= 1 && holeIndex <= 3) {
    return {
      color: skin.cyanColor,
      glow: skin.glowCyan,
      textContrast: '#000000',
    }
  }

  // Dedos 4, 5, 6 -> Blanco
  return {
    color: skin.whiteColor,
    glow: skin.glowWhite,
    textContrast: '#000000',
  }
}
