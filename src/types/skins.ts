export type NoteShape = 'capsule' | 'rectangle' | 'circle'
export type ColorTheme = 'cyan' | 'emerald' | 'purple' | 'amber'

export interface VisualizerSkin {
  id: string
  name: string
  shape: NoteShape
  theme: ColorTheme
  primaryColor: string
  glowColor: string
  thumbColor: string
}

export const VISUALIZER_SKINS: VisualizerSkin[] = [
  {
    id: 'cyan-capsule',
    name: 'Cápsula Cian (Tutorial)',
    shape: 'capsule',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.75)',
    thumbColor: '#f59e0b',
  },
  {
    id: 'cyan-square',
    name: 'Barras Cuadradas',
    shape: 'rectangle',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.6)',
    thumbColor: '#f59e0b',
  },
  {
    id: 'emerald-capsule',
    name: 'Esmeralda Neón',
    shape: 'capsule',
    theme: 'emerald',
    primaryColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.75)',
    thumbColor: '#f59e0b',
  },
  {
    id: 'purple-square',
    name: 'Synthwave Púrpura',
    shape: 'rectangle',
    theme: 'purple',
    primaryColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.75)',
    thumbColor: '#f59e0b',
  },
  {
    id: 'circle-rhythm',
    name: 'Círculos / Beats',
    shape: 'circle',
    theme: 'cyan',
    primaryColor: '#00e5ff',
    glowColor: 'rgba(0, 229, 255, 0.75)',
    thumbColor: '#f59e0b',
  },
]
