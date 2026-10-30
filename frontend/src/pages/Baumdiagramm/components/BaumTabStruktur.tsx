// SPDX-License-Identifier: AGPL-3.0-or-later

import { Calculator, Info, Zap } from 'lucide-react'
import { Button, Card, Label, NumberInput, Slider } from '../../../components/ui'
import type { BaumConfigUpdater, Config } from '../typesBaum'
import { SecHead, Chk } from './BaumControls'

interface BaumTabStrukturProps {
  config: Config;
  updateConfig: BaumConfigUpdater;
  bernoulliN: number;
  setBernoulliN: (v: number) => void;
  binomialN: number;
  setBinomialN: (v: number) => void;
  binomialP: number;
  setBinomialP: (v: number) => void;
  binomialAnnotate: boolean;
  setBinomialAnnotate: (v: boolean) => void;
  onApplyBernoulli: (n: number) => void;
  onApplyBinomial: (n: number, p: number, annotate: boolean) => void;
}

export const BaumTabStruktur = ({
  config,
  updateConfig,
  bernoulliN,
  setBernoulliN,
  binomialN,
  setBinomialN,
  binomialP,
  setBinomialP,
  binomialAnnotate,
  setBinomialAnnotate,
  onApplyBernoulli,
  onApplyBinomial
}: BaumTabStrukturProps) => {
  return (
    <div className="space-y-8">
      {/* ---- Schnellkonfiguration ---- */}
      <div>
        <SecHead>Schnellkonfiguration</SecHead>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">

          {/* Bernoulli Shortcut */}
          <div className="bg-raised/40 border border-primary/25 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Zap size={15} className="text-primary" /></div>
              <h4 className="text-sm font-semibold text-ink">Bernoulli-Shortcut</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Erstellt sofort einen 2-Äste-Baum mit{' '}
              <code className="bg-panel px-1 rounded text-xs">p</code> /&thinsp;
              <code className="bg-panel px-1 rounded text-xs">1-p</code> und den Labels
              {' '}"T"&thinsp;/&thinsp;"N" (Treffer / Niete).
            </p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Label className="text-metadata">Stufen (n)</Label>
                <NumberInput min="1" max="5" value={bernoulliN} onChange={e => setBernoulliN(parseInt(e.target.value) || 2)} />
              </div>
              <Button onClick={() => onApplyBernoulli(bernoulliN)} className="flex items-center gap-1.5 shrink-0">
                <Zap size={14} /> Erstellen
              </Button>
            </div>
          </div>

          {/* Binomial Wizard */}
          <div className="bg-raised/40 border border-primary/25 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10"><Calculator size={15} className="text-primary" /></div>
              <h4 className="text-sm font-semibold text-ink">Binomialbaum-Assistent</h4>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Generiert einen vollständigen n-stufigen Bernoulli-Baum mit berechneten Pfadwahrscheinlichkeiten.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-metadata">Stufen (n)</Label>
                <NumberInput min="1" max="5" value={binomialN} onChange={e => setBinomialN(parseInt(e.target.value) || 2)} />
              </div>
              <div>
                <Label className="text-metadata">Wahrsch. (p)</Label>
                <NumberInput min="0" max="1" step="0.05" value={binomialP} onChange={e => setBinomialP(parseFloat(e.target.value) || 0.5)} />
              </div>
            </div>
            <Chk checked={binomialAnnotate} onChange={setBinomialAnnotate} label="P(X=k) am Ergebnis anzeigen" />
            <Button onClick={() => onApplyBinomial(binomialN, binomialP, binomialAnnotate)} className="w-full flex items-center justify-center gap-1.5">
              <Calculator size={14} /> Baum generieren
            </Button>
          </div>

        </div>
      </div>

      <div>
        <SecHead>Baum-Modus</SecHead>
        <div className="flex gap-2 mt-1">
            {(['Symmetrisch (Standard)', 'Flexibel (Individuell)'] as const).map(m => (
            <button key={m} onClick={() => updateConfig('mode', m)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${config.mode === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-raised text-muted hover:bg-overlay'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Slider label="Maximale Tiefe (Stufen)" min={1} max={5} value={config.max_depth} onChange={v => updateConfig('max_depth', v)} />
        {config.mode === 'Symmetrisch (Standard)' && (
          <Slider label="Zweige pro Knoten" min={1} max={5} value={config.branches_global} onChange={v => updateConfig('branches_global', v)} />
        )}
      </div>

      <Card className="p-4 border-line bg-secondary/5 border-l-4 border-l-secondary">
        <div className="flex gap-3">
          <Info className="text-secondary shrink-0" size={20} />
          <p className="text-sm text-ink">
            {config.mode === 'Symmetrisch (Standard)'
              ? `Jeder Knoten hat genau ${config.branches_global} Äste.`
              : 'Du kannst die Anzahl der Äste für jeden Knoten im Reiter „Inhalt“ individuell einstellen.'}
          </p>
        </div>
      </Card>
    </div>
  )
}
