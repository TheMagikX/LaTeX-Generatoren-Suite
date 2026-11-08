// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { FileJson, Maximize2, Save, Trash2 } from 'lucide-react'
import { getPresetThumbnailUrl } from '../api/client'
import { Lightbox } from './Lightbox'

interface PresetCardProps {
  generator: string
  fullName: string
  displayName: string
  user: string
  subject: string
  year: string
  hasThumbnail: boolean
  updatedAt?: number
  isActive: boolean
  canOverwrite: boolean
  onLoad: () => void
  onOverwrite: () => void
  onDelete: () => void
}

export function PresetCard({
  generator,
  fullName,
  displayName,
  user,
  subject,
  year,
  hasThumbnail,
  updatedAt,
  isActive,
  canOverwrite,
  onLoad,
  onOverwrite,
  onDelete,
}: PresetCardProps) {
  const [lightbox, setLightbox] = useState(false)
  const src = hasThumbnail ? getPresetThumbnailUrl(generator, fullName, updatedAt) : ''
  // Ergebnis gilt nur fuer die URL, fuer die es gemeldet wurde -> neues Thumbnail zeigt wieder das Skeleton
  const [result, setResult] = useState<{ src: string; status: 'ready' | 'error' } | null>(null)
  const imgState: 'loading' | 'ready' | 'error' = !hasThumbnail ? 'error' : result?.src === src ? result.status : 'loading'

  const showImage = hasThumbnail && imgState !== 'error'

  return (
    <>
      <Lightbox
        open={lightbox && Boolean(src)}
        src={src}
        alt={`Vorschau: ${displayName}`}
        caption={fullName}
        onClose={() => setLightbox(false)}
      />

      <div
        className={`group flex flex-col overflow-hidden rounded-xl border bg-panel transition-all hover:border-primary/50 hover:shadow-md ${
          isActive ? 'border-primary/60' : 'border-line'
        }`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-white">
          <button
            type="button"
            className="absolute inset-0 block h-full w-full cursor-pointer"
            onClick={onLoad}
            title={`„${displayName}" laden`}
          >
            {showImage ? (
              <>
                {imgState === 'loading' && <div className="absolute inset-0 animate-pulse bg-raised" />}
                <img
                  src={src}
                  alt={`Vorschau von ${displayName}`}
                  loading="lazy"
                  onLoad={() => setResult({ src, status: 'ready' })}
                  onError={() => setResult({ src, status: 'error' })}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-raised/40 px-3 text-center text-ghost">
                <FileJson size={28} />
                <span className="text-[10px] leading-tight">Vorschau wird beim nächsten Speichern aktualisiert</span>
              </div>
            )}
          </button>

          {showImage && imgState === 'ready' && (
            <button
              type="button"
              className="absolute right-1.5 top-1.5 rounded-md bg-panel/90 p-1.5 text-ink opacity-0 shadow transition-opacity hover:text-primary group-hover:opacity-100 focus:opacity-100"
              onClick={() => setLightbox(true)}
              aria-label="Vorschau vergrößern"
              title="Vorschau vergrößern"
            >
              <Maximize2 size={14} />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-1.5 p-2.5">
          <span className="truncate text-sm font-medium text-ink" title={fullName}>
            {displayName}
          </span>
          <div className="flex flex-wrap gap-1">
            {user && (
              <span className="rounded-md border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary">
                {user}
              </span>
            )}
            {subject && (
              <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary/90">
                {subject}
              </span>
            )}
            {year && (
              <span className="rounded-md border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary/90">
                {year}
              </span>
            )}
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <button
              type="button"
              className="flex-1 rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/85"
              onClick={onLoad}
            >
              Laden &amp; Anwenden
            </button>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-line p-1.5 text-ghost transition-colors hover:border-amber-500/60 hover:text-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={onOverwrite}
              disabled={!canOverwrite}
              title="Aktuelle Konfiguration hierauf speichern"
              aria-label="Aktuelle Konfiguration hierauf speichern"
            >
              <Save size={14} />
            </button>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-line p-1.5 text-ghost transition-colors hover:border-red-500/60 hover:text-red-500"
              onClick={onDelete}
              title="Löschen"
              aria-label="Löschen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
