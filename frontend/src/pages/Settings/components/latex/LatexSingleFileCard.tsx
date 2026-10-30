// SPDX-License-Identifier: AGPL-3.0-or-later

import { useRef } from 'react'
import {
  Upload, FolderOpen, Check, RotateCcw, CheckCircle2, AlertCircle
} from 'lucide-react'
import type { CommandsStatus, LatexFeedbackMessage } from '../../types'
import { LatexFeedbackAlert } from './LatexFeedbackAlert'

interface LatexSingleFileCardProps {
  title: string
  description: string
  activeCustomBadgeText: string
  defaultBadgeText: string
  placeholder: string
  uploadButtonTooltip: string
  browseButtonTooltip: string
  resetButtonTooltip: string
  fallbackStatusText: string
  sectionKey: 'commands' | 'packages'
  status: CommandsStatus | null
  inputPath: string
  setInputPath: (path: string) => void
  isBrowsing: boolean
  isSaving: boolean
  isUploading: boolean
  onSave: (pathOverride?: string | null) => void
  onBrowse: () => void
  onReset: () => void
  onUpload: (file: File) => void
  feedback: LatexFeedbackMessage | null
}

export function LatexSingleFileCard({
  title,
  description,
  activeCustomBadgeText,
  defaultBadgeText,
  placeholder,
  uploadButtonTooltip,
  browseButtonTooltip,
  resetButtonTooltip,
  fallbackStatusText,
  sectionKey,
  status,
  inputPath,
  setInputPath,
  isBrowsing,
  isSaving,
  isUploading,
  onSave,
  onBrowse,
  onReset,
  onUpload,
  feedback,
}: LatexSingleFileCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-4 rounded-xl border border-line bg-raised/30 flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-xs text-ink">{title}</div>
          <div className="text-[11px] text-muted">{description}</div>
        </div>
        {status?.is_custom ? (
          <span className="self-start sm:self-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold">
            {activeCustomBadgeText}
          </span>
        ) : (
          <span className="self-start sm:self-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-raised text-muted border border-rim">
            {defaultBadgeText}
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={inputPath}
          onChange={e => setInputPath(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-raised/70 border border-line rounded-xl px-3 py-1.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept=".tex,.sty"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) onUpload(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 font-medium text-xs shadow-xs transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={uploadButtonTooltip}
          >
            <Upload size={13} className={isUploading ? 'animate-bounce' : ''} />
            <span>{isUploading ? 'Lädt...' : 'Datei wählen'}</span>
          </button>

          <button
            type="button"
            onClick={onBrowse}
            disabled={isBrowsing}
            className="px-2.5 py-1.5 rounded-xl bg-raised border border-rim text-ink hover:bg-overlay font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title={browseButtonTooltip}
          >
            <FolderOpen size={13} className={isBrowsing ? 'animate-pulse' : ''} />
            <span>{isBrowsing ? 'Explorer...' : 'Explorer'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSave()}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-xl bg-raised border border-rim text-ink hover:bg-overlay font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check size={13} />
            <span>{isSaving ? 'Speichern...' : 'Speichern'}</span>
          </button>

          {(status?.custom_path || inputPath) && (
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving}
              className="p-1.5 rounded-xl bg-raised border border-rim text-muted hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer"
              title={resetButtonTooltip}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Quick helper for existing file in project */}
      {status?.suggested_local_path && status.custom_path !== status.suggested_local_path && (
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span>Gefundene lokale Datei:</span>
          <button
            type="button"
            onClick={() => {
              setInputPath(status.suggested_local_path!)
              onSave(status.suggested_local_path)
            }}
            className="text-primary hover:underline font-mono cursor-pointer"
          >
            {status.suggested_local_path} (Jetzt verknüpfen)
          </button>
        </div>
      )}

      <div className="p-2 rounded-lg bg-raised/40 border border-rim text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-muted">
        <div className="flex items-center gap-1.5 truncate">
          <span className="font-semibold text-ink">Eingebunden:</span>
          <span className="font-mono text-ink truncate max-w-md">{status?.active_file || 'Lädt...'}</span>
        </div>
        {status?.is_custom ? (
          <span className="text-emerald-500 flex items-center gap-1 font-medium shrink-0">
            <CheckCircle2 size={12} />
            Aktiv
          </span>
        ) : status?.custom_path && !status.file_exists ? (
          <span className="text-red-500 flex items-center gap-1 font-medium shrink-0">
            <AlertCircle size={12} />
            {fallbackStatusText}
          </span>
        ) : (
          <span className="text-muted font-mono shrink-0">
            {fallbackStatusText === 'Nicht gefunden (Dummy aktiv)' ? 'Dummy aktiv' : 'Standard aktiv'}
          </span>
        )}
      </div>

      <LatexFeedbackAlert feedback={feedback} section={sectionKey} />
    </div>
  )
}
