// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { Users } from 'lucide-react'
import { GeneratorHeader } from '../../../components/HeaderSection'
import { COMPONENT_VERSIONS } from '../../versions'
import type { HistoryActions } from '../../../hooks/useGeneratorHistory'

interface SitzplanHeaderProps {
  onReset: () => void
  history?: HistoryActions
}

const SitzplanHeader: React.FC<SitzplanHeaderProps> = ({
  onReset,
  history,
}) => {
  return (
    <GeneratorHeader
      title="Sitzplan"
      icon={<Users size={24} />}
      version={COMPONENT_VERSIONS.sitzplangenerator}
      showPalette={false}
      history={history}
      onReset={onReset}
      resetConfirmation={{
        title: 'Alle Daten zurücksetzen?',
        message: 'Alle Schüler, Wünsche, Regeln und das Layout werden auf die Standardwerte zurückgesetzt. Nicht gespeicherte Daten gehen verloren.',
      }}
    />
  )
}

export default SitzplanHeader
