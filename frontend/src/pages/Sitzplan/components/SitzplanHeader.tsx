// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { Users, RotateCcw } from 'lucide-react'
import { PageHeader } from '../../../components/HeaderSection'
import { Button, ConfirmDialog } from '../../../components/ui'
import { COMPONENT_VERSIONS } from '../../versions'

interface SitzplanHeaderProps {
  onReset: () => void
}

const SitzplanHeader: React.FC<SitzplanHeaderProps> = ({ onReset }) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  return (
    <div className="flex justify-between items-center min-w-0">
      <div className="min-w-0 flex-1">
        <PageHeader
          title="Sitzplan"
          icon={<Users size={24} />}
          version={COMPONENT_VERSIONS.sitzplangenerator}
        />
      </div>
      <div className="flex gap-2 items-center shrink-0 ml-4 mb-8">
        <Button 
          variant="secondary" 
          className="flex items-center gap-2 whitespace-nowrap" 
          onClick={() => setShowResetConfirm(true)}
        >
          <RotateCcw size={16} /> Zurücksetzen
        </Button>
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Alle Daten zurücksetzen?"
          message="Alle Schüler, Wünsche, Regeln und das Layout werden auf die Standardwerte zurückgesetzt. Nicht gespeicherte Daten gehen verloren."
          confirmLabel="Zurücksetzen"
          confirmClass="bg-red-600 hover:bg-red-500"
          onConfirm={() => {
            onReset()
            setShowResetConfirm(false)
          }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}

export default SitzplanHeader
