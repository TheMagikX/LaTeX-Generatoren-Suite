// SPDX-License-Identifier: AGPL-3.0-or-later

import { Settings } from 'lucide-react'
import { PageHeader } from '../../components/HeaderSection'
import { AppearanceSection } from './components/AppearanceSection'
import { PerformanceSection } from './components/PerformanceSection'
import { AiSettingsSection } from './components/AiSettingsSection'
import { LatexTemplatesSection } from './components/LatexTemplatesSection'
import { UpdateSection } from './components/UpdateSection'
import { SystemInfoSection } from './components/SystemInfoSection'
import { APP_VERSION } from '../versions'

export default function SettingsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <PageHeader
        icon={<Settings size={20} />}
        title="Einstellungen"
        description="Anwendungseinstellungen, Erscheinungsbild und Systeminformationen"
        version={APP_VERSION}
      />

      {/* Erscheinungsbild */}
      <AppearanceSection />

      {/* Entwickler & Performance */}
      <PerformanceSection />

      {/* KI-Generierung (Dual-Provider: Ollama & Google Gemini) */}
      <AiSettingsSection />

      {/* LaTeX-Standard-Inputs & Vorlagen */}
      <LatexTemplatesSection />

      {/* Systemaktualisierungen & GitHub Releases */}
      <UpdateSection />

      {/* Info & Lizenz Grid */}
      <SystemInfoSection />
    </div>
  )
}
