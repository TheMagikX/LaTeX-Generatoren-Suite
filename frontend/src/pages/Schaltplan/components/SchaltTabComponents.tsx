// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState } from 'react'
import { Plus, Cpu } from 'lucide-react'
import { SecHead, Field, Input, Button, Collapsible } from '../../../components/ui'
import { COMP_TYPES } from '../constantsSchalt'
import type { SchaltplanConfig } from '../typesSchalt'

interface SchaltTabComponentsProps {
  config: SchaltplanConfig
  setConfig: React.Dispatch<React.SetStateAction<SchaltplanConfig>>
}

export const SchaltTabComponents: React.FC<SchaltTabComponentsProps> = ({ config, setConfig }) => {
  const [newComp, setNewComp] = useState({
    type_name: 'Draht (Verbindung)',
    from_node: '',
    to_node: '',
    label: '',
    value: '',
    style: ''
  })

  const defaultFromNode = config.nodes[0]?.name ?? ''
  const defaultToNode = config.nodes[1]?.name ?? ''
  const selectedFromNode = newComp.from_node || defaultFromNode
  const selectedToNode = newComp.to_node || defaultToNode

  const addComponent = () => {
    setConfig(prev => ({
      ...prev,
      components: [...prev.components, { ...newComp, from_node: selectedFromNode, to_node: selectedToNode, id: crypto.randomUUID() }]
    }))
  }

  const removeComponent = (id: string) => {
    setConfig(prev => ({
      ...prev,
      components: prev.components.filter(c => c.id !== id)
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <SecHead icon={<Plus size={14} />}>Bauteil hinzufügen</SecHead>
        <div className="space-y-3 mb-4">
          <Field label="Bauteil-Typ">
            <select
              value={newComp.type_name}
              onChange={e => setNewComp(prev => ({ ...prev, type_name: e.target.value }))}
              className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {COMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Von Knoten">
              <select
                value={selectedFromNode}
                onChange={e => setNewComp(prev => ({ ...prev, from_node: e.target.value }))}
                className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Wählen...</option>
                {config.nodes.map(n => <option key={n.id} value={n.name}>{n.name} ({n.x}, {n.y})</option>)}
              </select>
            </Field>
            <Field label="Nach Knoten">
              <select
                value={selectedToNode}
                disabled={newComp.type_name === 'Masse (Ground)'}
                onChange={e => setNewComp(prev => ({ ...prev, to_node: e.target.value }))}
                className="w-full bg-panel border border-line rounded-md px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-30"
              >
                <option value="">Wählen...</option>
                {config.nodes.map(n => <option key={n.id} value={n.name}>{n.name} ({n.x}, {n.y})</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name (l=)">
              <Input value={newComp.label} onChange={e => setNewComp(p => ({ ...p, label: e.target.value }))} placeholder="z.B. R1" />
            </Field>
            <Field label="Wert (a=)">
              <Input value={newComp.value} onChange={e => setNewComp(p => ({ ...p, value: e.target.value }))} placeholder="z.B. 100Ω" />
            </Field>
          </div>
        </div>
        <Button
          onClick={addComponent}
          disabled={!selectedFromNode || (!selectedToNode && newComp.type_name !== 'Masse (Ground)')}
          className="w-full flex items-center justify-center gap-2"
        >
          <Cpu size={16} /> Bauteil anfügen
        </Button>
      </div>

      <div>
        <SecHead>Bauteil-Liste</SecHead>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {config.components.map(comp => (
            <Collapsible
              key={comp.id}
              title={`${comp.type_name} ${comp.label ? `(${comp.label})` : ''}`}
              onRemove={() => removeComponent(comp.id)}
            >
              <div className="space-y-3">
                <Field label="Typ">
                  <select
                    value={comp.type_name}
                    onChange={e => {
                      const type = e.target.value
                      setConfig(p => ({
                        ...p,
                        components: p.components.map(c => c.id === comp.id ? { ...c, type_name: type, to_node: type === 'Masse (Ground)' ? '' : c.to_node } : c)
                      }))
                    }}
                    className="w-full bg-panel border border-line rounded-md px-2 py-1 text-xs text-ink"
                  >
                    {COMP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Von">
                    <select
                      value={comp.from_node}
                      onChange={e => {
                        const name = e.target.value
                        setConfig(p => ({
                          ...p,
                          components: p.components.map(c => c.id === comp.id ? { ...c, from_node: name } : c)
                        }))
                      }}
                      className="w-full bg-panel border border-line rounded-md px-2 py-1 text-xs text-ink"
                    >
                      {config.nodes.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Nach">
                    <select
                      value={comp.to_node}
                      disabled={comp.type_name === 'Masse (Ground)'}
                      onChange={e => {
                        const name = e.target.value
                        setConfig(p => ({
                          ...p,
                          components: p.components.map(c => c.id === comp.id ? { ...c, to_node: name } : c)
                        }))
                      }}
                      className="w-full bg-panel border border-line rounded-md px-2 py-1 text-xs text-ink disabled:opacity-30"
                    >
                      <option value="">-</option>
                      {config.nodes.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Label">
                    <Input
                      value={comp.label}
                      onChange={e => {
                        const val = e.target.value
                        setConfig(p => ({
                          ...p,
                          components: p.components.map(c => c.id === comp.id ? { ...c, label: val } : c)
                        }))
                      }}
                      className="h-8 text-xs"
                    />
                  </Field>
                  <Field label="Wert">
                    <Input
                      value={comp.value}
                      onChange={e => {
                        const val = e.target.value
                        setConfig(p => ({
                          ...p,
                          components: p.components.map(c => c.id === comp.id ? { ...c, value: val } : c)
                        }))
                      }}
                      className="h-8 text-xs"
                    />
                  </Field>
                </div>
              </div>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  )
}
