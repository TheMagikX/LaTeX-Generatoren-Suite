// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listPresets, savePreset, deletePreset, downloadPresetFolder } from '../api/client'
import { Button, Input, ConfirmDialog } from './ui'
import { ChevronDown, Download, FileJson, FolderPlus, RotateCw, Save, Trash2, Search, Check, FilterX } from 'lucide-react'

interface PresetManagerProps<TConfig> {
  generator: string
  currentConfig: TConfig
  onLoad: (config: TConfig) => void
}

const ALL_USERS = 'Alle Nutzer'
const ALL_SUBJECTS = 'Alle Fächer'
const ALL_YEARS = 'Alle Jahrgänge'
const NO_SUBJECT = '(Kein Fach)'
const NO_YEAR = '(Keine Klasse)'
const NEW_ENTRY = '__new__'

const selectClass =
  'w-full rounded-lg border border-rim bg-panel px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-canvas/50'

interface PresetManagerFormState {
  saveUser: string
  newUserInput: string
  saveSubject: string
  newSubjectInput: string
  saveYear: string
  newYearInput: string
  saveName: string
  activePresetName: string | null
  selectedUser?: string
  selectedSubject?: string
  selectedYear?: string
  searchTerm?: string
}

export interface ParsedPresetPath {
  folder: string
  name: string
  user: string
  subject: string
  year: string
  extraFolders: string[]
}

function splitPresetName(name: string) {
  if (name.includes(' / ')) {
    const lastSep = name.lastIndexOf(' / ')
    return {
      folder: name.slice(0, lastSep),
      name: name.slice(lastSep + 3)
    }
  }

  return { folder: '', name }
}

export function parsePresetPath(fullName: string): ParsedPresetPath {
  const { folder, name } = splitPresetName(fullName)
  const parts = folder ? folder.split(' / ').map(p => p.trim()).filter(Boolean) : []

  return {
    folder,
    name,
    user: parts[0] || '',
    subject: parts[1] || '',
    year: parts[2] || '',
    extraFolders: parts.slice(3)
  }
}

