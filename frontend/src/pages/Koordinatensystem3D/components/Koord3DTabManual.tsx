// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config3D, Config3DSetter } from '../typesKoord3D'

interface Koord3DTabManualProps {
  config: Config3D
  updateConfig: Config3DSetter
}

export const Koord3DTabManual = ({ config, updateConfig }: Koord3DTabManualProps) => {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Eigene TikZ-Befehle innerhalb der <code className="bg-raised px-1 rounded text-xs">axis</code>-Umgebung
      </p>
      <textarea
        value={config.manual_code}
        onChange={e => updateConfig('manual_code', e.target.value)}
        rows={18}
        className="w-full px-3 py-2 bg-canvas border border-line rounded-md font-mono text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        placeholder="% TikZ-Code hier einfügen..."
      />
    </div>
  )
}
