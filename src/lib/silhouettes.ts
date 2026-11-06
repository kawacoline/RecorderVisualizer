// High-contrast SVG silhouette paths and data for preset songs

export const SILHOUETTES: Record<string, string> = {
  // Reimu Hakurei with Apple (Bad Apple)
  reimu: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- Huge ribbon / bow -->
      <path d="M260,20 C320,10 380,50 370,120 C360,160 310,180 270,160 C290,200 310,250 305,290 C300,280 280,240 270,220 C265,240 255,270 245,290 L240,240 C215,280 180,290 150,270 C120,245 110,200 120,150 C125,115 150,85 180,75 C160,50 140,20 180,10 C210,5 240,15 260,20 Z" />
      <!-- Reimu Head, Side Bangs & Hair Ribbon Tails -->
      <path d="M190,80 C230,70 260,95 265,135 C270,165 255,195 230,205 C215,210 200,205 190,195 C180,210 160,220 145,215 C135,210 135,190 140,180 C130,175 120,160 125,145 C130,125 150,90 190,80 Z" />
      <path d="M260,180 C280,210 295,260 290,320 L280,315 C275,280 260,240 250,210 Z" />
      <!-- Face profile / chin -->
      <path d="M190,120 C205,120 215,130 210,145 C205,155 195,160 190,170 C185,178 175,180 165,175 C155,165 150,150 155,135 Z" />
      <!-- Hands holding apple -->
      <path d="M140,185 C145,180 165,190 160,210 C155,225 130,230 115,215 C105,200 115,185 130,180 Z" />
      <path d="M125,175 C115,170 100,180 95,195 C90,210 105,230 120,225 C135,220 135,195 125,175 Z" />
      <!-- Apple silhouette with stem -->
      <path d="M110,170 C105,155 120,150 125,145 C122,140 125,130 130,125 L132,130 C130,135 128,142 132,146 C145,148 155,160 150,175 C145,190 130,198 120,195 C110,198 95,190 92,175 C90,165 100,155 110,170 Z" />
      <!-- Torso & shrine maiden sleeves -->
      <path d="M165,220 C180,215 220,230 225,270 C230,310 235,360 230,420 L160,420 C155,380 150,330 145,280 C140,245 155,225 165,220 Z" />
      <!-- Trailing ribbon ribbons -->
      <path d="M260,200 C270,250 268,320 265,390 L255,390 C258,330 260,260 252,210 Z" />
    </svg>
  `,

  // Sailor / Hornpipe Silhouette
  sailor: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- Sailor Peaked Hat / Cap -->
      <path d="M130,110 C150,85 240,75 270,105 C295,120 280,140 250,142 L140,140 C120,135 115,120 130,110 Z" />
      <!-- Sailor Pipe & Beard Silhouette -->
      <path d="M160,135 C175,130 230,130 240,150 C245,175 235,210 215,225 C200,235 180,230 170,215 C160,200 155,170 160,135 Z" />
      <!-- Smoking Pipe -->
      <path d="M210,190 L260,205 C265,208 268,220 260,225 C255,228 245,225 248,212 L212,198 Z" />
      <!-- Ship Wheel / Helm Silhouette in background -->
      <circle cx="200" cy="270" r="100" stroke="currentColor" stroke-width="12" fill="none" />
      <circle cx="200" cy="270" r="30" fill="currentColor" />
      <!-- Sailor Torso / Coat -->
      <path d="M120,260 C140,240 260,240 280,260 C300,290 310,360 305,420 L95,420 C90,360 100,290 120,260 Z" />
    </svg>
  `,

  // Greensleeves Renaissance Maiden & Lute / Flute
  greentea: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- Elegant Renaissance hair / veil -->
      <path d="M180,60 C230,50 270,80 265,135 C260,170 270,220 290,260 C265,250 240,200 235,170 C220,185 190,190 175,175 C160,160 155,120 165,85 C170,70 175,65 180,60 Z" />
      <!-- Flute held to lips -->
      <path d="M140,175 L280,220 L275,232 L135,187 Z" />
      <!-- Gown & flowing sleeves -->
      <path d="M160,210 C180,200 240,215 250,260 C265,310 275,370 270,420 L130,420 C125,370 135,310 150,260 Z" />
    </svg>
  `,

  // Beethoven Bust Silhouette
  beethoven: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- Wild Romantic Hair -->
      <path d="M140,90 C160,40 240,30 270,75 C295,110 310,160 290,200 C300,220 290,250 265,245 C255,230 250,200 240,190 C230,210 200,220 180,215 C160,200 150,175 140,150 C120,135 125,105 140,90 Z" />
      <!-- Proud classical profile chin & ascot -->
      <path d="M190,140 C210,135 235,145 230,170 C225,190 205,210 185,210 C175,200 180,180 185,160 Z" />
      <!-- Classical coat collar -->
      <path d="M130,230 C160,210 240,210 270,230 C290,270 300,350 295,420 L105,420 C100,350 110,270 130,230 Z" />
    </svg>
  `,

  // Tetris Russian Architecture / St. Basil Silhouette
  tetris: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- Onion Domes & Towers -->
      <path d="M200,40 C190,65 175,85 185,105 C170,110 160,130 160,150 L240,150 C240,130 230,110 215,105 C225,85 210,65 200,40 Z" />
      <path d="M120,110 C110,130 95,145 105,165 C95,170 85,185 85,205 L155,205 C155,185 145,170 135,165 C145,145 130,130 120,110 Z" />
      <path d="M280,110 C270,130 255,145 265,165 C255,170 245,185 245,205 L315,205 C315,185 305,170 295,165 C305,145 290,130 280,110 Z" />
      <rect x="70" y="205" width="260" height="215" rx="10" />
      <!-- Arch windows -->
      <circle cx="200" cy="270" r="25" fill="#ffffff" />
      <rect x="180" y="270" width="40" height="50" fill="#ffffff" />
    </svg>
  `,

  // Titanic / Ocean Liner Silhouette
  titanic: `
    <svg viewBox="0 0 400 450" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <!-- 4 Smokestacks -->
      <rect x="110" y="110" width="18" height="60" rx="3" transform="rotate(-8 110 110)" />
      <rect x="155" y="110" width="18" height="60" rx="3" transform="rotate(-8 155 110)" />
      <rect x="200" y="110" width="18" height="60" rx="3" transform="rotate(-8 200 110)" />
      <rect x="245" y="110" width="18" height="60" rx="3" transform="rotate(-8 245 110)" />
      <!-- Ship hull & decks -->
      <path d="M60,220 L340,220 C340,220 310,290 270,300 L90,300 C70,290 60,250 60,220 Z" />
      <rect x="90" y="170" width="200" height="50" rx="4" />
      <!-- Water waves -->
      <path d="M40,310 Q80,290 120,310 T200,310 T280,310 T360,310 L360,360 L40,360 Z" />
    </svg>
  `,
}

