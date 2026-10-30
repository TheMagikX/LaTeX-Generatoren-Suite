// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useState, useMemo } from 'react'
import { Plus, MapPin, Grid3X3, Trash2 } from 'lucide-react'
import { SecHead, Field, Input, NumberInput, Button, Accordion } from '../../../components/ui'
import type { SchaltplanConfig, CircuitNode } from '../typesSchalt'

interface SchaltTabNodesProps {
  config: SchaltplanConfig
  setConfig: React.Dispatch<React.SetStateAction<SchaltplanConfig>>
}

export const SchaltTabNodes: React.FC<SchaltTabNodesProps> = ({ config, setConfig }) => {
  const [newNode, setNewNode] = useState({ name: '', x: 0, y: 0 })
  const [grid, setGrid] = useState({ cols: 3, rows: 2, spacing: 3 })

  const nextAutoName = useMemo(() => {
    const existing = new Set(config.nodes.map(n => n.name))
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    for (let i = 0; i < 100; i++) {
      const suffix = i === 0 ? '' : (i + 1).toString()
      for (const char of alphabet) {
        const name = char + suffix
        if (!existing.has(name)) return name
      }
    }
    return "N1"
  }, [config.nodes])

  const addNode = () => {
    const name = newNode.name.trim() || nextAutoName
    setConfig(prev => ({
      ...prev,
      nodes: [...prev.nodes, { ...newNode, name, id: crypto.randomUUID() }]
    }))
    setNewNode({ name: '', x: 0, y: 0 })
  }

  const createGrid = () => {
    const existing = new Set(config.nodes.map(n => n.name))
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const newNodes: CircuitNode[] = []

    let charIdx = 0
    let suffixIdx = 0

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        let name = ''
        while (true) {
          const suffix = suffixIdx === 0 ? '' : (suffixIdx + 1).toString()
          name = alphabet[charIdx] + suffix
          charIdx++
          if (charIdx >= 26) {
            charIdx = 0
            suffixIdx++
          }
          if (!existing.has(name)) break
        }

        newNodes.push({
          id: crypto.randomUUID(),
          name,
          x: c * grid.spacing,
          y: -r * grid.spacing
        })
        existing.add(name)
      }
    }

    setConfig(prev => ({ ...prev, nodes: [...prev.nodes, ...newNodes] }))
  }

  const removeNode = (id: string) => {
    const node = config.nodes.find(n => n.id === id)
    if (!node) return
    setConfig(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== id),
      components: prev.components.filter(c => c.from_node !== node.name && c.to_node !== node.name)
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <SecHead icon={<Plus size={14} />}>Knoten anlegen</SecHead>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Name">
            <Input
              value={newNode.name || nextAutoName}
              onChange={e => setNewNode(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. A"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="X">
              <NumberInput
                value={newNode.x}
                onChange={e => setNewNode(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                step={0.5}
              />
            </Field>
            <Field label="Y">
              <NumberInput
                value={newNode.y}
                onChange={e => setNewNode(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                step={0.5}
              />
            </Field>
          </div>
        </div>
        <Button onClick={addNode} className="w-full flex items-center justify-center gap-2">
          <MapPin size={16} /> Knoten hinzufügen
        </Button>
      </div>

      <Accordion title="Schnell-Gitter" icon={<Grid3X3 size={16} />}>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Field label="Spalten">
            <NumberInput value={grid.cols} onChange={e => setGrid(p => ({ ...p, cols: parseInt(e.target.value) }))} min={1} />
          </Field>
          <Field label="Zeilen">
            <NumberInput value={grid.rows} onChange={e => setGrid(p => ({ ...p, rows: parseInt(e.target.value) }))} min={1} />
          </Field>
          <Field label="Abstand">
            <NumberInput value={grid.spacing} onChange={e => setGrid(p => ({ ...p, spacing: parseFloat(e.target.value) }))} step={0.5} />
          </Field>
        </div>
        <Button onClick={createGrid} className="w-full variant-outline">Gitter erzeugen</Button>
      </Accordion>

      <div>
        <div className="flex justify-between items-center mb-4">
          <SecHead>Liste der Knoten</SecHead>
          <button
            onClick={() => { if (confirm('Alle Knoten löschen?')) setConfig(p => ({ ...p, nodes: [], components: [] })) }}
            className="text-red-400 hover:text-red-300 text-caption"
          >
            Alle löschen
          </button>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {config.nodes.map(node => (
            <div key={node.id} className="flex items-center gap-2 p-2 bg-raised/50 border border-rim/50 rounded-lg">
              <div className="flex-1 font-display text-sm font-bold text-primary">{node.name}</div>
              <div className="text-xs text-muted">({node.x}, {node.y})</div>
              <button onClick={() => removeNode(node.id)} className="p-1 text-ghost hover:text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {config.nodes.length === 0 && (
            <div className="text-center py-4 text-ghost text-sm italic">Noch keine Knoten angelegt</div>
          )}
        </div>
      </div>
    </div>
  )
}
