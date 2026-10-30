// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { useEffect, useMemo, useState } from 'react'
import type { AnchorConfig, FlaschenzugConfig, PulleyConfig, RopeConfig, RopeSegmentConfig } from '../../../typesFlasche'
import { genId } from '../../../utilsFlasche'
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  type CanvasEditorMode,
  type CanvasElementHit,
  type CanvasPoint,
  canvasToWorld,
  createAnchorAt,
  createPulleyAt,
  findCanvasElementHit,
  getCanvasBounds,
  getCanvasScale,
  getGridLines,
  getPointerCanvasPoint,
} from '../../../utilsFlascheCanvas'
import type { ContextMenuState } from '../types'

export interface CanvasInteractionOptions {
  cfg: FlaschenzugConfig
  setCfg: React.Dispatch<React.SetStateAction<FlaschenzugConfig>>
  svgRef: React.RefObject<SVGSVGElement | null>
}

export function useCanvasInteraction({ cfg, setCfg, svgRef }: CanvasInteractionOptions) {
  const [mode, setMode] = useState<CanvasEditorMode>('move')
  const [selectedRopeId, setSelectedRopeId] = useState<string>(cfg.ropes[0]?.id ?? '')
  const [ropeSide, setRopeSide] = useState<RopeSegmentConfig['side']>('cw')
  const [dragging, setDragging] = useState<CanvasElementHit | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [panOffset, setPanOffset] = useState<CanvasPoint>({ x: 0, y: 0 })
  const [zoomLevel, setZoomLevel] = useState<number>(1.0)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ clientX: number; clientY: number; initialPan: CanvasPoint } | null>(null)

  const bounds = useMemo(() => getCanvasBounds(cfg, panOffset), [cfg, panOffset])
  const grid = useMemo(() => getGridLines(bounds, zoomLevel), [bounds, zoomLevel])
  const activeRope = cfg.ropes.find(r => r.id === selectedRopeId) ?? cfg.ropes[0]
  const canvasScale = useMemo(() => getCanvasScale(bounds, zoomLevel), [bounds, zoomLevel])

  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const pointerCanvas = getPointerCanvasPoint(e.clientX, e.clientY, svgEl)
      const cursorX = pointerCanvas.x
      const cursorY = pointerCanvas.y

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15

      setZoomLevel(prevZoom => {
        const nextZoom = Math.min(4.0, Math.max(0.4, prevZoom * zoomFactor))
        if (Math.abs(nextZoom - prevZoom) < 0.001) return prevZoom

        const oldScale = getCanvasScale(bounds, prevZoom)
        const newScale = getCanvasScale(bounds, nextZoom)

        const baseMidX = (bounds.minX + bounds.maxX) / 2
        const baseMidY = (bounds.minY + bounds.maxY) / 2

        const worldCursorX = baseMidX + (cursorX - CANVAS_WIDTH / 2) / oldScale
        const worldCursorY = baseMidY - (cursorY - CANVAS_HEIGHT / 2) / oldScale

        const newMidX = worldCursorX - (cursorX - CANVAS_WIDTH / 2) / newScale
        const newMidY = worldCursorY + (cursorY - CANVAS_HEIGHT / 2) / newScale

        const currentPanX = panOffset.x
        const currentPanY = panOffset.y
        const initialBaseMidX = baseMidX - currentPanX
        const initialBaseMidY = baseMidY - currentPanY

        setPanOffset({
          x: newMidX - initialBaseMidX,
          y: newMidY - initialBaseMidY,
        })

        return nextZoom
      })
    }

    svgEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => svgEl.removeEventListener('wheel', handleWheel)
  }, [bounds, panOffset, svgRef])

  const getCanvasPoint = (event: React.PointerEvent<SVGSVGElement>) =>
    getPointerCanvasPoint(event.clientX, event.clientY, event.currentTarget)

  const getWorldPoint = (event: React.PointerEvent<SVGSVGElement>) =>
    canvasToWorld(getCanvasPoint(event), bounds, zoomLevel)

  const appendRopePoint = (hit: CanvasElementHit) => {
    setCfg(c => {
      const existingRopeId = c.ropes.some(r => r.id === selectedRopeId)
        ? selectedRopeId
        : c.ropes[0]?.id

      if (!existingRopeId) {
        const newRope: RopeConfig = {
          id: genId(),
          name: 'Seil 1',
          path: [{ name: hit.name, side: hit.kind === 'pulley' ? ropeSide : 'none' }],
          style: 'plain',
          color: 'black',
          width: 1.0,
        }
        setSelectedRopeId(newRope.id)
        return { ...c, ropes: [...c.ropes, newRope] }
      }

      return {
        ...c,
        ropes: c.ropes.map(rope => rope.id === existingRopeId
          ? {
            ...rope,
            path: [...rope.path, { name: hit.name, side: hit.kind === 'pulley' ? ropeSide : 'none' }],
          }
          : rope),
      }
    })
  }

  const clearActiveRopePath = () => {
    if (!activeRope) return
    setCfg(c => ({
      ...c,
      ropes: c.ropes.map(rope => rope.id === activeRope.id ? { ...rope, path: [] } : rope),
    }))
  }

  const addRope = () => {
    setCfg(c => {
      const rope: RopeConfig = {
        id: genId(),
        name: `Seil ${c.ropes.length + 1}`,
        path: [],
        style: 'plain',
        color: 'black',
        width: 1.0,
      }
      setSelectedRopeId(rope.id)
      return { ...c, ropes: [...c.ropes, rope] }
    })
  }

  const resetView = () => {
    setPanOffset({ x: 0, y: 0 })
    setZoomLevel(1.0)
  }

  const handleCanvasPointerDown = (event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return
    setContextMenu(null)
    const canvasPoint = getCanvasPoint(event)
    const hit = findCanvasElementHit(cfg, canvasPoint, bounds, zoomLevel)

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

    if (mode === 'rope') {
      if (hit) appendRopePoint(hit)
      return
    }

    if (mode === 'pulley') {
      if (hit) return
      const point = getWorldPoint(event)
      setCfg(c => ({ ...c, pulleys: [...c.pulleys, createPulleyAt(c, point)] }))
      return
    }

    if (mode === 'anchor') {
      if (hit) return
      const point = getWorldPoint(event)
      setCfg(c => ({ ...c, anchors: [...c.anchors, createAnchorAt(c, point)] }))
      return
    }
  }

  const handleElementPointerDown = (
    event: React.PointerEvent<SVGElement>,
    hit: CanvasElementHit,
  ) => {
    if (event.button !== 0) return
    event.stopPropagation()
    setContextMenu(null)

    if (mode === 'move') {
      setDragging(hit)
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (mode === 'rope') {
      appendRopePoint(hit)
      return
    }
  }

  const handleCanvasPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (dragging) {
      const point = getWorldPoint(event)
      setCfg(c => ({
        ...c,
        pulleys: dragging.kind === 'pulley'
          ? c.pulleys.map(p => p.id === dragging.id ? { ...p, x: point.x, y: point.y } : p)
          : c.pulleys,
        anchors: dragging.kind === 'anchor'
          ? c.anchors.map(a => a.id === dragging.id ? { ...a, x: point.x, y: point.y } : a)
          : c.anchors,
      }))
      return
    }

    if (isPanning && panStart) {
      const scale = getCanvasScale(bounds, zoomLevel)
      const dxPixels = event.clientX - panStart.clientX
      const dyPixels = event.clientY - panStart.clientY

      const dxWorld = dxPixels / scale
      const dyWorld = dyPixels / scale

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

  const handleCanvasContextMenu = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault()
    const target = event.target as Element
    if (!target.closest('[data-editor-element="true"]')) {
      setContextMenu(null)
    }
  }

  const getContextMenuCoords = (event: React.MouseEvent, menuWidth = 230, menuHeight = 320) => {
    const container = event.currentTarget.closest('.relative') as HTMLElement | null
    const rect = container ? container.getBoundingClientRect() : { left: 0, top: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return {
      x: Math.max(10, Math.min(x, (rect.width || CANVAS_WIDTH) - menuWidth - 10)),
      y: Math.max(10, Math.min(y, (rect.height || CANVAS_HEIGHT) - menuHeight - 10)),
    }
  }

  const handlePulleyContextMenu = (event: React.MouseEvent, pulley: PulleyConfig) => {
    event.preventDefault()
    event.stopPropagation()
    const coords = getContextMenuCoords(event, 240, 360)
    setContextMenu({
      type: 'pulley',
      targetId: pulley.id,
      title: `Rolle: ${pulley.name}`,
      x: coords.x,
      y: coords.y,
    })
  }

  const handleAnchorContextMenu = (event: React.MouseEvent, anchor: AnchorConfig) => {
    event.preventDefault()
    event.stopPropagation()
    const coords = getContextMenuCoords(event, 230, 290)
    setContextMenu({
      type: 'anchor',
      targetId: anchor.id,
      title: `Punkt: ${anchor.name}`,
      x: coords.x,
      y: coords.y,
    })
  }

  const handleRopeSegmentContextMenu = (event: React.MouseEvent, rope: RopeConfig, segmentIdx: number) => {
    event.preventDefault()
    event.stopPropagation()
    setSelectedRopeId(rope.id)
    const coords = getContextMenuCoords(event, 240, 340)
    setContextMenu({
      type: 'rope_segment',
      targetId: rope.id,
      segmentIndex: segmentIdx,
      title: `Seil: ${rope.name} (Segment ${segmentIdx + 1})`,
      x: coords.x,
      y: coords.y,
    })
  }

  const closeContextMenu = () => setContextMenu(null)

  return {
    mode,
    setMode,
    zoomLevel,
    setZoomLevel,
    panOffset,
    setPanOffset,
    isPanning,
    dragging,
    resetView,
    selectedRopeId,
    setSelectedRopeId,
    activeRope,
    ropeSide,
    setRopeSide,
    addRope,
    clearActiveRopePath,
    bounds,
    grid,
    canvasScale,
    contextMenu,
    setContextMenu,
    closeContextMenu,
    handleCanvasPointerDown,
    handleElementPointerDown,
    handleCanvasPointerMove,
    handleCanvasPointerUp,
    handleCanvasContextMenu,
    handlePulleyContextMenu,
    handleAnchorContextMenu,
    handleRopeSegmentContextMenu,
  }
}

export type UseCanvasInteractionResult = ReturnType<typeof useCanvasInteraction>
