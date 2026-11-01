// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Search, X, Check, FileSpreadsheet, Upload, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../../../components/ui'
import type { DatasetItem } from '../../../api/client'

interface DatasetComboboxProps {
  value: string
  datasets: DatasetItem[]
  loading?: boolean
  uploading?: boolean
  isMissingFile?: boolean
  onSelect: (filename: string) => void
  onUploadClick: () => void
}

export const DatasetCombobox: React.FC<DatasetComboboxProps> = ({
  value,
  datasets,
  loading = false,
  uploading = false,
  isMissingFile = false,
  onSelect,
  onUploadClick,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Substring-Suche (case-insensitive)
  const filteredDatasets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return datasets
    return datasets.filter(d => d.filename.toLowerCase().includes(q))
  }, [datasets, searchQuery])

  const selectedDataset = useMemo(() => {
    if (!value) return null
    return datasets.find(d => d.filename.toLowerCase() === value.toLowerCase())
  }, [datasets, value])

  // Click-Outside Handler zum Schließen des Dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Fokus auf das Suchfeld beim Öffnen
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Escape-Taste schließt das Dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleSelect = (filename: string) => {
    onSelect(filename)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative flex-1" onKeyDown={handleKeyDown}>
      {/* Auslöser / Trigger-Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(prev => {
            if (!prev) setSearchQuery('')
            return !prev
          })
        }}
        className={`w-full h-9 px-2.5 bg-panel border rounded-lg text-xs flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer transition-all ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-line hover:border-rim'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FileSpreadsheet size={14} className={value ? 'text-primary shrink-0' : 'text-ghost shrink-0'} />
          {value ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-ink truncate font-medium">{value}</span>
              {selectedDataset && (
                <span className="text-[10px] text-metadata shrink-0 hidden sm:inline">
                  ({selectedDataset.rows_count} Z., {(selectedDataset.size_bytes / 1024).toFixed(1)} KB)
                </span>
              )}
              {isMissingFile && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium shrink-0">
                  <AlertCircle size={11} />
                  <span>Fehlt</span>
                </span>
              )}
            </div>
          ) : (
            <span className="text-ghost truncate">
              {loading ? 'Lade Datensätze...' : '-- CSV-Datei auswählen --'}
            </span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-ghost shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {/* Dropdown-Menü mit Suchzeile */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-panel border border-line rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-w-full">
          {/* Suchzeile oben */}
          <div className="p-2 border-b border-line/60 bg-raised/20 relative">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-ghost pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="CSV-Name durchsuchen (z. B. puls)..."
                className="w-full h-8 pl-8 pr-7 bg-panel border border-line rounded-md text-xs text-ink placeholder:text-ghost focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-ghost hover:text-ink cursor-pointer p-0.5"
                  title="Suche leeren"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Ergebnisliste */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-line/10">
            {/* Option zum Abwählen */}
            {value && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full px-2.5 py-1.5 text-left text-xs text-ghost hover:text-red-500 hover:bg-raised/40 rounded-md transition-colors cursor-pointer flex items-center justify-between"
              >
                <span>(Auswahl aufheben)</span>
              </button>
            )}

            {/* Gefundene Datensätze */}
            {filteredDatasets.length > 0 ? (
              filteredDatasets.map(d => {
                const isSelected = value.toLowerCase() === d.filename.toLowerCase()
                return (
                  <button
                    key={d.filename}
                    type="button"
                    onClick={() => handleSelect(d.filename)}
                    className={`w-full px-2.5 py-2 text-left text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-ink hover:bg-raised/50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <FileSpreadsheet size={13} className={isSelected ? 'text-primary shrink-0' : 'text-ghost shrink-0'} />
                        <span className="font-mono truncate">{d.filename}</span>
                      </div>
                      <span className="text-[11px] text-metadata pl-5">
                        {d.rows_count} Zeilen • {(d.size_bytes / 1024).toFixed(1)} KB
                        {d.columns.length > 0 && ` • Spalten: ${d.columns.slice(0, 3).join(', ')}${d.columns.length > 3 ? '…' : ''}`}
                      </span>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                )
              })
            ) : (
              <div className="p-4 text-center text-xs text-ghost">
                {searchQuery ? (
                  <span>Keine CSV gefunden für &quot;{searchQuery}&quot;</span>
                ) : (
                  <span>Keine Datensätze vorhanden</span>
                )}
              </div>
            )}
          </div>

          {/* Fußleiste mit Upload-Aktion */}
          <div className="p-1.5 bg-raised/30 border-t border-line/60 flex items-center justify-between">
            <span className="text-[10px] text-metadata px-2">
              {filteredDatasets.length} von {datasets.length} Datei(en)
            </span>
            <Button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onUploadClick()
              }}
              disabled={uploading}
              className="h-7 px-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs rounded-md flex items-center gap-1.5 transition-colors"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
              <span>Neue CSV...</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
