// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Terminal, Code, FileJson, Info, AlertCircle, CheckCircle2, Layout, Settings, Copy, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Input, Label, FontSelector } from '../../../components/ui'
import { Tabs, TabContent } from '../../../components/Tabs'
import { PresetManager } from '../../../components/PresetManager'
import { CodeEditor } from '../../../components/CodeEditor'
import type { ArbeitsblattConfig } from '../typesArbeitsblatt'

type PythonType = 'int' | 'float' | 'str' | 'bool' | 'list' | 'dict' | 'NoneType' | 'other'

function getPythonType(val: unknown): PythonType {
  if (val === null) return 'NoneType'
  if (typeof val === 'boolean') return 'bool'
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float'
  if (typeof val === 'string') return 'str'
  if (Array.isArray(val)) return 'list'
  if (typeof val === 'object') return 'dict'
  return 'other'
}

const TYPE_STYLES: Record<PythonType, string> = {
  int: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  float: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  str: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  bool: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  list: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  dict: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  NoneType: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  other: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
}

function formatValuePreview(val: unknown, type: PythonType): string {
  if (type === 'NoneType') return 'None'
  if (type === 'bool') return val ? 'True' : 'False'
  if (type === 'str') {
    const strVal = String(val)
    return `"${strVal.length > 60 ? strVal.slice(0, 60) + '…' : strVal}"`
  }
  if (type === 'int' || type === 'float') return String(val)
  if (type === 'list') return `[…] (${Array.isArray(val) ? val.length : 0} Elemente)`
  if (type === 'dict') return `{…} (${val && typeof val === 'object' ? Object.keys(val).length : 0} Schlüssel)`
  return JSON.stringify(val).slice(0, 60)
}

function isSimpleType(type: PythonType) {
  return type === 'int' || type === 'float' || type === 'bool' || type === 'NoneType'
}

function VariableRow({ varKey, val }: { varKey: string; val: unknown }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const type = getPythonType(val)
  const simple = isSimpleType(type)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`{{ ${varKey} }}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="border border-line rounded-xl overflow-hidden bg-canvas">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={handleCopy}
          title={`{{ ${varKey} }} kopieren`}
          className="flex items-center gap-1.5 group shrink-0"
        >
          <span className="font-mono font-semibold text-xs text-primary group-hover:text-amber-300 transition-colors">
            {varKey}
          </span>
          <span className="opacity-0 group-hover:opacity-60 transition-opacity">
            {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          </span>
        </button>

        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${TYPE_STYLES[type]}`}>
          {type}
        </span>

        {simple ? (
          <span className="text-xs text-ink ml-1 font-mono truncate flex-1">
            {formatValuePreview(val, type)}
          </span>
        ) : (
          <span className="text-xs text-ghost ml-1 flex-1 truncate font-mono">
            {formatValuePreview(val, type)}
          </span>
        )}

        {!simple && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-ghost hover:text-muted transition-colors ml-auto shrink-0"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {!simple && expanded && (
        <pre className="text-[11px] font-mono text-ink/80 bg-raised border-t border-line px-3 py-2 overflow-x-auto whitespace-pre-wrap max-h-48">
          {JSON.stringify(val, null, 2)}
        </pre>
      )}
    </div>
  )
}

interface Props {
  config: ArbeitsblattConfig
  activeTab: string
  setActiveTab: (tab: string) => void
  updateConfig: <K extends keyof ArbeitsblattConfig>(key: K, value: ArbeitsblattConfig[K]) => void
  pythonError: string | null
  pythonVars: Record<string, unknown> | null
  onConfigChange: (newConfig: ArbeitsblattConfig) => void
}

