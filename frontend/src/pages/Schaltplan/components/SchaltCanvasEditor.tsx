// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useMemo, useState } from 'react'
import { Cpu, MapPin, MousePointer2, RotateCcw, Settings, Trash2 } from 'lucide-react'
import { Accordion, Field, Input } from '../../../components/ui'
import { COMP_TYPES } from '../constantsSchalt'
import type { CircuitComponent, CircuitNode, SchaltplanConfig } from '../typesSchalt'
import { SchaltSymbol } from './SchaltSymbol'
import {
  SCHALT_CANVAS_HEIGHT,
  SCHALT_CANVAS_PADDING,
  SCHALT_CANVAS_WIDTH,
  type CanvasPoint,
  type NodeHit,
  type SchaltCanvasMode,
  createSchaltNodeAt,
  findSchaltNodeHit,
  getNodeConnectionCount,
  getSchaltCanvasBounds,
  getSchaltGridLines,
  getSchaltPointerCanvasPoint,
  isJunctionNode,
  schaltCanvasToWorld,
  worldToSchaltCanvas,
} from '../utilsSchaltCanvas'

interface ContextMenuState {
  type: 'node' | 'component'
  targetId: string
  title: string
  x: number
  y: number
}

interface Props {
  config: SchaltplanConfig
  setConfig: React.Dispatch<React.SetStateAction<SchaltplanConfig>>
}

const MODE_OPTIONS: { value: SchaltCanvasMode; label: string; icon: React.ReactNode; title: string }[] = [
  { value: 'move', label: 'Bewegen', icon: <MousePointer2 size={14} />, title: 'Knoten verschieben' },
  { value: 'node', label: 'Knoten', icon: <MapPin size={14} />, title: 'Knoten auf dem Raster platzieren' },
  { value: 'component', label: 'Bauteil', icon: <Cpu size={14} />, title: 'Bauteil zwischen zwei Knoten setzen' },
]

const getComponentStroke = (typeName: string) => {
  if (typeName.includes('Widerstand')) return 'rgb(245,158,11)'
  if (typeName.includes('Spannungsquelle') || typeName === 'Batterie') return 'rgb(59,130,246)'
  if (typeName.includes('Schalter')) return 'rgb(168,85,247)'
  if (typeName.includes('Masse')) return 'rgb(20,184,166)'
  if (typeName.includes('Lampe') || typeName.includes('LED') || typeName.includes('Diode')) return 'rgb(248,113,113)'
  if (typeName === 'Voltmeter' || typeName === 'Amperemeter' || typeName === 'Messgerät') return 'rgb(16,185,129)'
  return 'rgb(148,163,184)'
}

const getNodeMap = (nodes: CircuitNode[]) => {
  const map = new Map<string, CircuitNode>()
  nodes.forEach(node => map.set(node.name, node))
  return map
}