function PresetPathPreview({ presetPath, accent = false }: { presetPath: string; accent?: boolean }) {
  const parsed = parsePresetPath(presetPath)
  const folders = parsed.folder ? parsed.folder.split(' / ') : []

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 flex-wrap">
      <span className={`${accent ? 'text-primary font-medium' : 'text-ink'} truncate`}>{parsed.name}</span>
      {folders.map((folder, index) => {
        const isUserTag = index === 0
        return (
          <span
            key={`${folder}-${index}`}
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] leading-none ${
              isUserTag
                ? 'border border-primary/30 bg-primary/15 font-bold text-primary'
                : 'border border-primary/20 bg-primary/10 font-medium text-primary/90'
            }`}
          >
            {folder}
          </span>
        )
      })}
    </span>
  )
}

function loadFormState(generator: string): PresetManagerFormState {
  const fallbackUser = (() => {
    try {
      return window.localStorage.getItem('preset-manager:selected-user') || 'USER'
    } catch {
      return 'USER'
    }
  })()

  const defaultUser = fallbackUser !== ALL_USERS ? fallbackUser : 'USER'

  const fallback: PresetManagerFormState = {
    saveUser: defaultUser,
    newUserInput: '',
    saveSubject: '',
    newSubjectInput: '',
    saveYear: '',
    newYearInput: '',
    saveName: '',
    activePresetName: null,
    selectedUser: fallbackUser,
    selectedSubject: ALL_SUBJECTS,
    selectedYear: ALL_YEARS,
    searchTerm: ''
  }

  try {
    const raw = window.localStorage.getItem(`preset-manager:${generator}`)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<PresetManagerFormState>
    return {
      saveUser: typeof parsed.saveUser === 'string' ? parsed.saveUser : fallback.saveUser,
      newUserInput: typeof parsed.newUserInput === 'string' ? parsed.newUserInput : fallback.newUserInput,
      saveSubject: typeof parsed.saveSubject === 'string' ? parsed.saveSubject : fallback.saveSubject,
      newSubjectInput: typeof parsed.newSubjectInput === 'string' ? parsed.newSubjectInput : fallback.newSubjectInput,
      saveYear: typeof parsed.saveYear === 'string' ? parsed.saveYear : fallback.saveYear,
      newYearInput: typeof parsed.newYearInput === 'string' ? parsed.newYearInput : fallback.newYearInput,
      saveName: typeof parsed.saveName === 'string' ? parsed.saveName : fallback.saveName,
      activePresetName: typeof parsed.activePresetName === 'string' ? parsed.activePresetName : fallback.activePresetName,
      selectedUser: typeof parsed.selectedUser === 'string' ? parsed.selectedUser : fallback.selectedUser,
      selectedSubject: typeof parsed.selectedSubject === 'string' ? parsed.selectedSubject : fallback.selectedSubject,
      selectedYear: typeof parsed.selectedYear === 'string' ? parsed.selectedYear : fallback.selectedYear,
      searchTerm: typeof parsed.searchTerm === 'string' ? parsed.searchTerm : fallback.searchTerm
    }
  } catch {
    return fallback
  }
}

export const PresetManager = <TConfig,>({ generator, currentConfig, onLoad }: PresetManagerProps<TConfig>) => {
  const queryClient = useQueryClient()
  const initialFormState = useMemo(() => loadFormState(generator), [generator])

  const [searchTerm, setSearch] = useState(initialFormState.searchTerm || '')
  const [selectedUser, setSelectedUser] = useState(initialFormState.selectedUser || ALL_USERS)
  const [selectedSubject, setSelectedSubject] = useState(initialFormState.selectedSubject || ALL_SUBJECTS)
  const [selectedYear, setSelectedYear] = useState(initialFormState.selectedYear || ALL_YEARS)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(true)

  // Save-form state (3 separate tiers + name)
  const [saveUser, setSaveUser] = useState(initialFormState.saveUser || 'USER')
  const [newUserInput, setNewUserInput] = useState(initialFormState.newUserInput || '')
  const [saveSubject, setSaveSubject] = useState(initialFormState.saveSubject || '')
  const [newSubjectInput, setNewSubjectInput] = useState(initialFormState.newSubjectInput || '')
  const [saveYear, setSaveYear] = useState(initialFormState.saveYear || '')
  const [newYearInput, setNewYearInput] = useState(initialFormState.newYearInput || '')
  const [saveName, setSaveName] = useState(initialFormState.saveName || '')

  // Backup / Download state (separate cascading filter)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [downloadUser, setDownloadUser] = useState('')
  const [downloadSubject, setDownloadSubject] = useState('')
  const [downloadYear, setDownloadYear] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null)

  // Dialogs
  const [pendingLoadName, setPendingLoadName] = useState<string | null>(null)
  const [pendingOverwrite, setPendingOverwrite] = useState(false)
  const [activePresetName, setActivePresetName] = useState<string | null>(initialFormState.activePresetName)

  const { data: presets = {}, isLoading } = useQuery<Record<string, TConfig>>({
    queryKey: ['presets', generator],
    queryFn: async () => (await listPresets(generator)) as Record<string, TConfig>
  })

  const { filterUsers, filterSubjects, filterYears } = useMemo(() => {
    const users = new Set<string>()
    const subjects = new Set<string>()
    const years = new Set<string>()

    for (const name of Object.keys(presets)) {
      const parsed = parsePresetPath(name)
      if (parsed.user) users.add(parsed.user)
      if (parsed.subject) subjects.add(parsed.subject)
      if (parsed.year) years.add(parsed.year)
    }

    return {
      filterUsers: Array.from(users).sort((a, b) => a.localeCompare(b)),
      filterSubjects: Array.from(subjects).sort((a, b) => a.localeCompare(b)),
      filterYears: Array.from(years).sort((a, b) => a.localeCompare(b))
    }
  }, [presets])

  // Dropdown options for saving
  const saveUserOptions = useMemo(() => {
    const list = [...filterUsers]
    if (saveUser && saveUser !== NEW_ENTRY && !list.includes(saveUser)) {
      list.push(saveUser)
    }
    if (!list.includes('USER')) {
      list.unshift('USER')
    }
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
  }, [filterUsers, saveUser])

  const saveSubjectOptions = useMemo(() => {
    const list = [...filterSubjects]
    if (saveSubject && saveSubject !== NEW_ENTRY && !list.includes(saveSubject)) {
      list.push(saveSubject)
    }
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
  }, [filterSubjects, saveSubject])

  const saveYearOptions = useMemo(() => {
    const list = [...filterYears]
    if (saveYear && saveYear !== NEW_ENTRY && !list.includes(saveYear)) {
      list.push(saveYear)
    }
    return Array.from(new Set(list)).sort((a, b) => a.localeCompare(b))
  }, [filterYears, saveYear])

  // Cascading options for the Download/Backup section
  const downloadSubjectOptions = useMemo(() => {
    if (!downloadUser || downloadUser === ALL_USERS) return []
    const subjects = new Set<string>()
    for (const name of Object.keys(presets)) {
      const parsed = parsePresetPath(name)
      if (parsed.user === downloadUser && parsed.subject) {
        subjects.add(parsed.subject)
      }
    }
    return Array.from(subjects).sort((a, b) => a.localeCompare(b))
  }, [presets, downloadUser])

  const downloadYearOptions = useMemo(() => {
    if (!downloadUser || downloadUser === ALL_USERS || !downloadSubject) return []
    const years = new Set<string>()
    for (const name of Object.keys(presets)) {
      const parsed = parsePresetPath(name)
      if (parsed.user === downloadUser && parsed.subject === downloadSubject && parsed.year) {
        years.add(parsed.year)
      }
    }
    return Array.from(years).sort((a, b) => a.localeCompare(b))
  }, [presets, downloadUser, downloadSubject])

  const handleDownloadUserChange = (u: string) => {
    setDownloadUser(u)
    setDownloadSubject('')
    setDownloadYear('')
  }

  const handleDownloadSubjectChange = (s: string) => {
    setDownloadSubject(s)
    setDownloadYear('')
  }

  const targetDownloadFolder = useMemo(() => {
    if (!downloadUser || downloadUser === ALL_USERS) return ''
    const parts = [downloadUser]
    if (downloadSubject) {
      parts.push(downloadSubject)
      if (downloadYear) {
        parts.push(downloadYear)
      }
    }
    return parts.join(' / ')
  }, [downloadUser, downloadSubject, downloadYear])

  const targetDownloadLabel = useMemo(() => {
    if (!downloadUser) return ''
    if (downloadUser === ALL_USERS) return 'Alle Nutzer'
    return targetDownloadFolder
  }, [downloadUser, targetDownloadFolder])

  const matchingDownloadCount = useMemo(() => {
    if (!downloadUser) return 0
    if (downloadUser === ALL_USERS) return Object.keys(presets).length
    return Object.keys(presets).filter(name => {
      const parsed = parsePresetPath(name)
      if (parsed.user !== downloadUser) return false
      if (downloadSubject && parsed.subject !== downloadSubject) return false
      if (downloadYear && parsed.year !== downloadYear) return false
      return true
    }).length
  }, [presets, downloadUser, downloadSubject, downloadYear])

  const handleDownloadClick = async () => {
    if (!downloadUser || isDownloading) return
    try {
      setIsDownloading(true)
      await downloadPresetFolder(generator, targetDownloadFolder)
      setDownloadSuccess(`Ordner "${targetDownloadLabel}" heruntergeladen`)
      setTimeout(() => setDownloadSuccess(null), 3000)
    } catch (err) {
      console.error('Download preset folder error:', err)
      alert('Fehler beim Herunterladen des Preset-Ordners.')
    } finally {
      setIsDownloading(false)
    }
  }


  // Effective values for user, subject, year (Saving)
  const effectiveUser = saveUser === NEW_ENTRY ? newUserInput.trim().toUpperCase() : saveUser.trim()
  const effectiveSubject = saveSubject === NEW_ENTRY ? newSubjectInput.trim() : saveSubject.trim()
  const effectiveYear = saveYear === NEW_ENTRY ? newYearInput.trim() : saveYear.trim()

  const folderParts = useMemo(() => {
    return [effectiveUser, effectiveSubject, effectiveYear].filter(Boolean)
  }, [effectiveUser, effectiveSubject, effectiveYear])

  const effectiveFolder = folderParts.join(' / ')
  const fullSaveName = effectiveFolder ? `${effectiveFolder} / ${saveName.trim()}` : saveName.trim()

  const saveMutation = useMutation({
    mutationFn: ({ name, data }: { name: string; data: TConfig }) => savePreset(generator, name, data),
    onSuccess: (_data, variables) => {
      const parsed = parsePresetPath(variables.name)

      setSaveUser(parsed.user || 'USER')
      setNewUserInput('')
      setSaveSubject(parsed.subject || '')
      setNewSubjectInput('')
      setSaveYear(parsed.year || '')
      setNewYearInput('')
      setSaveName(parsed.name)
      setActivePresetName(variables.name)
      queryClient.invalidateQueries({ queryKey: ['presets', generator] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (name: string) => deletePreset(generator, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets', generator] })
    }
  })

  const isFilterActive =
    selectedUser !== ALL_USERS ||
    selectedSubject !== ALL_SUBJECTS ||
    selectedYear !== ALL_YEARS ||
    Boolean(searchTerm.trim())

  const handleClearFilter = () => {
    setSelectedUser(ALL_USERS)
    setSelectedSubject(ALL_SUBJECTS)
    setSelectedYear(ALL_YEARS)
    setSearch('')
    try {
      window.localStorage.setItem('preset-manager:selected-user', ALL_USERS)
    } catch {}
  }

  // Apply user, subject, year and text filters
  const filteredNames = useMemo(() => {
    let names = Object.keys(presets).sort((a, b) => a.localeCompare(b))

    if (selectedUser !== ALL_USERS) {
      names = names.filter(name => parsePresetPath(name).user === selectedUser)
    }

    if (selectedSubject !== ALL_SUBJECTS) {
      names = names.filter(name => parsePresetPath(name).subject === selectedSubject)
    }

    if (selectedYear !== ALL_YEARS) {
      names = names.filter(name => parsePresetPath(name).year === selectedYear)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      names = names.filter(n => n.toLowerCase().includes(term))
    }

    return names
  }, [presets, searchTerm, selectedUser, selectedSubject, selectedYear])

  useEffect(() => {
    try {
      window.localStorage.setItem(`preset-manager:${generator}`, JSON.stringify({
        saveUser,
        newUserInput,
        saveSubject,
        newSubjectInput,
        saveYear,
        newYearInput,
        saveName,
        activePresetName,
        selectedUser,
        selectedSubject,
        selectedYear,
        searchTerm
      }))
    } catch {
      // Local storage is only a convenience; the preset flow still works without it.
    }
  }, [activePresetName, generator, newSubjectInput, newUserInput, newYearInput, saveName, saveSubject, saveUser, saveYear, searchTerm, selectedSubject, selectedUser, selectedYear])

  function handleSaveClick() {
    if (!fullSaveName || !saveName.trim()) return
    if (fullSaveName in presets) {
      setPendingOverwrite(true)
    } else {
      saveMutation.mutate({ name: fullSaveName, data: currentConfig })
    }
  }

  function confirmOverwrite() {
    saveMutation.mutate({ name: fullSaveName, data: currentConfig })
    setPendingOverwrite(false)
  }

  function confirmLoad() {
    if (!pendingLoadName) return
    const parsed = parsePresetPath(pendingLoadName)

    setSaveUser(parsed.user || 'USER')
    setNewUserInput('')
    setSaveSubject(parsed.subject || '')
    setNewSubjectInput('')
    setSaveYear(parsed.year || '')
    setNewYearInput('')
    setSaveName(parsed.name)
    setActivePresetName(pendingLoadName)
    onLoad(presets[pendingLoadName])
    setPendingLoadName(null)
  }

  const saveDisabled =
    !saveName.trim() ||
    !effectiveUser ||
    (saveUser === NEW_ENTRY && !newUserInput.trim()) ||
    (saveSubject === NEW_ENTRY && !newSubjectInput.trim()) ||
    (saveYear === NEW_ENTRY && !newYearInput.trim()) ||
    saveMutation.isPending

  return (
    <>
      {pendingLoadName !== null && (
        <ConfirmDialog
          title="Preset laden?"
          message={`„${pendingLoadName}" laden? Nicht gespeicherte Änderungen am aktuellen Stand gehen dabei verloren.`}
          confirmLabel="Laden"
          onConfirm={confirmLoad}
          onCancel={() => setPendingLoadName(null)}
        />
      )}

      {pendingOverwrite && (
        <ConfirmDialog
          title="Preset überschreiben?"
          message={`Ein Preset mit dem Namen „${fullSaveName}" existiert bereits. Soll es mit den aktuellen Einstellungen überschrieben werden?`}
          confirmLabel="Überschreiben"
          confirmClass="bg-amber-600 hover:bg-amber-500"
          onConfirm={confirmOverwrite}
          onCancel={() => setPendingOverwrite(false)}
        />
      )}

      <div className="flex flex-col gap-3 h-full min-h-0">
        {/* ── Save section ── */}
        <div className="rounded-xl bg-raised/40 border border-rim/50 overflow-hidden shrink-0">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-raised/50 transition-colors"
            aria-expanded={isSaveOpen}
            aria-controls="preset-save-form"
            onClick={() => setIsSaveOpen(open => !open)}
          >
            <span className="flex items-center gap-1.5 text-caption text-ink">
              <Save size={13} />
              Preset speichern
            </span>
            <ChevronDown
              size={15}
              className={`text-ghost transition-transform ${isSaveOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isSaveOpen && (
            <div id="preset-save-form" className="flex flex-col gap-3 px-3 pb-3 border-t border-line/50 pt-3">
              {/* 3-Tier Destination Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* User selector */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Nutzer</span>
                  <select
                    value={saveUser}
                    onChange={(e) => setSaveUser(e.target.value)}
                    className={selectClass}
                  >
                    {saveUserOptions.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value={NEW_ENTRY}>＋ Neuer Nutzer...</option>
                  </select>
                  {saveUser === NEW_ENTRY && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FolderPlus size={13} className="text-primary shrink-0" />
                      <Input
                        placeholder="Kürzel (z.B. MUSTER)"
                        value={newUserInput}
                        onChange={(e) => setNewUserInput(e.target.value.toUpperCase())}
                        className="text-xs uppercase"
                      />
                    </div>
                  )}
                </div>

                {/* Subject selector */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Fach</span>
                  <select
                    value={saveSubject}
                    onChange={(e) => setSaveSubject(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{NO_SUBJECT}</option>
                    {saveSubjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value={NEW_ENTRY}>＋ Neues Fach...</option>
                  </select>
                  {saveSubject === NEW_ENTRY && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FolderPlus size={13} className="text-primary shrink-0" />
                      <Input
                        placeholder="Fach (z.B. Informatik)"
                        value={newSubjectInput}
                        onChange={(e) => setNewSubjectInput(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Year/Grade selector */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Klasse / Jahrgang</span>
                  <select
                    value={saveYear}
                    onChange={(e) => setSaveYear(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">{NO_YEAR}</option>
                    {saveYearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                    <option value={NEW_ENTRY}>＋ Neue Klasse...</option>
                  </select>
                  {saveYear === NEW_ENTRY && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <FolderPlus size={13} className="text-primary shrink-0" />
                      <Input
                        placeholder="Klasse (z.B. 10, Q2)"
                        value={newYearInput}
                        onChange={(e) => setNewYearInput(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preset name */}
              <div className="flex flex-col gap-1">
                <span className="text-metadata pl-1">Name</span>
                <div className="flex gap-2">
                  <Input
                    placeholder="Preset-Name"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveClick() }}
                  />
                  <Button onClick={handleSaveClick} disabled={saveDisabled}>
                    <Save size={18} />
                  </Button>
                </div>
              </div>

              {/* Preview of the resulting full name */}
              {fullSaveName && (
                <p className="flex min-w-0 items-center gap-1.5 pl-1 text-metadata">
                  <span className="shrink-0">Gespeichert als:</span>
                  <PresetPathPreview presetPath={fullSaveName} />
                </p>
              )}

              {activePresetName && activePresetName === fullSaveName && (
                <p className="flex min-w-0 items-center gap-1.5 pl-1 text-metadata">
                  <span className="shrink-0">Geladenes Preset:</span>
                  <PresetPathPreview presetPath={activePresetName} accent />
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Gespeicherte Presets collapsible (Filter on top, list below) ── */}
        <div className="rounded-xl bg-raised/40 border border-rim/50 overflow-hidden flex flex-col shrink-0">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-raised/50 transition-colors shrink-0"
            aria-expanded={isPresetsOpen}
            aria-controls="preset-list-section"
            onClick={() => setIsPresetsOpen(open => !open)}
          >
            <span className="flex items-center gap-1.5 text-caption text-ink">
              <FileJson size={13} />
              Gespeicherte Presets
            </span>
            <div className="flex items-center gap-2">
              <span className="text-metadata tabular-nums font-mono text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {filteredNames.length}
              </span>
              <ChevronDown
                size={15}
                className={`text-ghost transition-transform ${isPresetsOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {isPresetsOpen && (
            <div id="preset-list-section" className="flex flex-col gap-3 px-3 pb-3 border-t border-line/50 pt-3">
              {/* Filtering System on top */}
              <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-raised/25 border border-line shrink-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex min-w-0 flex-col gap-1">
                    <span className="text-metadata pl-1">Nutzer</span>
                    <select
                      value={selectedUser}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedUser(val)
                        try {
                          window.localStorage.setItem('preset-manager:selected-user', val)
                        } catch {}
                      }}
                      className={selectClass}
                    >
                      <option value={ALL_USERS}>{ALL_USERS}</option>
                      {filterUsers.map(user => (
                        <option key={user} value={user}>{user}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-w-0 flex-col gap-1">
                    <span className="text-metadata pl-1">Fach</span>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className={selectClass}
                    >
                      <option value={ALL_SUBJECTS}>{ALL_SUBJECTS}</option>
                      {filterSubjects.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex min-w-0 flex-col gap-1">
                    <span className="text-metadata pl-1">Klasse / Jahrgang</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className={selectClass}
                    >
                      <option value={ALL_YEARS}>{ALL_YEARS}</option>
                      {filterYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {/* Text search and clear filter */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ghost" size={15} />
                    <Input
                      className="pl-9 py-1.5 text-xs"
                      placeholder="Suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClearFilter}
                    disabled={!isFilterActive}
                    className="shrink-0 flex items-center gap-1.5 h-[38px] px-3 text-xs"
                    title="Filter zurücksetzen"
                  >
                    <FilterX size={14} />
                    <span>Filter zurücksetzen</span>
                  </Button>
                </div>
              </div>

              {/* Filtered Presets list below (scrollable container) */}
              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
                {isLoading ? (
                  <div className="text-center py-8 text-ghost text-sm">Lade Presets...</div>
                ) : filteredNames.length === 0 ? (
                  <div className="text-center py-8 text-ghost text-sm">Keine Presets gefunden.</div>
                ) : (
                  filteredNames.map(name => (
                    <div
                      key={name}
                      className="group flex items-center justify-between px-2.5 py-2 rounded-lg bg-panel border border-line hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => setPendingLoadName(name)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileJson size={16} className="shrink-0 text-ghost group-hover:text-primary transition-colors" />
                        <span className="min-w-0 text-sm font-medium">
                          <PresetPathPreview presetPath={name} />
                        </span>
                      </div>
                      <button
                        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 text-ghost hover:text-red-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`Preset "${name}" wirklich löschen?`)) {
                            deleteMutation.mutate(name)
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>


        {/* ── Presets herunterladen (Backup) collapsible section ── */}
        <div className="rounded-xl bg-raised/40 border border-rim/50 overflow-hidden shrink-0">
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-raised/50 transition-colors"
            aria-expanded={isDownloadOpen}
            aria-controls="preset-download-form"
            onClick={() => setIsDownloadOpen(open => !open)}
          >
            <span className="flex items-center gap-1.5 text-caption text-ink">
              <Download size={13} />
              Presets herunterladen
            </span>
            <ChevronDown
              size={15}
              className={`text-ghost transition-transform ${isDownloadOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDownloadOpen && (
            <div id="preset-download-form" className="flex flex-col gap-3 px-3 pb-3 border-t border-line/50 pt-3">
              {/* Cascading selectors for download */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Nutzer */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Nutzer</span>
                  <select
                    value={downloadUser}
                    onChange={(e) => handleDownloadUserChange(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">(Nutzer wählen...)</option>
                    <option value={ALL_USERS}>{ALL_USERS}</option>
                    {filterUsers.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Fach (only available when a specific user is selected) */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Fach</span>
                  <select
                    value={downloadSubject}
                    onChange={(e) => handleDownloadSubjectChange(e.target.value)}
                    disabled={!downloadUser || downloadUser === ALL_USERS}
                    className={selectClass}
                  >
                    <option value="">
                      {downloadUser === ALL_USERS
                        ? 'Alle Fächer (Gesamtes Backup)'
                        : downloadUser
                          ? 'Alle Fächer (Gesamter Nutzer)'
                          : '(Erst Nutzer wählen)'}
                    </option>
                    {downloadSubjectOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Klasse (only available when a specific user and subject are selected) */}
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-metadata pl-1">Klasse / Jahrgang</span>
                  <select
                    value={downloadYear}
                    onChange={(e) => setDownloadYear(e.target.value)}
                    disabled={!downloadUser || downloadUser === ALL_USERS || !downloadSubject}
                    className={selectClass}
                  >
                    <option value="">
                      {downloadUser === ALL_USERS
                        ? 'Alle Jahrgänge (Gesamtes Backup)'
                        : downloadSubject
                          ? 'Alle Jahrgänge (Gesamtes Fach)'
                          : '(Erst Fach wählen)'}
                    </option>
                    {downloadYearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Download Button */}
              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={!downloadUser || isDownloading || matchingDownloadCount === 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border border-line bg-raised/80 hover:bg-overlay hover:border-primary/40 active:scale-[0.99] transition-all text-ink disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm cursor-pointer mt-1"
                title={
                  !downloadUser
                    ? 'Wähle einen Nutzer aus, um den Preset-Ordner herunterzuladen'
                    : `Ordner "${targetDownloadLabel}" (${matchingDownloadCount} Presets) herunterladen`
                }
              >
                {isDownloading ? (
                  <>
                    <RotateCw size={14} className="animate-spin text-primary" />
                    <span>Lade Ordner herunter...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check size={14} className="text-success" />
                    <span className="text-success font-medium">Heruntergeladen!</span>
                  </>
                ) : (
                  <>
                    <Download size={14} className={downloadUser ? 'text-primary' : 'text-ghost'} />
                    <span className="truncate">
                      {!downloadUser
                        ? 'Ordner herunterladen (Nutzer wählen)'
                        : `Ordner herunterladen (${targetDownloadLabel})`}
                    </span>
                    {downloadUser && (
                      <span className="ml-auto shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono font-medium">
                        {matchingDownloadCount} {matchingDownloadCount === 1 ? 'Preset' : 'Presets'}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

