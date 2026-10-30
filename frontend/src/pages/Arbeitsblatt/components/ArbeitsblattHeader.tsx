// SPDX-License-Identifier: AGPL-3.0-or-later

import { FileText, RotateCw, Play, CheckCircle2, Dices } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { Button } from '../../../components/ui'
import { COMPONENT_VERSIONS } from "../../versions"

interface Props {
  onReset: () => void
  onExecute: () => void
  onGenerate: () => void
  onGenerateNewSeed: () => void
  isPendingExecution: boolean
  isWorking: boolean
  showCodeSuccess: boolean
}

export default function ArbeitsblattHeader({
  onReset,
  onExecute,
  onGenerate,
  onGenerateNewSeed,
  isPendingExecution,
  isWorking,
  showCodeSuccess
}: Props) {
  return (
    <GeneratorHeader
      title="Arbeitsblattgenerator"
      icon={<FileText size={24} />}
      version={COMPONENT_VERSIONS.arbeitsblattgenerator}
      onReset={onReset}
      resetConfirmation={{
        title: 'Konfiguration zurücksetzen?',
        message: 'Alle nicht gespeicherten Eingaben gehen verloren. Die Konfiguration wird auf die Standardwerte zurückgesetzt.',
      }}
      actionsBefore={
        <>
        <span
          className={`flex items-center gap-1.5 text-xs text-emerald-400 transition-all duration-500 ${
            showCodeSuccess ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
          }`}
        >
          <CheckCircle2 size={13} /> Ausgeführt
        </span>
        </>
      }
      actionsAfter={
        <>
        <Button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
          onClick={onExecute}
          disabled={isPendingExecution}
        >
          <Play size={18} /> {isPendingExecution ? 'Führe aus...' : 'Code ausführen'}
        </Button>
        <Button
          className="flex items-center gap-2"
          onClick={onGenerate}
          disabled={isWorking}
        >
          <RotateCw size={18} className={isWorking ? 'animate-spin' : ''} /> Arbeitsblatt generieren
        </Button>
        <Button
          className="flex items-center gap-2"
          onClick={onGenerateNewSeed}
          disabled={isWorking}
        >
          <Dices size={18} className={isWorking ? 'animate-spin' : ''} /> Mit neuem Seed generieren
        </Button>
        </>
      }
    />
  )
}
