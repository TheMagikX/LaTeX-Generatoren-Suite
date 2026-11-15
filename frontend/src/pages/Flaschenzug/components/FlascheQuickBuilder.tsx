// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { Wand2 } from 'lucide-react'
import type { FlaschenzugConfig } from '../typesFlasche'
import {
  buildFlaschenzugTemplate,
  type PotenzStufenCount,
  type TragendeSeileCount,
} from '../templatesFlasche'

interface FlascheQuickBuilderProps {
  onApply: (config: FlaschenzugConfig) => void
}

const BUTTON_CLASS =
  'h-8 rounded-lg border border-line bg-raised px-2.5 text-xs font-medium text-ink hover:bg-overlay hover:border-primary/50 transition-colors'

const SELECT_CLASS =
  'h-8 rounded-lg border border-line bg-raised px-2 text-xs font-medium text-ink focus:outline-none focus:border-primary/50'

export const FlascheQuickBuilder: React.FC<FlascheQuickBuilderProps> = ({ onApply }) => {
  const [tragendeSeile, setTragendeSeile] = useState<TragendeSeileCount>(4)
  const [potenzStufen, setPotenzStufen] = useState<PotenzStufenCount>(3)

  return (
    <div className="rounded-xl border border-line bg-surface p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted mr-1">
          <Wand2 size={14} className="text-primary" />
          Schnellaufbau:
        </span>

        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => onApply(buildFlaschenzugTemplate('feste_rolle'))}
        >
          Feste Rolle
        </button>

        <button
          type="button"
          className={BUTTON_CLASS}
          onClick={() => onApply(buildFlaschenzugTemplate('lose_rolle'))}
        >
          Lose Rolle
        </button>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            className={BUTTON_CLASS}
            onClick={() =>
              onApply(buildFlaschenzugTemplate('flaschenzug_n', { tragendeSeile }))
            }
          >
            Flaschenzug
          </button>
          <select
            aria-label="Anzahl tragender Seile"
            className={SELECT_CLASS}
            value={tragendeSeile}
            onChange={(e) => setTragendeSeile(Number(e.target.value) as TragendeSeileCount)}
          >
            <option value={2}>2 Seile</option>
            <option value={3}>3 Seile</option>
            <option value={4}>4 Seile</option>
            <option value={6}>6 Seile</option>
          </select>
        </div>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            className={BUTTON_CLASS}
            onClick={() =>
              onApply(buildFlaschenzugTemplate('potenzflaschenzug', { potenzStufen }))
            }
          >
            Potenzflaschenzug
          </button>
          <select
            aria-label="Anzahl loser Rollen"
            className={SELECT_CLASS}
            value={potenzStufen}
            onChange={(e) => setPotenzStufen(Number(e.target.value) as PotenzStufenCount)}
          >
            <option value={2}>2 lose Rollen</option>
            <option value={3}>3 lose Rollen</option>
          </select>
        </div>
      </div>
    </div>
  )
}
