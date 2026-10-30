// SPDX-License-Identifier: AGPL-3.0-or-later

import type { QRConfig, QRLabelMode } from '../typesQR'
import type { DotType, CornerSquareType, CornerDotType, ErrorCorrectionLevel } from 'qr-code-styling'
import { Upload, Link as LinkIcon, Palette, Box } from 'lucide-react'
import { Accordion, Button, Input, Label } from '../../../components/ui'
import { QR_LOGO_PRESETS } from '../constantsQR'

interface QRSettingsProps {
  config: QRConfig
  logoFile: File | null
  updateConfig: (updates: Partial<QRConfig>) => void
  setLogoFile: (file: File | null) => void
}

export default function QRSettings({ config, logoFile, updateConfig, setLogoFile }: QRSettingsProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updateConfig({ logoUrl: null })
      setLogoFile(e.target.files[0])
    }
  }

  return (
    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
      <Accordion title="Web-Link & Logo" icon={<LinkIcon size={18} />} defaultOpen>
        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-2">
            <LinkIcon size={14} /> Web-Link (URL)
          </Label>
          <Input
            value={config.url}
            onChange={(e) => updateConfig({ url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 pt-2 border-t border-line">
          <div className="flex flex-col gap-1.5">
            <Label>Label unter dem QR-Code</Label>
            <select
              value={config.labelMode}
              onChange={(e) => updateConfig({ labelMode: e.target.value as QRLabelMode })}
              className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="none">Kein Label</option>
              <option value="url">Link als Label anzeigen</option>
              <option value="manual">Manuelles Label</option>
            </select>
          </div>

          {config.labelMode === 'manual' && (
            <div className="flex flex-col gap-1.5">
              <Label>Manuelles Label</Label>
              <Input
                value={config.manualLabel}
                onChange={(e) => updateConfig({ manualLabel: e.target.value })}
                placeholder="Station 1"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="flex items-center gap-2">
            <Upload size={14} /> Logo in der Mitte (Optional)
          </Label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <Button
                variant="secondary"
                className="w-full flex items-center justify-center gap-2 border-dashed border-2"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                {logoFile ? (
                  <span className="truncate max-w-[150px]">{logoFile.name}</span>
                ) : config.logoUrl ? (
                  <span className="truncate max-w-[150px]">Preset geladen</span>
                ) : 'Bild auswählen'}
              </Button>
              {(logoFile || config.logoUrl) && (
                <Button
                  variant="secondary"
                  className="shrink-0"
                  onClick={() => {
                    setLogoFile(null)
                    updateConfig({ logoUrl: null })
                  }}
                >
                  Löschen
                </Button>
              )}
            </div>
            
            {QR_LOGO_PRESETS.length > 0 && (
              <div className="pt-2 border-t border-line">
                 <Label className="text-[10px] uppercase tracking-wider text-ghost mb-2 block">Logo Presets</Label>
                 <div className="flex flex-wrap gap-2">
                    {QR_LOGO_PRESETS.map(preset => (
                      <Button 
                        key={preset.label}
                        variant="secondary" 
                        size="sm" 
                        className="text-xs py-1 h-auto"
                        onClick={() => {
                          setLogoFile(null)
                          updateConfig({ logoUrl: preset.url })
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                 </div>
              </div>
            )}
          </div>
        </div>
      </Accordion>

      <Accordion title="Farben & Stil" icon={<Palette size={18} />} defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Vordergrund-Farbe</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.dotColor}
                onChange={(e) => updateConfig({ dotColor: e.target.value })}
                className="w-10 h-10 rounded border-none cursor-pointer bg-transparent"
              />
              <Input 
                value={config.dotColor} 
                onChange={(e) => updateConfig({ dotColor: e.target.value })} 
                className="text-xs font-mono h-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Ecken-Farbe</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.eyeColor}
                onChange={(e) => updateConfig({ eyeColor: e.target.value })}
                className="w-10 h-10 rounded border-none cursor-pointer bg-transparent"
              />
              <Input 
                value={config.eyeColor} 
                onChange={(e) => updateConfig({ eyeColor: e.target.value })} 
                className="text-xs font-mono h-9"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hintergrund-Farbe</Label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="w-10 h-10 rounded border-none cursor-pointer bg-transparent"
              />
              <Input
                value={config.backgroundColor}
                onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                className="text-xs font-mono h-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Ecken-Form (Aussen)</Label>
            <select 
              value={config.cornerSquareType}
              onChange={(e) => updateConfig({ cornerSquareType: e.target.value as CornerSquareType })}
              className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="square">Quadratisch</option>
              <option value="rounded">Abgerundet</option>
              <option value="extra-rounded">Stark abgerundet</option>
              <option value="dot">Kreisförmig</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Ecken-Form (Innen)</Label>
            <select 
              value={config.cornerDotType}
              onChange={(e) => updateConfig({ cornerDotType: e.target.value as CornerDotType })}
              className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="square">Quadratisch</option>
              <option value="dot">Kreisförmig</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Punkt-Stil</Label>
            <select 
              value={config.dotType}
              onChange={(e) => updateConfig({ dotType: e.target.value as DotType })}
              className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="square">Quadratisch</option>
              <option value="rounded">Abgerundet</option>
              <option value="dots">Punkte</option>
              <option value="classy">Classy</option>
              <option value="classy-rounded">Classy Rounded</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fehlerkorrektur</Label>
            <select
              value={config.errorCorrectionLevel}
              onChange={(e) => updateConfig({ errorCorrectionLevel: e.target.value as ErrorCorrectionLevel })}
              className="bg-panel border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="L">L - ca. 7%</option>
              <option value="M">M - ca. 15%</option>
              <option value="Q">Q - ca. 25%</option>
              <option value="H">H - ca. 30%</option>
            </select>
          </div>
        </div>
      </Accordion>

      <Accordion title="Abmessungen" icon={<Box size={18} />} defaultOpen>
        <div className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <Label>Auflösung: {config.qrSize}px</Label>
            <input
              type="range"
              min="256"
              max="2048"
              step="128"
              value={config.qrSize}
              onChange={(e) => updateConfig({ qrSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Rand: {config.margin}px</Label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={config.margin}
              onChange={(e) => updateConfig({ margin: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-line rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>
        </div>
      </Accordion>
    </div>
  )
}
