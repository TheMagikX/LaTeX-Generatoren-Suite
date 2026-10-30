// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateGeometrie, compileLatex } from '../../api/client'
import type { CompileResponse, GeoResponse } from '../../api/client'
import { Input, Slider, Switch, SecHead, Field, Accordion, FontSelector, ConfirmDialog } from '../../components/ui'
import { PresetManager } from '../../components/PresetManager'
import {
  Settings, Palette,
  Grid, Ruler, Folders
} from 'lucide-react'
import type { Config } from './typesGeo'
import { DEFAULT_CONFIG } from './constantsGeo'
import { GeoHeader } from './components/GeoHeader'
import { GeoSolvedInfo } from './components/GeoSolvedInfo'
import { GeoPreview } from './components/GeoPreview'
import { GeoTabConstruction } from './components/GeoTabConstruction'
import { GeoTabPointsAngles } from './components/GeoTabPointsAngles'
import { GeoTabSpecialLines } from './components/GeoTabSpecialLines'

export default function GeoPage() {
  const [cfg, setCfg] = useLocalStorage<Config>('ks-geometrie', DEFAULT_CONFIG)
  const [dpi, setDpi] = useState(600)

  // Typed setters
  const updC = (patch: Partial<Config['construction']>) =>
    setCfg(c => ({ ...c, construction: { ...c.construction, ...patch } }))
  const updQ = (patch: Partial<Config['quad_construction']>) =>
    setCfg(c => ({ ...c, quad_construction: { ...c.quad_construction, ...patch } }))
  const updEl = (patch: Partial<Config['elements']>) =>
    setCfg(c => ({ ...c, elements: { ...c.elements, ...patch } }))
  const updSt = (patch: Partial<Config['style']>) =>
    setCfg(c => ({ ...c, style: { ...c.style, ...patch } }))

  const [genData, setGenData] = useState<GeoResponse | null>(null)
  const [compileResult, setCompileResult] = useState<CompileResponse | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateGeometrie(cfg)
      setGenData(gen)
      const result = await compileLatex(gen.latex, dpi)
      setCompileResult(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const downloadPng = () => {
    if (!compileResult?.png_base64) return
    const link = document.createElement('a')
    link.href = `data:image/png;base64,${compileResult.png_base64}`
    link.download = 'geometrie.png'
    link.click()
  }

  const downloadPdf = () => {
    if (!compileResult?.pdf_base64) return
    const link = document.createElement('a')
    link.href = `data:application/pdf;base64,${compileResult.pdf_base64}`
    link.download = 'geometrie.pdf'
    link.click()
  }

  const downloadSvg = () => {
    if (!compileResult?.svg_base64) return
    const link = document.createElement('a')
    link.href = `data:image/svg+xml;base64,${compileResult.svg_base64}`
    link.download = 'geometrie.svg'
    link.click()
  }

  const onCopyPng = async () => {
    if (!compileResult?.png_base64) return
    const blob = await (await fetch(`data:image/png;base64,${compileResult.png_base64}`)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <GeoHeader
        onReset={() => setShowResetConfirm(true)}
        onCompile={handleCompile}
        isCompiling={isCompiling}
        latexCode={genData?.latex}
      />

      <GeoSolvedInfo
        shape={cfg.shape}
        solved={genData?.solved}
        solveError={genData?.error}
      />

      <div className="flex gap-6 flex-1 overflow-hidden pb-4 relative">
        {/* Left Column: Config Panel */}
        <div className="w-[840px] flex-shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 pb-24 font-body">
          <div className="bg-panel/50 p-4 rounded-2xl border border-line/50 shrink-0">
            <SecHead>Geometrie-Typ</SecHead>
            <div className="flex p-1.5 bg-panel/80 rounded-xl border border-line shrink-0">
              {(['Triangle', 'Quadrilateral'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setCfg(c => ({ ...c, shape: s }))}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 ${cfg.shape === s
                    ? 'bg-primary text-white shadow-md'
                    : 'text-muted hover:text-ink'
                    }`}
                >
                  {s === 'Triangle' ? 'Dreieck' : 'Viereck'}
                </button>
              ))}
            </div>
          </div>

          <GeoTabConstruction
            cfg={cfg}
            updC={updC}
            updQ={updQ}
          />

          <GeoTabPointsAngles
            cfg={cfg}
            updEl={updEl}
          />

          <Accordion title="Werte & Maße" icon={<Ruler size={18} />}>
            <div className="space-y-6">
              <div>
                <SecHead>Seitenlängen anzeigen</SecHead>
                <div className="grid grid-cols-4 gap-2">
                  {(['a', 'b', 'c', 'd'] as const).map(s => (
                    (s !== 'd' || cfg.shape === 'Quadrilateral') && (
                      <Switch
                        key={s}
                        label={`Seite ${s}`}
                        checked={cfg.elements.measurements?.show_sides?.[s] || false}
                        onChange={(v: boolean) => updEl({ measurements: { ...cfg.elements.measurements, show_sides: { ...cfg.elements.measurements?.show_sides, [s]: v } } })}
                      />
                    )
                  ))}
                </div>
              </div>
              <div className="w-full h-px bg-raised/80" />
              <div>
                <SecHead>Winkelgrößen anzeigen</SecHead>
                <div className="grid grid-cols-4 gap-2">
                  {(['alpha', 'beta', 'gamma', 'delta'] as const).map(a => (
                    (a !== 'delta' || cfg.shape === 'Quadrilateral') && (
                      <Switch
                        key={a}
                        label={a === 'alpha' ? 'α' : a === 'beta' ? 'β' : a === 'gamma' ? 'γ' : 'δ'}
                        checked={cfg.elements.measurements?.show_angles?.[a] || false}
                        onChange={(v: boolean) => updEl({ measurements: { ...cfg.elements.measurements, show_angles: { ...cfg.elements.measurements?.show_angles, [a]: v } } })}
                      />
                    )
                  ))}
                </div>
              </div>
            </div>
          </Accordion>

          <GeoTabSpecialLines
            cfg={cfg}
            updEl={updEl}
          />

          {cfg.shape === 'Triangle' && (
            <Accordion title="Kreise & Raster" icon={<Grid size={18} />}>
              <div className="space-y-4">
                <Switch label="Umkreis anzeigen" checked={cfg.elements.others.circumcircle} onChange={(v: boolean) => updEl({ others: { ...cfg.elements.others, circumcircle: v } })} />
                <Switch label="Inkreis anzeigen" checked={cfg.elements.others.incircle} onChange={(v: boolean) => updEl({ others: { ...cfg.elements.others, incircle: v } })} />
                <div className="my-2" />
                <Switch label="Koordinatengitter im Hintergrund" checked={cfg.elements.others.grid} onChange={(v: boolean) => updEl({ others: { ...cfg.elements.others, grid: v } })} description="Zeichnet ein feines Hilfsraster" />
              </div>
            </Accordion>
          )}

          <Accordion title="Stil & Farben" icon={<Palette size={18} />}>
            <div className="space-y-5">
              <Field label="Füllfarbe (TikZ)">
                <Input value={cfg.style.fill_color} onChange={e => updSt({ fill_color: e.target.value })} className="bg-panel/50" />
              </Field>
              <Slider
                label={`Deckkraft Füllung: ${cfg.style.fill_opacity}`}
                min={0} max={1} step={0.05}
                value={cfg.style.fill_opacity}
                onChange={v => updSt({ fill_opacity: v })}
              />
              <Field label="Linienfarbe (TikZ)">
                <Input value={cfg.style.stroke_color} onChange={e => updSt({ stroke_color: e.target.value })} className="bg-panel/50" />
              </Field>
              <Field label="Linienstärke">
                <select
                  value={cfg.style.line_width}
                  onChange={e => updSt({ line_width: e.target.value })}
                  className="w-full px-3 py-2.5 bg-panel/50 border border-rim/50 rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  {['thin', 'semithick', 'thick', 'very thick'].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <div className="border-t border-line/80 pt-5 mt-2">
                <SecHead>Hilfslinien-Stil</SecHead>
                <Field label="Standard-Stil für Hilfslinien">
                  <Input
                    value={cfg.style.helper_style_default}
                    onChange={e => updSt({ helper_style_default: e.target.value })}
                    className="bg-panel/50"
                  />
                </Field>
              </div>
            </div>
          </Accordion>

          <Accordion title="Erweiterte LaTeX Einstellungen" icon={<Settings size={18} />}>
            <div className="space-y-4">
              <Switch checked={cfg.pakete_laden} onChange={(v: boolean) => setCfg(c => ({ ...c, pakete_laden: v }))} label="Benötigte Pakete laden" />
              <Switch checked={cfg.command_laden} onChange={(v: boolean) => setCfg(c => ({ ...c, command_laden: v }))} label="Eigene Commands laden" />
              <FontSelector value={cfg.font_family} onChange={(v: string) => setCfg(c => ({ ...c, font_family: v }))} />
              <div className="pt-2">
                <Field label="Zusätzliche Präambel">
                  <textarea
                    value={cfg.preamble_add}
                    onChange={e => setCfg(c => ({ ...c, preamble_add: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 bg-panel/50 border border-rim/50 rounded-lg text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    placeholder="\usepackage{...}"
                  />
                </Field>
              </div>
            </div>
          </Accordion>

          <Accordion title="Presets & Speichern" icon={<Folders size={18} />}>
            <PresetManager
              generator="geo"
              currentConfig={cfg}
              onLoad={setCfg}
            />
          </Accordion>

        </div>

        <GeoPreview
          latexCode={genData?.latex}
          isCompiling={isCompiling}
          compileResult={compileResult}
          dpi={dpi}
          setDpi={setDpi}
          onDownloadPng={downloadPng}
          onDownloadPdf={downloadPdf}
          onDownloadSvg={downloadSvg}
          onCopyPng={onCopyPng}
        />
      </div>

      {showResetConfirm && (
        <ConfirmDialog
          title="Konfiguration zurücksetzen"
          message="Alle Einstellungen werden auf die Standardwerte zurückgesetzt. Nicht gespeicherte Änderungen gehen verloren."
          confirmLabel="Zurücksetzen"
          confirmClass="bg-red-600 hover:bg-red-500"
          onConfirm={() => { setCfg({ ...DEFAULT_CONFIG }); setShowResetConfirm(false) }}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  )
}
