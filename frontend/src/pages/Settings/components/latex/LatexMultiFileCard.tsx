// SPDX-License-Identifier: AGPL-3.0-or-later

import { useRef, type Dispatch, type SetStateAction } from 'react'
import {
  Upload, FolderOpen, Check, CheckCircle2, AlertCircle, Plus, Trash2
} from 'lucide-react'
import type {
  AdditionalItemStatus,
  SuggestedAdditional,
  LatexFeedbackMessage,
} from '../../types'
import { LatexFeedbackAlert } from './LatexFeedbackAlert'

interface LatexMultiFileCardProps {
  title: string
  description: string
  uploadButtonText: string
  uploadButtonTooltip: string
  addRowButtonText: string
  suggestionsLabel: string
  emptyStateText: string
  placeholder: string
  browseButtonTooltip: string
  countSuffix: string
  saveButtonText: string
  sectionKey: 'sty' | 'additionals'
  inputs: string[]
  setInputs: Dispatch<SetStateAction<string[]>>
  status: AdditionalItemStatus[]
  suggested: SuggestedAdditional[]
  browsingIndex: number | null
  isSaving: boolean
  isUploading: boolean
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  onBrowse: (index: number) => void
  onSave: (updatedList?: string[]) => void
  onUpload: (file: File) => void
  feedback: LatexFeedbackMessage | null
}

export function LatexMultiFileCard({
  title,
  description,
  uploadButtonText,
  uploadButtonTooltip,
  addRowButtonText,
  suggestionsLabel,
  emptyStateText,
  placeholder,
  browseButtonTooltip,
  countSuffix,
  saveButtonText,
  sectionKey,
  inputs,
  setInputs,
  status,
  suggested,
  browsingIndex,
  isSaving,
  isUploading,
  onAddRow,
  onRemoveRow,
  onBrowse,
  onSave,
  onUpload,
  feedback,
}: LatexMultiFileCardProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="p-4 rounded-xl border border-line bg-raised/30 flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-xs text-ink">{title}</div>
          <div className="text-[11px] text-muted">{description}</div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
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
            className="px-2.5 py-1 rounded-lg bg-primary text-white hover:opacity-90 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-opacity disabled:opacity-50"
            title={uploadButtonTooltip}
          >
            <Upload size={13} className={isUploading ? 'animate-bounce' : ''} />
            <span>{isUploading ? 'Lädt...' : uploadButtonText}</span>
          </button>
          <button
            type="button"
            onClick={onAddRow}
            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>{addRowButtonText}</span>
          </button>
        </div>
      </div>

      {/* Quick helper for discovered local files */}
      {suggested.length > 0 && (
        <div className="p-2.5 rounded-lg bg-raised/60 border border-rim flex flex-wrap items-center gap-2 text-[11px] text-muted">
          <span>{suggestionsLabel}</span>
          {suggested.map(item => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                const updated = [...inputs.filter(p => p.trim() !== ''), item.path]
                setInputs(updated)
                onSave(updated)
              }}
              className="px-2 py-0.5 rounded bg-panel hover:bg-overlay border border-rim text-primary font-mono text-[10px] cursor-pointer transition-colors flex items-center gap-1"
            >
              <Plus size={10} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Dynamic List */}
      {inputs.length === 0 ? (
        <div className="p-3.5 rounded-lg border border-dashed border-line text-center text-xs text-muted">
          {emptyStateText}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {inputs.map((pathVal, idx) => {
            const isBrowsingThis = browsingIndex === idx
            const statusItem = status.find(s => s.path === pathVal)
            const exists = statusItem ? statusItem.exists : pathVal.trim() !== ''

            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={pathVal}
                    onChange={e => {
                      const val = e.target.value
                      setInputs(prev => {
                        const next = [...prev]
                        next[idx] = val
                        return next
                      })
                    }}
                    placeholder={placeholder}
                    className="w-full bg-raised/70 border border-line rounded-xl px-3 py-1.5 text-xs font-mono text-ink placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 transition-colors pr-7"
                  />
                  {pathVal.trim() !== '' && (
                    <div
                      className="absolute right-2.5 top-1/2 -translate-y-1/2"
                      title={exists ? 'Datei existiert' : 'Datei nicht gefunden'}
                    >
                      {exists ? (
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={12} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onBrowse(idx)}
                  disabled={isBrowsingThis}
                  className="px-3 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 font-medium text-xs shadow-xs transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  title={browseButtonTooltip}
                >
                  <FolderOpen size={13} className={isBrowsingThis ? 'animate-pulse' : ''} />
                  <span>{isBrowsingThis ? 'Öffnet...' : 'Durchsuchen...'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRemoveRow(idx)}
                  className="p-1.5 rounded-xl bg-raised border border-rim text-muted hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer shrink-0"
                  title="Zeile entfernen"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {inputs.length > 0 && (
        <div className="flex items-center justify-between pt-2 border-t border-line/60">
          <span className="text-[11px] text-muted">
            {inputs.length} {countSuffix}
          </span>
          <button
            type="button"
            onClick={() => onSave()}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-xl bg-primary text-white hover:opacity-90 font-medium text-xs shadow-xs transition-opacity flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Check size={13} />
            <span>{isSaving ? 'Speichern...' : saveButtonText}</span>
          </button>
        </div>
      )}

      <LatexFeedbackAlert feedback={feedback} section={sectionKey} />
    </div>
  )
}
