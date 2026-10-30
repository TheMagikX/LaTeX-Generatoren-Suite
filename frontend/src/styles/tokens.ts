// SPDX-License-Identifier: AGPL-3.0-or-later

/**
 * Style tokens — composite Tailwind class strings for recurring UI patterns.
 *
 * Individual color/spacing primitives live in src/index.css @theme.
 * This file handles *combinations* of those primitives that repeat often.
 *
 * Usage:
 *   import { s } from '../styles/tokens'
 *   <div className={s.editorPanel}>…</div>
 *   <Button variant="secondary">…</Button>   ← variant prop, no import needed
 */

export const s = {
  // ── Page layout ─────────────────────────────────────────────────────────────

  /** Left settings panel (holds Tabs + form content) */
  editorPanel:
    'flex-1 flex flex-col min-w-0 bg-panel border border-line rounded-2xl overflow-hidden shadow-2xl',

  /** Right preview column card */
  previewPanel:
    'flex-1 flex flex-col bg-panel border border-line rounded-2xl relative shadow-2xl overflow-hidden',

  // ── Inline surfaces ─────────────────────────────────────────────────────────

  /** Recessed sub-section box — use for grouped form fields */
  box:
    'bg-raised/30 rounded-xl border border-line/50',

  /** Same with standard padding */
  boxP:
    'bg-raised/30 p-4 rounded-xl border border-line/50',

  /** Compact version */
  boxSm:
    'bg-raised/20 p-3 rounded-xl border border-line/50',

  /** Row inside a box — flex, centred, with padding */
  boxRow:
    'flex items-center gap-4 bg-raised/30 p-4 rounded-xl border border-line/50',

  /** Compact row */
  boxRowSm:
    'flex items-center justify-between bg-raised/20 p-3 rounded-xl border border-line/50',

  // ── Segmented controls ───────────────────────────────────────────────────────

  /** Track that wraps segment buttons */
  segTrack:
    'flex gap-1 p-1 bg-panel rounded-lg border border-line',

  /** Active segment */
  segOn:
    'flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-raised text-primary shadow-sm cursor-pointer transition-all',

  /** Inactive segment */
  segOff:
    'flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-ghost hover:text-ink hover:bg-raised cursor-pointer transition-all',

  // ── Misc ────────────────────────────────────────────────────────────────────

  /** Small icon-action button (e.g. move/edit inside a list row) */
  iconBtn:
    'p-2.5 rounded-lg bg-raised hover:bg-overlay text-muted hover:text-primary transition-all border border-rim',

  /** "bis" / "to" separator between range inputs */
  rangeSep:
    'text-ghost text-xs font-bold uppercase',

  /** <hr /> divider inside forms */
  hr:
    'border-line/50',

  // ── Typography (Semantic) ──────────────────────────────────────────────────

  /** Replaces repetitive label classes (11px, Display Font, Ghost color) */
  caption: 'text-caption',

  /** Standard section header style for sidebars */
  sectionLabel: 'text-section-label',

  /** Metadata, IDs, and technical property labels */
  metadata: 'text-metadata',

  /** High-density monospaced text for values */
  monoXs: 'text-mono-xs',

  // ── Layout helpers ─────────────────────────────────────────────────────────

  /** Replaces recurring flex-between rows for labels/values */
  labelRow: 'flex-label-row',
} as const
