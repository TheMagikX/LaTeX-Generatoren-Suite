// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState, useEffect } from 'react'
import type {
  CommandsStatus,
  AdditionalItemStatus,
  SuggestedAdditional,
  LatexFeedbackMessage,
} from '../../types'

const CSRF_HEADERS: Record<string, string> = {
  'X-Requested-With': 'GenSuite',
}

const JSON_CSRF_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'GenSuite',
}

export function useLatexSettings() {
  const [commandsStatus, setCommandsStatus] = useState<CommandsStatus | null>(null)
  const [commandsInputPath, setCommandsInputPath] = useState<string>('')
  const [isBrowsingCommands, setIsBrowsingCommands] = useState<boolean>(false)
  const [isSavingCommands, setIsSavingCommands] = useState<boolean>(false)

  const [packagesStatus, setPackagesStatus] = useState<CommandsStatus | null>(null)
  const [packagesInputPath, setPackagesInputPath] = useState<string>('')
  const [isBrowsingPackages, setIsBrowsingPackages] = useState<boolean>(false)
  const [isSavingPackages, setIsSavingPackages] = useState<boolean>(false)

  const [additionalInputs, setAdditionalInputs] = useState<string[]>([])
  const [additionalStatus, setAdditionalStatus] = useState<AdditionalItemStatus[]>([])
  const [suggestedAdditional, setSuggestedAdditional] = useState<SuggestedAdditional[]>([])
  const [browsingIndex, setBrowsingIndex] = useState<number | null>(null)
  const [isSavingAdditionals, setIsSavingAdditionals] = useState<boolean>(false)

  const [customStyPackages, setCustomStyPackages] = useState<string[]>([])
  const [customStyStatus, setCustomStyStatus] = useState<AdditionalItemStatus[]>([])
  const [suggestedSty, setSuggestedSty] = useState<SuggestedAdditional[]>([])
  const [browsingStyIndex, setBrowsingStyIndex] = useState<number | null>(null)
  const [isSavingSty, setIsSavingSty] = useState<boolean>(false)

  const [latexFeedbackMsg, setLatexFeedbackMsg] = useState<LatexFeedbackMessage | null>(null)
  const [isUploading, setIsUploading] = useState<string | null>(null)

  const handleUploadFile = async (
    file: File,
    category: 'commands' | 'packages' | 'additional' | 'sty'
  ) => {
    setIsUploading(category)
    setLatexFeedbackMsg(null)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    try {
      const res = await fetch('/api/settings/latex/upload', {
        method: 'POST',
        headers: CSRF_HEADERS,
        body: formData,
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Fehler beim Hochladen.')
      }
      const data = await res.json()
      if (category === 'commands' && data.settings?.commands) {
        setCommandsStatus(data.settings.commands)
        setCommandsInputPath(data.settings.commands.custom_path || '')
        setLatexFeedbackMsg({
          section: 'commands',
          type: 'success',
          text: `commands.tex erfolgreich hochgeladen und eingebunden (${data.filename})!`,
        })
      } else if (category === 'packages' && data.settings?.packages) {
        setPackagesStatus(data.settings.packages)
        setPackagesInputPath(data.settings.packages.custom_path || '')
        setLatexFeedbackMsg({
          section: 'packages',
          type: 'success',
          text: `Pakete.tex erfolgreich hochgeladen und eingebunden (${data.filename})!`,
        })
      } else if (category === 'additional' && data.settings?.additional_inputs) {
        setAdditionalStatus(data.settings.additional_inputs)
        setAdditionalInputs(data.settings.additional_inputs.map((it: AdditionalItemStatus) => it.path))
        setLatexFeedbackMsg({
          section: 'additionals',
          type: 'success',
          text: `Zusatzdatei erfolgreich hochgeladen (${data.filename})!`,
        })
      } else if (category === 'sty' && data.settings?.custom_sty_packages) {
        setCustomStyStatus(data.settings.custom_sty_packages)
        setCustomStyPackages(data.settings.custom_sty_packages.map((it: AdditionalItemStatus) => it.path))
        setLatexFeedbackMsg({
          section: 'sty',
          type: 'success',
          text: `Paketdatei (.sty) erfolgreich hochgeladen (${data.filename})!`,
        })
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Fehler beim Hochladen.'
      setLatexFeedbackMsg({
        section: category === 'additional' ? 'additionals' : category,
        type: 'error',
        text,
      })
    } finally {
      setIsUploading(null)
      setTimeout(() => setLatexFeedbackMsg(null), 5000)
    }
  }

  const fetchLatexSettings = async () => {
    try {
      const res = await fetch('/api/settings/latex', { headers: CSRF_HEADERS })
      if (res.ok) {
        const data = await res.json()
        if (data.commands) {
          setCommandsStatus(data.commands)
          setCommandsInputPath(data.commands.custom_path || '')
        }
        if (data.packages) {
          setPackagesStatus(data.packages)
          setPackagesInputPath(data.packages.custom_path || '')
        }
        if (data.additional_inputs) {
          setAdditionalStatus(data.additional_inputs)
          setAdditionalInputs(data.additional_inputs.map((it: AdditionalItemStatus) => it.path))
        }
        if (data.suggested_additional) {
          setSuggestedAdditional(data.suggested_additional)
        }
        if (data.custom_sty_packages) {
          setCustomStyStatus(data.custom_sty_packages)
          setCustomStyPackages(data.custom_sty_packages.map((it: AdditionalItemStatus) => it.path))
        }
        if (data.suggested_sty) {
          setSuggestedSty(data.suggested_sty)
        }
      }
    } catch (err) {
      console.error('Failed to load LaTeX settings', err)
    }
  }

  useEffect(() => {
    fetchLatexSettings()
  }, [])

  const handleSaveCommands = async (pathOverride?: string | null) => {
    setIsSavingCommands(true)
    setLatexFeedbackMsg(null)
    const pathToSend = pathOverride !== undefined ? pathOverride : commandsInputPath
    try {
      const res = await fetch('/api/settings/latex', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ custom_commands_path: pathToSend || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setCommandsStatus(data.commands)
        setCommandsInputPath(data.commands.custom_path || '')
        if (data.commands.is_custom) {
          setLatexFeedbackMsg({
            section: 'commands',
            type: 'success',
            text: 'Private commands.tex erfolgreich eingebunden!',
          })
        } else if (data.commands.custom_path && !data.commands.file_exists) {
          setLatexFeedbackMsg({
            section: 'commands',
            type: 'error',
            text: 'Pfad gespeichert, die Datei wurde jedoch nicht gefunden.',
          })
        } else {
          setLatexFeedbackMsg({
            section: 'commands',
            type: 'info',
            text: 'Standard commands-default.tex (Dummy) aktiv.',
          })
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'commands',
        type: 'error',
        text: 'Netzwerkfehler beim Speichern.',
      })
    } finally {
      setIsSavingCommands(false)
      setTimeout(() => setLatexFeedbackMsg(null), 5000)
    }
  }

  const handleBrowseCommands = async () => {
    setIsBrowsingCommands(true)
    setLatexFeedbackMsg(null)
    try {
      const res = await fetch('/api/settings/latex/browse', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ title: 'commands.tex auswählen' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setCommandsInputPath(data.path)
          await handleSaveCommands(data.path)
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'commands',
        type: 'error',
        text: 'Fehler beim Öffnen des Dateidialogs.',
      })
    } finally {
      setIsBrowsingCommands(false)
    }
  }

  const handleResetCommands = async () => {
    setCommandsInputPath('')
    await handleSaveCommands(null)
  }

  const handleSavePackages = async (pathOverride?: string | null) => {
    setIsSavingPackages(true)
    setLatexFeedbackMsg(null)
    const pathToSend = pathOverride !== undefined ? pathOverride : packagesInputPath
    try {
      const res = await fetch('/api/settings/latex', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ custom_packages_path: pathToSend || null }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.packages) {
          setPackagesStatus(data.packages)
          setPackagesInputPath(data.packages.custom_path || '')
          if (data.packages.is_custom) {
            setLatexFeedbackMsg({
              section: 'packages',
              type: 'success',
              text: 'Private Pakete.tex erfolgreich eingebunden!',
            })
          } else if (data.packages.custom_path && !data.packages.file_exists) {
            setLatexFeedbackMsg({
              section: 'packages',
              type: 'error',
              text: 'Pfad gespeichert, die Datei wurde jedoch nicht gefunden.',
            })
          } else {
            setLatexFeedbackMsg({
              section: 'packages',
              type: 'info',
              text: 'Standard Pakete-default.tex aktiv.',
            })
          }
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'packages',
        type: 'error',
        text: 'Netzwerkfehler beim Speichern.',
      })
    } finally {
      setIsSavingPackages(false)
      setTimeout(() => setLatexFeedbackMsg(null), 5000)
    }
  }

  const handleBrowsePackages = async () => {
    setIsBrowsingPackages(true)
    setLatexFeedbackMsg(null)
    try {
      const res = await fetch('/api/settings/latex/browse', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ title: 'Pakete.tex auswählen' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setPackagesInputPath(data.path)
          await handleSavePackages(data.path)
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'packages',
        type: 'error',
        text: 'Fehler beim Öffnen des Dateidialogs.',
      })
    } finally {
      setIsBrowsingPackages(false)
    }
  }

  const handleResetPackages = async () => {
    setPackagesInputPath('')
    await handleSavePackages(null)
  }

  const handleAddAdditionalRow = () => {
    setAdditionalInputs(prev => [...prev, ''])
  }

  const handleRemoveAdditionalRow = (index: number) => {
    setAdditionalInputs(prev => prev.filter((_, i) => i !== index))
  }

  const handleBrowseAdditional = async (index: number) => {
    setBrowsingIndex(index)
    setLatexFeedbackMsg(null)
    try {
      const res = await fetch('/api/settings/latex/browse', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ title: 'Zusätzliche .tex-Datei auswählen' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setAdditionalInputs(prev => {
            const next = [...prev]
            next[index] = data.path
            return next
          })
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'additionals',
        type: 'error',
        text: 'Fehler beim Öffnen des Dateidialogs.',
      })
    } finally {
      setBrowsingIndex(null)
    }
  }

  const handleSaveAdditionals = async (updatedList?: string[]) => {
    setIsSavingAdditionals(true)
    setLatexFeedbackMsg(null)
    const listToSend = updatedList !== undefined ? updatedList : additionalInputs
    try {
      const res = await fetch('/api/settings/latex', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ additional_inputs: listToSend.filter(p => p.trim() !== '') }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.additional_inputs) {
          setAdditionalStatus(data.additional_inputs)
          setAdditionalInputs(data.additional_inputs.map((it: AdditionalItemStatus) => it.path))
        }
        if (data.suggested_additional) {
          setSuggestedAdditional(data.suggested_additional)
        }
        setLatexFeedbackMsg({
          section: 'additionals',
          type: 'success',
          text: 'Zusätzliche .tex-Inputs erfolgreich gespeichert!',
        })
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'additionals',
        type: 'error',
        text: 'Netzwerkfehler beim Speichern.',
      })
    } finally {
      setIsSavingAdditionals(false)
      setTimeout(() => setLatexFeedbackMsg(null), 5000)
    }
  }

  const handleAddStyRow = () => {
    setCustomStyPackages(prev => [...prev, ''])
  }

  const handleRemoveStyRow = (index: number) => {
    setCustomStyPackages(prev => prev.filter((_, i) => i !== index))
  }

  const handleBrowseSty = async (index: number) => {
    setBrowsingStyIndex(index)
    setLatexFeedbackMsg(null)
    try {
      const res = await fetch('/api/settings/latex/browse', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ title: 'LaTeX-Paket (.sty) auswählen' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.path) {
          setCustomStyPackages(prev => {
            const next = [...prev]
            next[index] = data.path
            return next
          })
        }
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'sty',
        type: 'error',
        text: 'Fehler beim Öffnen des Dateidialogs.',
      })
    } finally {
      setBrowsingStyIndex(null)
    }
  }

  const handleSaveSty = async (updatedList?: string[]) => {
    setIsSavingSty(true)
    setLatexFeedbackMsg(null)
    const listToSend = updatedList !== undefined ? updatedList : customStyPackages
    try {
      const res = await fetch('/api/settings/latex', {
        method: 'POST',
        headers: JSON_CSRF_HEADERS,
        body: JSON.stringify({ custom_sty_packages: listToSend.filter(p => p.trim() !== '') }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.custom_sty_packages) {
          setCustomStyStatus(data.custom_sty_packages)
          setCustomStyPackages(data.custom_sty_packages.map((it: AdditionalItemStatus) => it.path))
        }
        if (data.suggested_sty) {
          setSuggestedSty(data.suggested_sty)
        }
        setLatexFeedbackMsg({
          section: 'sty',
          type: 'success',
          text: 'Eigene .sty-Pakete erfolgreich gespeichert!',
        })
      }
    } catch {
      setLatexFeedbackMsg({
        section: 'sty',
        type: 'error',
        text: 'Netzwerkfehler beim Speichern.',
      })
    } finally {
      setIsSavingSty(false)
      setTimeout(() => setLatexFeedbackMsg(null), 5000)
    }
  }

  return {
    commands: {
      status: commandsStatus,
      inputPath: commandsInputPath,
      setInputPath: setCommandsInputPath,
      isBrowsing: isBrowsingCommands,
      isSaving: isSavingCommands,
      onSave: handleSaveCommands,
      onBrowse: handleBrowseCommands,
      onReset: handleResetCommands,
      onUpload: (file: File) => handleUploadFile(file, 'commands'),
      isUploading: isUploading === 'commands',
      feedback: latexFeedbackMsg,
    },
    packages: {
      status: packagesStatus,
      inputPath: packagesInputPath,
      setInputPath: setPackagesInputPath,
      isBrowsing: isBrowsingPackages,
      isSaving: isSavingPackages,
      onSave: handleSavePackages,
      onBrowse: handleBrowsePackages,
      onReset: handleResetPackages,
      onUpload: (file: File) => handleUploadFile(file, 'packages'),
      isUploading: isUploading === 'packages',
      feedback: latexFeedbackMsg,
    },
    additionals: {
      inputs: additionalInputs,
      setInputs: setAdditionalInputs,
      status: additionalStatus,
      suggested: suggestedAdditional,
      browsingIndex,
      isSaving: isSavingAdditionals,
      onAddRow: handleAddAdditionalRow,
      onRemoveRow: handleRemoveAdditionalRow,
      onBrowse: handleBrowseAdditional,
      onSave: handleSaveAdditionals,
      onUpload: (file: File) => handleUploadFile(file, 'additional'),
      isUploading: isUploading === 'additional',
      feedback: latexFeedbackMsg,
    },
    customSty: {
      inputs: customStyPackages,
      setInputs: setCustomStyPackages,
      status: customStyStatus,
      suggested: suggestedSty,
      browsingIndex: browsingStyIndex,
      isSaving: isSavingSty,
      onAddRow: handleAddStyRow,
      onRemoveRow: handleRemoveStyRow,
      onBrowse: handleBrowseSty,
      onSave: handleSaveSty,
      onUpload: (file: File) => handleUploadFile(file, 'sty'),
      isUploading: isUploading === 'sty',
      feedback: latexFeedbackMsg,
    },
  }
}
