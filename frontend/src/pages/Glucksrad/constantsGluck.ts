// SPDX-License-Identifier: AGPL-3.0-or-later

import type { GluckConfig } from './typesGluck'

export const PALETTES: Record<string, { colors: string[], labels: string[] }> = {
  "Pastell": {
    "colors": ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#BAFFC9", "#BAE1FF", "#E8BAFF"],
    "labels": ["Rosa", "Pfirsich", "Gelb", "Mint", "Hellblau", "Flieder"]
  },
  "Kontrast": {
    "colors": ["#E74C3C", "#3498DB", "#2ECC71", "#F39C12", "#9B59B6", "#1ABC9C"],
    "labels": ["Rot", "Blau", "Grün", "Orange", "Lila", "Türkis"]
  },
  "Graustufen": {
    "colors": ["#FFFFFF", "#CCCCCC", "#999999", "#666666", "#333333", "#111111"],
    "labels": ["Weiß", "Hellgrau", "Grau", "Dunkelgrau", "Anthrazit", "Schwarz"]
  },
  "Ampel": {
    "colors": ["#E74C3C", "#F39C12", "#2ECC71", "#E74C3C", "#F39C12", "#2ECC71"],
    "labels": ["Rot", "Orange", "Grün", "Rot", "Orange", "Grün"]
  },
}

export const DEFAULT_CONFIG: GluckConfig = {
  mode: 'standard',
  anzahl: 6,
  seed: 42,
  radius: 3.0,
  sectors: [
    { farbe: "#E74C3C", haeufigkeit: 2, label: "Rot" },
    { farbe: "#3498DB", haeufigkeit: 2, label: "Blau" },
    { farbe: "#2ECC71", haeufigkeit: 2, label: "Grün" },
  ],
  show_labels: false,
  label_fontsize: "\\scriptsize",
  label_mode: "Radial (Standard)",
  show_rim: true,
  show_pins: false,
  center_style: "Punkt",
  arrow_style: "TikZ-Pfeil",
  pointer_pos: "Oben",
  arrow_params: {
    color: "#104861",
    handdrawn: true,
    length: 2.0,
    shaftwidth: 0.2,
    circleradius: 0.2,
    widthtip: 0.4,
    heighttip: 0.65,
    tailwingwidth: 0.25,
    tailheight: 0.4,
    taildrop: 0.15,
    segment_length: 2.0,
    amplitude: 0.15
  },
  font_family: 'Fira'
}

export const LABEL_FONTSIZES = ["\\tiny", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize"]
export const LABEL_MODES = ["Radial (Standard)", "Horizontal", "Tangential", "Außen"]
export const ARROW_STYLES = ["Kein Pfeil", "Bild-Datei (Original)", "TikZ-Pfeil"]
export const POINTER_POSITIONS = ["Oben", "Rechts", "Unten", "Links"]
export const CENTER_STYLES = ["Kein Mittelpunkt", "Punkt", "Schraube", "Lager"]
