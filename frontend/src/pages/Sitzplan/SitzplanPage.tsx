// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useMemo } from 'react'
import { Users, Layout, Target, Scale, Play } from 'lucide-react'
import useLocalStorage from '../../hooks/useLocalStorage'
import { solveSitzplan } from '../../api/client'
import { Card } from '../../components/ui'
import { Tabs, TabContent } from '../../components/Tabs'

import type { SitzplanConfig, SitzplanResponse } from './typesSitz'
import { DEFAULT_SITZPLAN_CONFIG } from './constantsSitz'

import SitzplanHeader from './components/SitzplanHeader'
import SitzplanStudentsTab from './components/SitzplanStudentsTab'
import SitzplanLayoutTab from './components/SitzplanLayoutTab'
import SitzplanPrefsTab from './components/SitzplanPrefsTab'
import SitzplanRulesTab from './components/SitzplanRulesTab'
import SitzplanResultTab from './components/SitzplanResultTab'
import SitzplanStatusSidebar from './components/SitzplanStatusSidebar'

const SitzplanPage: React.FC = () => {
  const [config, setConfig] = useLocalStorage<SitzplanConfig>('sitzplan_config', DEFAULT_SITZPLAN_CONFIG)
  const [result, setResult] = useState<SitzplanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('students')

  const updateConfig = (updates: Partial<SitzplanConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const handleCalculate = async () => {
    setIsLoading(true)
    try {
      const resp = await solveSitzplan({
        students: config.students,
        layout: {
          ...config.layout,
          blocked_seats: [] // Backend handles this if needed
        },
        w_front: config.wFront,
        w_neighbor: config.wNeighbor,
        include_vertical: config.includeVertical,
        include_diagonal: config.includeDiagonal,
        mutual_factor: config.mutualFactor,
        dislike_distance: config.dislikeDistance,
        hard_rules: config.hardRules
      })
      setResult(resp)
      setActiveTab('result')
    } catch (err) {
      console.error(err)
      alert("Fehler bei der Berechnung.")
    } finally {
      setIsLoading(false)
    }
  }

  const availableSeatsCount = useMemo(() => {
    return config.layout.matrix.flat().filter(v => v === 1).length
  }, [config.layout.matrix])

  const handleReset = () => {
    setConfig(DEFAULT_SITZPLAN_CONFIG)
    setResult(null)
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <SitzplanHeader onReset={handleReset} />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Left: Configuration */}
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <Tabs
              activeTab={activeTab}
              onChange={setActiveTab}
              tabs={[
                { id: 'students', label: '👥 Schüler', icon: <Users size={16} /> },
                { id: 'layout', label: '🪑 Layout', icon: <Layout size={16} /> },
                { id: 'prefs', label: '🎯 Wünsche', icon: <Target size={16} /> },
                { id: 'rules', label: '⚖️ Regeln', icon: <Scale size={16} /> },
                { id: 'result', label: '🚀 Ergebnis', icon: <Play size={16} /> },
              ]}
            >
              <TabContent id="students" activeTab={activeTab}>
                <SitzplanStudentsTab 
                  students={config.students} 
                  setStudents={s => updateConfig({ students: s })}
                  availableSeatsCount={availableSeatsCount}
                />
              </TabContent>

              <TabContent id="layout" activeTab={activeTab}>
                <SitzplanLayoutTab 
                  layout={config.layout}
                  setLayout={l => updateConfig({ layout: l })}
                />
              </TabContent>

              <TabContent id="prefs" activeTab={activeTab}>
                <SitzplanPrefsTab 
                  students={config.students}
                  setStudents={s => updateConfig({ students: s })}
                  wFront={config.wFront}
                  setWFront={v => updateConfig({ wFront: v })}
                  wNeighbor={config.wNeighbor}
                  setWNeighbor={v => updateConfig({ wNeighbor: v })}
                  includeVertical={config.includeVertical}
                  setIncludeVertical={v => updateConfig({ includeVertical: v })}
                  includeDiagonal={config.includeDiagonal}
                  setIncludeDiagonal={v => updateConfig({ includeDiagonal: v })}
                  mutualFactor={config.mutualFactor}
                  setMutualFactor={v => updateConfig({ mutualFactor: v })}
                  dislikeDistance={config.dislikeDistance}
                  setDislikeDistance={v => updateConfig({ dislikeDistance: v })}
                />
              </TabContent>

              <TabContent id="rules" activeTab={activeTab}>
                <SitzplanRulesTab 
                  students={config.students}
                  hardRules={config.hardRules}
                  setHardRules={r => updateConfig({ hardRules: r })}
                />
              </TabContent>

              <TabContent id="result" activeTab={activeTab}>
                <SitzplanResultTab 
                  result={result}
                  isLoading={isLoading}
                  handleCalculate={handleCalculate}
                  layout={config.layout}
                  studentsCount={config.students.length}
                />
              </TabContent>
            </Tabs>
          </Card>
        </div>

        {/* Right: Info / Summary */}
        <SitzplanStatusSidebar 
          studentsCount={config.students.length}
          availableSeatsCount={availableSeatsCount}
          isLoading={isLoading}
          handleCalculate={handleCalculate}
        />
      </div>
    </div>
  )
}

export default SitzplanPage