export const SchaltCanvasEditor: React.FC<Props> = ({ config, setConfig }) => {
  const [mode, setMode] = useState<SchaltCanvasMode>('component')
  const [componentType, setComponentType] = useState('Draht (Verbindung)')
  const [componentLabel, setComponentLabel] = useState('')
  const [componentValue, setComponentValue] = useState('')
  const [pendingNode, setPendingNode] = useState<NodeHit | null>(null)
  const [dragging, setDragging] = useState<NodeHit | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [panOffset, setPanOffset] = useState<CanvasPoint>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; initialPan: CanvasPoint } | null>(null)

  const isEmpty = config.nodes.length === 0 && config.components.length === 0
  const [wasEmpty, setWasEmpty] = useState(isEmpty)
  if (isEmpty && !wasEmpty) {
    setWasEmpty(true)
    setPanOffset({ x: 0, y: 0 })
    setPendingNode(null)
    setContextMenu(null)
  } else if (!isEmpty && wasEmpty) {
    setWasEmpty(false)
  }

  const bounds = useMemo(() => getSchaltCanvasBounds(config, panOffset), [config, panOffset])
  const grid = useMemo(() => getSchaltGridLines(bounds), [bounds])
  const nodeMap = useMemo(() => getNodeMap(config.nodes), [config.nodes])

  const getCanvasPoint = (event: React.PointerEvent<SVGSVGElement>) =>
    getSchaltPointerCanvasPoint(event.clientX, event.clientY, event.currentTarget)

  const getWorldPoint = (event: React.PointerEvent<SVGSVGElement>) =>
    schaltCanvasToWorld(getCanvasPoint(event), bounds)

  const createComponent = (fromNode: string, toNode: string) => {
    if (componentType !== 'Masse (Ground)' && fromNode === toNode) return

    setConfig(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id: crypto.randomUUID(),
          type_name: componentType,
          from_node: fromNode,
          to_node: componentType === 'Masse (Ground)' ? '' : toNode,
          label: componentLabel,
          value: componentValue,
          style: '',
        },
      ],
    }))
  }

  const handleComponentTarget = (target: NodeHit) => {
    if (componentType === 'Masse (Ground)') {
      createComponent(target.name, '')
      setPendingNode(null)
      return
    }

    if (!pendingNode) {
      setPendingNode(target)
      return
    }

    createComponent(pendingNode.name, target.name)
    setPendingNode(null)
  }

  const handleNodePointerDown = (event: React.PointerEvent, node: CircuitNode) => {
    if (event.button !== 0) return
    event.stopPropagation()
    setContextMenu(null)

    const hit = { id: node.id, name: node.name }

    if (mode === 'move') {
      setDragging(hit)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (mode === 'component') {
      handleComponentTarget(hit)
    }
  }

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    setContextMenu(null)
    const canvasPoint = getCanvasPoint(event)
    const hit = findSchaltNodeHit(config, canvasPoint, bounds)

    if (mode === 'move') {
      if (hit) {
        setDragging(hit)
        event.currentTarget.setPointerCapture(event.pointerId)
      } else {
        setIsPanning(true)
        setPanStart({
          clientX: event.clientX,
          clientY: event.clientY,
          initialPan: { ...panOffset },
        })
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      return
    }

    if (mode === 'node') {
      if (hit) return
      const worldPoint = getWorldPoint(event)
      setConfig(prev => ({ ...prev, nodes: [...prev.nodes, createSchaltNodeAt(prev, worldPoint)] }))
      return
    }

    if (mode === 'component') {
      let target = hit
      if (!target) {
        const worldPoint = getWorldPoint(event)
        const newNode = createSchaltNodeAt(config, worldPoint)
        setConfig(prev => ({ ...prev, nodes: [...prev.nodes, newNode] }))
        target = { id: newNode.id, name: newNode.name }
      }
      handleComponentTarget(target)
      return
    }
  }

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      const point = getWorldPoint(event)
      setConfig(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => (node.id === dragging.id ? { ...node, x: point.x, y: point.y } : node)),
      }))
      return
    }

    if (isPanning && panStart) {
      const innerW = SCHALT_CANVAS_WIDTH - SCHALT_CANVAS_PADDING * 2
      const innerH = SCHALT_CANVAS_HEIGHT - SCHALT_CANVAS_PADDING * 2
      const spanX = bounds.maxX - bounds.minX
      const spanY = bounds.maxY - bounds.minY

      const dxPixels = event.clientX - panStart.clientX
      const dyPixels = event.clientY - panStart.clientY

      const dxWorld = (dxPixels / innerW) * spanX
      const dyWorld = (dyPixels / innerH) * spanY

      setPanOffset({
        x: panStart.initialPan.x - dxWorld,
        y: panStart.initialPan.y + dyWorld,
      })
    }
  }

  const handleCanvasPointerUp = () => {
    setDragging(null)
    setIsPanning(false)
    setPanStart(null)
  }

  const removeNode = (nodeName: string) => {
    setConfig(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.name !== nodeName),
      components: prev.components.filter(component => component.from_node !== nodeName && component.to_node !== nodeName),
    }))
    setPendingNode(prev => (prev?.name === nodeName ? null : prev))
    setDragging(prev => (prev?.name === nodeName ? null : prev))
    setContextMenu(null)
  }

  const toggleNodeDot = (nodeName: string, value: boolean | null) => {
    setConfig(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.name === nodeName ? { ...n, show_dot: value } : n)),
    }))
  }

  const removeComponent = (componentId: string) => {
    setConfig(prev => ({
      ...prev,
      components: prev.components.filter(component => component.id !== componentId),
    }))
    setContextMenu(null)
  }

  const changeComponentType = (id: string, newType: string) => {
    setConfig(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === id
          ? {
              ...comp,
              type_name: newType,
              to_node: newType === 'Masse (Ground)' ? '' : comp.to_node,
            }
          : comp,
      ),
    }))
  }

  const updateComponentField = (id: string, field: 'label' | 'value', val: string) => {
    setConfig(prev => ({
      ...prev,
      components: prev.components.map(comp => (comp.id === id ? { ...comp, [field]: val } : comp)),
    }))
  }

  const handleComponentContextMenu = (event: React.MouseEvent, component: CircuitComponent) => {
    event.preventDefault()
    event.stopPropagation()
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const titleText = [component.type_name, component.label ? `(${component.label})` : ''].filter(Boolean).join(' ')
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top
    const x = Math.min(rawX, SCHALT_CANVAS_WIDTH - 220)
    const y = Math.min(rawY, SCHALT_CANVAS_HEIGHT - 210)

    setContextMenu({
      type: 'component',
      targetId: component.id,
      title: titleText,
      x: Math.max(10, x),
      y: Math.max(10, y),
    })
  }

  const handleNodeContextMenu = (event: React.MouseEvent, nodeName: string) => {
    event.preventDefault()
    event.stopPropagation()
    const svg = event.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top
    const x = Math.min(rawX, SCHALT_CANVAS_WIDTH - 180)
    const y = Math.min(rawY, SCHALT_CANVAS_HEIGHT - 100)

    setContextMenu({
      type: 'node',
      targetId: nodeName,
      title: `Knoten ${nodeName}`,
      x: Math.max(10, x),
      y: Math.max(10, y),
    })
  }

  const handleCanvasContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault()
    const canvasPoint = getSchaltPointerCanvasPoint(event.clientX, event.clientY, event.currentTarget)
    const hitNode = findSchaltNodeHit(config, canvasPoint, bounds)
    if (hitNode) {
      const rect = event.currentTarget.getBoundingClientRect()
      setContextMenu({
        type: 'node',
        targetId: hitNode.name,
        title: `Knoten ${hitNode.name}`,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
      return
    }

    setContextMenu(null)
  }

  const pendingLabel = pendingNode
    ? `${pendingNode.name} -> zweiter Punkt`
    : componentType === 'Masse (Ground)'
      ? 'Knoten anklicken'
      : 'Startpunkt anklicken'

  return (
    <Accordion title="Visueller Editor" icon={<Settings size={18} />} defaultOpen>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {MODE_OPTIONS.map(option => (
            <button
              key={option.value}
              type="button"
              title={option.title}
              onClick={() => {
                setMode(option.value)
                setPendingNode(null)
                setContextMenu(null)
              }}
              className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-colors ${mode === option.value
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-line bg-raised text-muted hover:bg-overlay hover:text-ink'
                }`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-[1fr_0.75fr_0.75fr_auto] items-end gap-2">
          <Field label="Bauteil-Typ">
            <select
              value={componentType}
              onChange={event => {
                setComponentType(event.target.value)
                setPendingNode(null)
              }}
              disabled={mode !== 'component'}
              className="h-10 w-full rounded-lg border border-line bg-raised px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
            >
              {COMP_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Label">
            <Input
              value={componentLabel}
              onChange={event => setComponentLabel(event.target.value)}
              disabled={mode !== 'component'}
              className="h-10 text-xs"
              placeholder="R1"
            />
          </Field>
          <Field label="Wert">
            <Input
              value={componentValue}
              onChange={event => setComponentValue(event.target.value)}
              disabled={mode !== 'component'}
              className="h-10 text-xs"
              placeholder="100Ω"
            />
          </Field>
          <button
            type="button"
            onClick={() => setPendingNode(null)}
            disabled={!pendingNode}
            title="Bauteil-Auswahl zurücksetzen"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised text-muted hover:bg-overlay hover:text-ink disabled:opacity-40"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        <div className="flex h-9 items-center justify-between gap-3 rounded-lg border border-line bg-raised/50 px-3 text-xs text-muted">
          <span>
            {mode === 'component'
              ? `${pendingLabel}; nur vorhandene Knoten werden verbunden.`
              : mode === 'node'
                ? 'Freie Rasterpunkte erzeugen Knoten.'
                : 'Knoten ziehen, Hintergrund ziehen verschiebt Ansicht.'}
          </span>
          <div className="flex items-center gap-3">
            {(panOffset.x !== 0 || panOffset.y !== 0) && (
              <button
                type="button"
                onClick={() => setPanOffset({ x: 0, y: 0 })}
                title="Ansicht auf (0,0) zurücksetzen"
                className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
              >
                <RotateCcw size={12} />
                <span>(0,0) zentrieren</span>
              </button>
            )}
            <span>{config.nodes.length} Knoten · {config.components.length} Bauteile</span>
          </div>
        </div>

        <div className="relative">
          <svg
            viewBox={`0 0 ${SCHALT_CANVAS_WIDTH} ${SCHALT_CANVAS_HEIGHT}`}
            className={`h-[420px] w-full touch-none select-none rounded-xl border border-line bg-canvas shadow-inner ${
              mode === 'move' ? (isPanning || dragging ? 'cursor-grabbing' : 'cursor-grab') : mode === 'node' ? 'cursor-crosshair' : 'cursor-pointer'
            }`}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            onPointerLeave={handleCanvasPointerUp}
            onContextMenu={handleCanvasContextMenu}
            role="img"
            aria-label="Visueller Schaltplan-Editor"
          >
          <rect width={SCHALT_CANVAS_WIDTH} height={SCHALT_CANVAS_HEIGHT} fill="transparent" />

          {grid.vertical.map(x => {
            const a = worldToSchaltCanvas({ x, y: bounds.minY }, bounds)
            const b = worldToSchaltCanvas({ x, y: bounds.maxY }, bounds)
            const isCenter = x === 0
            return (
              <g key={`vx-${x}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isCenter ? "rgba(59,130,246,0.35)" : "rgba(148,163,184,0.14)"}
                  strokeWidth={isCenter ? 1.5 : 1}
                />
                <text
                  x={a.x}
                  y={SCHALT_CANVAS_HEIGHT - 12}
                  textAnchor="middle"
                  className="fill-muted/50 text-[10px] select-none font-mono"
                >
                  {x}
                </text>
              </g>
            )
          })}
          {grid.horizontal.map(y => {
            const a = worldToSchaltCanvas({ x: bounds.minX, y }, bounds)
            const b = worldToSchaltCanvas({ x: bounds.maxX, y }, bounds)
            const isCenter = y === 0
            return (
              <g key={`hy-${y}`}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isCenter ? "rgba(59,130,246,0.35)" : "rgba(148,163,184,0.14)"}
                  strokeWidth={isCenter ? 1.5 : 1}
                />
                <text
                  x={16}
                  y={a.y + 3}
                  textAnchor="middle"
                  className="fill-muted/50 text-[10px] select-none font-mono"
                >
                  {y}
                </text>
              </g>
            )
          })}

          {config.components.map(component => {
            const fromNode = nodeMap.get(component.from_node)
            const toNode = nodeMap.get(component.to_node)
            if (!fromNode) return null

            const from = worldToSchaltCanvas(fromNode, bounds)
            const stroke = getComponentStroke(component.type_name)

            if (component.type_name === 'Masse (Ground)' || !toNode) {
              return (
                <g
                  key={component.id}
                  className="cursor-pointer"
                  onContextMenu={event => handleComponentContextMenu(event, component)}
                >
                  <line x1={from.x} y1={from.y} x2={from.x} y2={from.y + 30} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
                  <line x1={from.x - 14} y1={from.y + 30} x2={from.x + 14} y2={from.y + 30} stroke={stroke} strokeWidth={3} strokeLinecap="round" />
                  <line x1={from.x - 9} y1={from.y + 37} x2={from.x + 9} y2={from.y + 37} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
                  <line x1={from.x - 4} y1={from.y + 44} x2={from.x + 4} y2={from.y + 44} stroke={stroke} strokeWidth={2.5} strokeLinecap="round" />
                </g>
              )
            }

            const to = worldToSchaltCanvas(toNode, bounds)
            const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
            const dx = to.x - from.x
            const dy = to.y - from.y
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI

            return (
              <g
                key={component.id}
                className="cursor-pointer"
                onContextMenu={event => handleComponentContextMenu(event, component)}
              >
                <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={16} />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={stroke}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={component.type_name === 'Draht (Verbindung)' ? 0.6 : 0.9}
                />
                {component.type_name !== 'Draht (Verbindung)' && (
                  <SchaltSymbol
                    typeName={component.type_name}
                    mid={mid}
                    angle={angle}
                    stroke={stroke}
                    label={component.label}
                    value={component.value}
                  />
                )}
                {component.type_name === 'Draht (Verbindung)' && (component.label || component.value) && (
                  <text x={mid.x} y={mid.y - 14} textAnchor="middle" className="fill-muted text-[11px] font-semibold">
                    {[component.label, component.value].filter(Boolean).join(' ')}
                  </text>
                )}
              </g>
            )
          })}

          {pendingNode && nodeMap.get(pendingNode.name) && (
            <circle
              cx={worldToSchaltCanvas(nodeMap.get(pendingNode.name)!, bounds).x}
              cy={worldToSchaltCanvas(nodeMap.get(pendingNode.name)!, bounds).y}
              r={18}
              fill="none"
              stroke="rgb(59,130,246)"
              strokeDasharray="4 4"
              strokeWidth={2}
            />
          )}

          {config.nodes.map(node => {
            const center = worldToSchaltCanvas(node, bounds)
            const isPending = pendingNode?.id === node.id
            const hasJunctionDot = isJunctionNode(node, config.components)

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                onPointerDown={event => handleNodePointerDown(event, node)}
                onContextMenu={event => handleNodeContextMenu(event, node.name)}
              >
                <circle cx={center.x} cy={center.y} r={20} fill="transparent" />
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={15}
                  className={`transition-all duration-150 ${
                    isPending
                      ? 'fill-blue-500/20 stroke-blue-500 stroke-2'
                      : 'fill-transparent stroke-teal-400/0 group-hover:stroke-teal-400/60 group-hover:stroke-2 group-hover:fill-teal-400/10'
                  }`}
                />
                <circle
                  cx={center.x}
                  cy={center.y}
                  r={hasJunctionDot ? 4.5 : 7}
                  className={`transition-colors ${
                    isPending
                      ? 'fill-blue-500 stroke-slate-900 stroke-2'
                      : hasJunctionDot
                        ? 'fill-slate-100 stroke-slate-900 stroke-[1.5]'
                        : 'fill-teal-500 stroke-slate-900 stroke-2'
                  }`}
                />
                <text
                  x={center.x}
                  y={center.y - 14}
                  textAnchor="middle"
                  className={`select-none text-[12px] font-bold transition-colors ${
                    isPending ? 'fill-blue-400' : 'fill-slate-300 group-hover:fill-white'
                  }`}
                >
                  {node.name}
                </text>
              </g>
            )
          })}
          </svg>

          {contextMenu && (
            <div
              className="absolute z-20 w-52 rounded-xl border border-line bg-panel p-2 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-100"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onPointerDown={e => e.stopPropagation()}
            >
              <div className="px-1 py-0.5 text-[11px] font-bold text-muted border-b border-line/60 pb-1.5 truncate">
                {contextMenu.title}
              </div>

              {contextMenu.type === 'node' && (() => {
                const node = config.nodes.find(n => n.name === contextMenu.targetId)
                if (!node) return null
                const connCount = getNodeConnectionCount(node.name, config.components)
                const isAutoDot = node.show_dot === undefined || node.show_dot === null

                return (
                  <div className="space-y-1 py-1 border-b border-line/60">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted px-1 flex justify-between">
                      <span>Verbindungspunkt</span>
                      <span className="font-mono text-ghost">({connCount} Anschl.)</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => toggleNodeDot(node.name, null)}
                        className={`px-1 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          isAutoDot ? 'border-primary bg-primary/20 text-primary' : 'border-line bg-raised text-muted hover:bg-overlay'
                        }`}
                        title="Automatisch bei >= 3 Anschlüssen"
                      >
                        Auto
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleNodeDot(node.name, true)}
                        className={`px-1 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          node.show_dot === true ? 'border-primary bg-primary/20 text-primary' : 'border-line bg-raised text-muted hover:bg-overlay'
                        }`}
                        title="Manuell erzwingen (Dot an)"
                      >
                        An
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleNodeDot(node.name, false)}
                        className={`px-1 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          node.show_dot === false ? 'border-primary bg-primary/20 text-primary' : 'border-line bg-raised text-muted hover:bg-overlay'
                        }`}
                        title="Manuell ausblenden (Dot aus)"
                      >
                        Aus
                      </button>
                    </div>
                  </div>
                )
              })()}

              {contextMenu.type === 'component' && (() => {
                const comp = config.components.find(c => c.id === contextMenu.targetId)
                if (!comp) return null
                return (
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Typ tauschen</label>
                      <select
                        value={comp.type_name}
                        onChange={e => changeComponentType(comp.id, e.target.value)}
                        className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {COMP_TYPES.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Label (l=)</label>
                        <input
                          type="text"
                          value={comp.label || ''}
                          onChange={e => updateComponentField(comp.id, 'label', e.target.value)}
                          placeholder="R1"
                          className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Wert (a=)</label>
                        <input
                          type="text"
                          value={comp.value || ''}
                          onChange={e => updateComponentField(comp.id, 'value', e.target.value)}
                          placeholder="100Ω"
                          className="w-full bg-raised border border-line rounded-md px-2 py-1 text-xs text-ink placeholder:text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div className="pt-1 border-t border-line/60">
                <button
                  type="button"
                  onClick={() => {
                    if (contextMenu.type === 'node') {
                      removeNode(contextMenu.targetId)
                    } else {
                      removeComponent(contextMenu.targetId)
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                >
                  <Trash2 size={13} />
                  <span>{contextMenu.type === 'node' ? 'Knoten löschen' : 'Bauteil löschen'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Accordion>
  )
}
