// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ThemeItem } from '../types'

export const THEMES: ThemeItem[] = [
  {
    id: 'dark',
    label: 'Dunkel',
    desc: 'Warmes Dunkelbraun',
    colors: {
      canvas: '#0c0b09',
      panel: '#141210',
      raised: '#1d1a15',
      border: '#2d2820',
      ink: '#efe9dc',
      muted: '#968a77',
      primary: '#f0a030',
    },
  },
  {
    id: 'light',
    label: 'Hell',
    desc: 'Modernes Weiß',
    colors: {
      canvas: '#f8f7f5',
      panel: '#ffffff',
      raised: '#f0ece7',
      border: '#ddd8d0',
      ink: '#1a1714',
      muted: '#6b5f50',
      primary: '#d97706',
    },
  },
  {
    id: 'himmel',
    label: 'Himmel',
    desc: 'Klares Hellblau',
    colors: {
      canvas: '#f0f4f9',
      panel: '#ffffff',
      raised: '#e4ebf5',
      border: '#c5d2e3',
      ink: '#0f1a2e',
      muted: '#3d5478',
      primary: '#2563eb',
    },
  },
  {
    id: 'blue',
    label: 'Nacht',
    desc: 'Dunkles Blau-Violett',
    colors: {
      canvas: '#0a0b13',
      panel: '#0f1121',
      raised: '#171a2e',
      border: '#252845',
      ink: '#e2e4f5',
      muted: '#7880a8',
      primary: '#7c6af6',
    },
  },
  {
    id: 'wald',
    label: 'Wald',
    desc: 'Dunkles Smaragdgrün',
    colors: {
      canvas: '#0a0e0b',
      panel: '#0f1510',
      raised: '#162019',
      border: '#243328',
      ink: '#d8ede0',
      muted: '#6a8f72',
      primary: '#10b981',
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    desc: 'Arktisches Blau-Grau',
    colors: {
      canvas: '#242933',
      panel: '#2e3440',
      raised: '#3b4252',
      border: '#353c4a',
      ink: '#eceff4',
      muted: '#8fa5c0',
      primary: '#88c0d0',
    },
  },
  {
    id: 'sepia',
    label: 'Sepia',
    desc: 'Klassisches Sepia',
    colors: {
      // Der Hintergrund (leicht vergilbtes Papier)
      canvas: '#f4ecd8',
      // Etwas dunkler für Karten oder Seitenleisten
      panel: '#efe4c9',
      // Abgehobene Elemente
      raised: '#e5d9b6',
      // Sanfter Kontrast für Linien
      border: '#d7c4a3',
      // Fast Schwarz, aber mit Braunstich (Tinte)
      ink: '#433422',
      // Ausgebleichte Schrift / Sekundärinfos
      muted: '#8c7e6a',
      // Ein warmer Akzentton (gedämpftes Orange/Gold)
      primary: '#b26e33',
    },
  },
  {
    id: 'solarized',
    label: 'Solarized',
    desc: 'Klassisches Dunkel-Teal',
    colors: {
      canvas: '#002b36',
      panel: '#073642',
      raised: '#0d404e',
      border: '#164f5e',
      ink: '#fdf6e3',
      muted: '#839496',
      primary: '#268bd2',
    },
  },
  {
    id: 'tafel',
    label: 'Schultafel',
    desc: 'Tafelgrün & Kreidestaub',
    colors: {
      canvas: '#131c17',
      panel: '#19251f',
      raised: '#22322a',
      border: '#2d4237',
      ink: '#f4f6ea',
      muted: '#94ad9f',
      primary: '#eab308',
    },
  },
  {
    id: 'space',
    label: 'Deep Space',
    desc: 'Kosmisches Blau & Cyan',
    colors: {
      canvas: '#060811',
      panel: '#0c1020',
      raised: '#131930',
      border: '#1e294b',
      ink: '#e2eeff',
      muted: '#7b8fb5',
      primary: '#00f0ff',
    },
  },
  {
    id: 'rose',
    label: 'Rosé',
    desc: 'Pastell-Pink & Himbeer',
    colors: {
      canvas: '#fce7f3',
      panel: '#ffffff',
      raised: '#fae1ef',
      border: '#f2bfde',
      ink: '#3b1429',
      muted: '#8d486e',
      primary: '#db2777',
    },
  },
  {
    id: 'onyx',
    label: 'Onyx',
    desc: 'Minimalistisches Schwarz',
    colors: {
      canvas: '#09090b',
      panel: '#121215',
      raised: '#18181c',
      border: '#27272e',
      ink: '#f4f4f6',
      muted: '#9ca3af',
      primary: '#e4e4e7',
    },
  },
]
