// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'
import { AlertTriangle, Users, Play } from 'lucide-react'
import { Card, SecHead, Button } from '../../../components/ui'

interface SitzplanStatusSidebarProps {
  studentsCount: number
  availableSeatsCount: number
  isLoading: boolean
  handleCalculate: () => void
}

const SitzplanStatusSidebar: React.FC<SitzplanStatusSidebarProps> = ({
  studentsCount,
  availableSeatsCount,
  isLoading,
  handleCalculate
}) => {
  return (
    <div className="space-y-6 text-slate-50">
      <Card className="p-6 bg-panel/50 border-line/50 backdrop-blur-md">
        <SecHead icon={<AlertTriangle size={14} />}>Status</SecHead>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Zugeordnete Schüler</span>
            <span className="font-display text-primary font-bold">{studentsCount}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted">Verfügbare Plätze</span>
            <span className="font-display text-emerald-500 font-bold">{availableSeatsCount}</span>
          </div>
          <div className="w-full bg-raised h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full transition-all duration-500 ${availableSeatsCount < studentsCount ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, (studentsCount / (availableSeatsCount || 1)) * 100)}%` }}
            />
          </div>

          {availableSeatsCount < studentsCount && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex gap-3 text-red-400 animate-pulse">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="text-xs font-medium leading-relaxed">
                Warnung: Nicht genügend Sitzplätze für alle Schüler definiert! Bitte Layout anpassen.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-panel/50 border-line/50 backdrop-blur-md">
        <SecHead icon={<Users size={14} />}>Legende</SecHead>
        <div className="space-y-3 text-caption pt-4">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-emerald-500/20 border border-emerald-500/50 rounded-md" />
            <span>Frontwunsch erfüllt</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-amber-500/20 border border-amber-500/50 rounded-md" />
            <span>Nachbarwunsch erfüllt</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500/20 border border-red-500/50 rounded-md" />
            <span>Abneigung verletzt</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-raised border border-rim rounded-md" />
            <span>Neutral</span>
          </div>
        </div>
      </Card>

      <Button
        onClick={handleCalculate}
        disabled={isLoading || studentsCount === 0 || availableSeatsCount < studentsCount}
        className="w-full py-4 flex items-center justify-center gap-3 text-lg shadow-lg shadow-primary/20 transition-transform active:scale-95"
      >
        {isLoading ? <span className="animate-spin"><Play size={20} /></span> : <Play size={20} />}
        {isLoading ? 'Berechne...' : 'Berechnen'}
      </Button>
    </div>
  )
}

export default SitzplanStatusSidebar
