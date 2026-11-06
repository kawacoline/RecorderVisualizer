export type NoteShape = 'capsule' | 'rectangle' | 'circle'
export type ColorTheme = 'cyan' | 'emerald' | 'purple'

export interface VisualizerSkin {
  id: string
  name: string
  shape: NoteShape
  theme: ColorTheme
  primaryColor: string   // Pulgar, Dedo 1, Dedo 2 (Cyan/Azul)
  secondaryColor: string // Dedos 3, 4, 5, 6, 7 (Blanco)
  glowPrimary: string
  glowSecondary: string
}

export const VISUALIZER_SKINS: VisualizerSkin[] = [
  {
    id: 'cyan-capsule',
    name: 'Cápsulas Cian & Blanco (Tutorial)',
    shape: 'capsule',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    secondaryColor: '#ffffff',
    glowPrimary: 'rgba(0, 229, 255, 0.75)',
    glowSecondary: 'rgba(255, 255, 255, 0.75)',
  },
  {
    id: 'cyan-square',
    name: 'Barras Cuadradas',
    shape: 'rectangle',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    secondaryColor: '#ffffff',
    glowPrimary: 'rgba(0, 229, 255, 0.65)',
    glowSecondary: 'rgba(255, 255, 255, 0.65)',
  },
  {
    id: 'circle-rhythm',
    name: 'Círculos / Puntos',
    shape: 'circle',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    secondaryColor: '#ffffff',
    glowPrimary: 'rgba(0, 229, 255, 0.75)',
    glowSecondary: 'rgba(255, 255, 255, 0.75)',
  },
  {
    id: 'emerald-capsule',
    name: 'Esmeralda & Blanco',
    shape: 'capsule',
    theme: 'emerald',
    primaryColor: '#10b981',
    secondaryColor: '#ffffff',
    glowPrimary: 'rgba(16, 185, 129, 0.75)',
    glowSecondary: 'rgba(255, 255, 255, 0.75)',
  },
  {
    id: 'purple-square',
    name: 'Synthwave Púrpura & Blanco',
    shape: 'rectangle',
    theme: 'purple',
    primaryColor: '#c084fc',
    secondaryColor: '#ffffff',
    glowPrimary: 'rgba(192, 132, 252, 0.75)',
    glowSecondary: 'rgba(255, 255, 255, 0.75)',
  },
]

/**
 * Returns the exact color and glow for a given hole:
 * Hole 0 (Pulgar), Hole 1 (Dedo 1), Hole 2 (Dedo 2) -> Cyan / Primary
 * Holes 3, 4, 5, 6, 7 -> Blanco / Secondary
 */
export function getHoleColors(holeIndex: number, skin: VisualizerSkin): { color: string; glow: string } {
  if (holeIndex <= 2) {
    return { color: skin.primaryColor, glow: skin.glowPrimary }
  }
  return { color: skin.secondaryColor, glow: skin.glowSecondary }
}
