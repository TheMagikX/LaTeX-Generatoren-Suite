// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { Copy, Check, Table } from 'lucide-react'
import type { Config } from '../typesBaum'
import { getAllPaths, calcPathProb, formatProb } from '../utilsBaum'

interface BaumPfadTabelleProps {
  config: Config
}

const stripMath = (s: string) => s.replace(/^\$+|\$+$/g, '').trim()

const probToLatex = (p: number): string => {
  const f = formatProb(p)
  if (f.includes('/')) {
    const [n, d] = f.split('/')
    return `\\frac{${n}}{${d}}`
  }
  return f
}

export const BaumPfadTabelle = ({ config }: BaumPfadTabelleProps) => {
  const [copied, setCopied] = useState(false)
  const [showLatex, setShowLatex] = useState(false)

  const allPaths = getAllPaths(config, 'root', 0)

  const getNodeLabel = (pid: string): string => {
    if (pid === 'root') return config.root_node.label
    return config.nodes[pid]?.label || pid
  }

  const getEdgeLabelDisplay = (pid: string): string => {
    const nodeCfg = config.nodes[pid]
    if (!nodeCfg) return '?'
    if (config.use_numeric_probs) {
      const p = nodeCfg.prob_value
      return p !== null ? formatProb(p) : '?'
    }
    return stripMath(nodeCfg.edge_label)
      .replace(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/g, '$1/$2') || '?'
  }

  const getEdgeLabelLatex = (pid: string): string => {
    const nodeCfg = config.nodes[pid]
    if (!nodeCfg) return '?'
    if (config.use_numeric_probs) {
      const p = nodeCfg.prob_value
      return p !== null ? probToLatex(p) : '?'
    }
    return stripMath(nodeCfg.edge_label) || '?'
  }

  const totalProb = allPaths.reduce((sum, path) => {
    const p = calcPathProb(config, path)
    return p !== null ? sum + p : sum
  }, 0)
  const totalRounded = Math.round(totalProb * 1e6) / 1e6
  const totalOk = Math.abs(totalRounded - 1) < 0.001

  const generateLatex = (): string => {
    const rows = allPaths.map((path, i) => {
      const pathStr = path.map(getNodeLabel).join(' \\rightarrow ')
      const edgeStr = path.slice(1).map(getEdgeLabelLatex).join(' \\cdot ')
      const pVal = calcPathProb(config, path)
      const pStr = pVal !== null ? probToLatex(pVal) : '?'
      const leafId = path[path.length - 1]
      const result = stripMath(config.results[leafId] || '') || '{---}'
      return `  ${i + 1} & $${pathStr}$ & $${edgeStr}$ & $${pStr}$ & ${result} \\\\`
    }).join('\n')

    const sigmaStr = probToLatex(totalRounded)

    return [
      '\\begin{tabular}{rlllc}',
      '  \\hline',
      '  \\# & Pfad & Kanten-Wskt. & $P(\\text{Pfad})$ & Ergebnis \\\\',
      '  \\hline',
      rows,
      '  \\hline',
      `  & & & $\\Sigma = ${sigmaStr}$ & \\\\`,
      '  \\hline',
      '\\end{tabular}',
    ].join('\n')
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateLatex())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-section-label">Pfadwahrscheinlichkeits-Tabelle</h3>
          <p className="text-[10px] text-muted mt-0.5">
            {allPaths.length} Pfade · Σ ={' '}
            <span className={totalOk ? 'text-green-400' : 'text-warning'}>
              {formatProb(totalRounded)}
            </span>
          </p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-raised hover:bg-overlay border border-line rounded-lg text-muted hover:text-ink transition-all"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? 'Kopiert!' : 'LaTeX kopieren'}
        </button>
      </div>

      {allPaths.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted bg-raised/10 rounded-2xl border border-dashed border-line">
          <Table size={24} className="mb-2 opacity-20" />
          <p className="text-sm">Keine Pfade vorhanden.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-raised/60 border-b border-line">
                <th className="px-3 py-2 text-left text-muted font-medium w-8">#</th>
                <th className="px-3 py-2 text-left text-muted font-medium">Pfad</th>
                <th className="px-3 py-2 text-left text-muted font-medium">Kanten-P</th>
                <th className="px-3 py-2 text-left text-muted font-medium font-mono">P(Pfad)</th>
                <th className="px-3 py-2 text-left text-muted font-medium">Ergebnis</th>
              </tr>
            </thead>
            <tbody>
              {allPaths.map((path, i) => {
                const leafId = path[path.length - 1]
                const pVal = calcPathProb(config, path)
                const pathStr = path.map(getNodeLabel).join(' → ')
                const edgeStr = path.slice(1).map(getEdgeLabelDisplay).join(' · ')
                const result = stripMath(config.results[leafId] || '')

                return (
                  <tr
                    key={leafId}
                    className={`border-b border-line/50 hover:bg-raised/30 transition-colors ${config.highlights[leafId]?.enabled ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-3 py-2 text-ghost font-mono">{i + 1}</td>
                    <td className="px-3 py-2 text-ink font-medium">{pathStr}</td>
                    <td className="px-3 py-2 text-muted font-mono">{edgeStr}</td>
                    <td className="px-3 py-2 text-primary font-mono font-bold">
                      {pVal !== null ? formatProb(pVal) : '?'}
                    </td>
                    <td className="px-3 py-2 text-ghost text-[10px]">{result || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-raised/40 border-t border-line">
                <td colSpan={3} className="px-3 py-2 text-right text-muted text-[10px] font-medium">
                  Summe aller Pfade
                </td>
                <td className={`px-3 py-2 font-mono font-bold ${totalOk ? 'text-green-400' : 'text-warning'}`}>
                  {formatProb(totalRounded)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <button
        onClick={() => setShowLatex(v => !v)}
        className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors select-none py-1"
      >
        <span className={`inline-block transition-transform duration-150 ${showLatex ? 'rotate-90' : ''}`}>▶</span>
        LaTeX-Code {showLatex ? 'verbergen' : 'anzeigen'}
      </button>

      {showLatex && (
        <pre className="bg-raised/30 border border-line rounded-xl p-4 text-[10px] font-mono text-muted overflow-x-auto animate-in fade-in slide-in-from-top-1 duration-200">
          {generateLatex()}
        </pre>
      )}
    </div>
  )
}