export default function ArbeitsblattTabs({
  config,
  activeTab,
  setActiveTab,
  updateConfig,
  pythonError,
  pythonVars,
  onConfigChange
}: Props) {
  return (
    <div className="h-full min-h-0 w-full lg:w-[480px] xl:w-[540px] 2xl:w-[620px] shrink-0 min-w-0 flex flex-col gap-4 pr-0 lg:pr-2">
      <Tabs
        activeTab={activeTab}
        onChange={setActiveTab}
        tabs={[
          { id: 'template', label: 'Template', icon: <Code size={16} /> },
          { id: 'python', label: 'Logik', icon: <Terminal size={16} /> },
          { id: 'layout', label: 'Layout', icon: <Layout size={16} /> },
          { id: 'vars', label: 'Variablen', icon: <FileJson size={16} /> },
          { id: 'presets', label: 'Presets', icon: <Settings size={16} /> },
        ]}
      >
        <TabContent id="template" activeTab={activeTab}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
              <Info size={16} className="shrink-0" />
              <p>Nutze <b>Jinja2-Syntax</b> (<code>{"{{ var }}"}</code>), um Python-Variablen einzubinden.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>LaTeX / Jinja2 Template</Label>
              <CodeEditor
                value={config.template_text}
                onChange={(v) => updateConfig('template_text', v)}
                language="latex"
                theme="eclipse"
                height="500px"
              />
            </div>
          </div>
        </TabContent>

        <TabContent id="python" activeTab={activeTab}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
              <Terminal size={16} className="shrink-0" />
              <p>Alle hier definierten Variablen stehen im Template zur Verfügung.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Zufalls-Seed</Label>
              <Input
                value={config.random_seed ?? ''}
                onChange={(e) => updateConfig('random_seed', e.target.value)}
                placeholder="Wird beim Generieren automatisch gesetzt"
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Python-Code</Label>
              <CodeEditor
                value={config.python_code}
                onChange={(v) => updateConfig('python_code', v)}
                language="python"
                theme="chrome"
                height="400px"
              />
            </div>
            {pythonError && (
              <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-200 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle size={14} /> Python Fehler
                </div>
                <pre className="overflow-x-auto">{pythonError}</pre>
              </div>
            )}
            {pythonVars && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} /> Code erfolgreich ausgeführt.
              </div>
            )}
          </div>
        </TabContent>

        <TabContent id="layout" activeTab={activeTab}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Arbeitsblatt-Titel</Label>
                <Input value={config.header_title} onChange={(e) => updateConfig('header_title', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label>Titelabstand</Label>
                  <Input value={config.header_title_spacing} onChange={(e) => updateConfig('header_title_spacing', e.target.value)} />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    type="checkbox"
                    checked={config.header_title_visible}
                    onChange={(e) => updateConfig('header_title_visible', e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <Label className="mb-0">Titel anzeigen</Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Klasse</Label>
                <Input value={config.header_class} onChange={(e) => updateConfig('header_class', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Dozent</Label>
                <Input value={config.header_dozent} onChange={(e) => updateConfig('header_dozent', e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Fach</Label>
              <Input value={config.header_subject} onChange={(e) => updateConfig('header_subject', e.target.value)} />
            </div>

            <div className="space-y-3 pt-4 border-t border-line">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.add_qrcode} onChange={e => updateConfig('add_qrcode', e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-ink">QR-Code Platzhalter</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.pakete_laden} onChange={e => updateConfig('pakete_laden', e.target.checked)} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-ink">Standardpakete laden</span>
              </label>
              <FontSelector value={config.font_family} onChange={v => updateConfig('font_family', v)} />
            </div>
          </div>
        </TabContent>

        <TabContent id="vars" activeTab={activeTab}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <Copy size={14} className="shrink-0" />
              <p>Klicke auf einen Variablennamen um <b className="font-mono">{"{{ var }}"}</b> zu kopieren.</p>
            </div>
            {pythonVars ? (
              <div className="space-y-1.5">
                {Object.entries(pythonVars).map(([key, val]) => (
                  <VariableRow key={key} varKey={key} val={val} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-ghost text-sm">
                Noch kein Code ausgeführt.
              </div>
            )}
          </div>
        </TabContent>

        <TabContent id="presets" activeTab={activeTab}>
          <PresetManager
            generator="arbeitsblatt"
            currentConfig={config}
            onLoad={onConfigChange}
          />
        </TabContent>
      </Tabs>
    </div>
  )
}
