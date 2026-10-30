// SPDX-License-Identifier: AGPL-3.0-or-later

import { useState } from 'react'
import { s } from '../../styles/tokens'
import useLocalStorage from '../../hooks/useLocalStorage'
import { generateKoordinatensystem3D, compileLatex } from '../../api/client'
import type { CompileResponse } from '../../api/client'
import { Tabs, TabContent } from '../../components/Tabs'
import { PresetManager } from '../../components/PresetManager'
import {
  Box, Settings, Sliders, Grid3X3, Plus,
  Folders, MapPin, Navigation, Minus, Layers, Terminal
} from 'lucide-react'

import type { Config3D, Config3DSetter, Koord3DCollection, Koord3DItem } from './typesKoord3D'
import { DEFAULT_CONFIG } from './constantsKoord3D'
import { Koord3DHeader } from './components/Koord3DHeader'
import { Koord3DPreview } from './components/Koord3DPreview'
import { Koord3DTabBasis } from './components/Koord3DTabBasis'
import { Koord3DTabAchsen } from './components/Koord3DTabAchsen'
import { Koord3DTabVisuals } from './components/Koord3DTabVisuals'
import { Koord3DTabPoints } from './components/Koord3DTabPoints'
import { Koord3DTabVectors } from './components/Koord3DTabVectors'
import { Koord3DTabLines } from './components/Koord3DTabLines'
import { Koord3DTabPlanes } from './components/Koord3DTabPlanes'
import { Koord3DTabShapes } from './components/Koord3DTabShapes'
import { Koord3DTabIntersections } from './components/Koord3DTabIntersections'
import { Koord3DTabErweitert } from './components/Koord3DTabErweitert'
import { Koord3DTabManual } from './components/Koord3DTabManual'

const Koord3DPage = () => {
  const [config, setConfig] = useLocalStorage<Config3D>('ks-koordinatensystem3d', DEFAULT_CONFIG)
  const [activeTab, setActiveTab] = useState('basis')
  const [previewDpi, setPreviewDpi] = useState(300)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})

  const toggleExpand = (key: string) =>
    setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }))
  const isExpanded = (key: string) => expandedMap[key] ?? false
  const autoExpand = (key: string) =>
    setExpandedMap(prev => ({ ...prev, [key]: true }))

  const setAllExpanded = (prefix: string, count: number, value: boolean) =>
    setExpandedMap(prev => {
      const next = { ...prev }
      for (let i = 0; i < count; i++) next[`${prefix}-${i}`] = value
      return next
    })

  const setTabVisible = (key: Koord3DCollection, value: boolean) =>
    setConfig(prev => ({ ...prev, [key]: prev[key].map(p => ({ ...p, show: value })) }))

  const [latexCode, setLatexCode] = useState<string | null>(null)
  const [compileData, setCompileData] = useState<CompileResponse | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)

  const handleCompile = async () => {
    setIsCompiling(true)
    try {
      const gen = await generateKoordinatensystem3D(config)
      setLatexCode(gen.latex)
      const result = await compileLatex(gen.latex, previewDpi)
      setCompileData(result)
    } finally {
      setIsCompiling(false)
    }
  }

  const updateConfig: Config3DSetter = (key, value) => setConfig(prev => ({ ...prev, [key]: value }))

  // ---- items ----
  const addItem = <C extends Koord3DCollection>(key: C, item: Koord3DItem<C>) => updateConfig(key, [...config[key], item] as Config3D[C])
  const removeItem = (key: Koord3DCollection, i: number) => {
    if (key === 'points') {
      const newShapes = config.shapes.map(sh => ({
        ...sh,
        point_indices: sh.point_indices
          .filter(idx => idx !== i)
          .map(idx => (idx > i ? idx - 1 : idx))
      }))
      const adjustIdx = (idx: number | null) =>
        idx === null ? null : idx === i ? null : idx > i ? idx - 1 : idx
      const newVectors = config.vectors.map(v => ({
        ...v,
        start_point_idx: adjustIdx(v.start_point_idx ?? null),
        end_point_idx: adjustIdx(v.end_point_idx ?? null),
      }))
      const newLines = config.lines.map(l => ({
        ...l,
        svec_point_idx: adjustIdx(l.svec_point_idx ?? null),
        pt1_idx: adjustIdx(l.pt1_idx ?? null),
        pt2_idx: adjustIdx(l.pt2_idx ?? null),
      }))
      const newPlanes = config.planes.map(p => ({
        ...p,
        p1_idx: adjustIdx(p.p1_idx ?? null),
        p2_idx: adjustIdx(p.p2_idx ?? null),
        p3_idx: adjustIdx(p.p3_idx ?? null),
      }))
      setConfig(prev => ({
        ...prev,
        points: prev.points.filter((_, idx) => idx !== i),
        shapes: newShapes,
        vectors: newVectors,
        lines: newLines,
        planes: newPlanes,
      }))
    } else {
      setConfig(prev => ({ ...prev, [key]: prev[key].filter((_, idx) => idx !== i) }))
    }
  }
  const updateItem = <C extends Koord3DCollection, K extends keyof Koord3DItem<C>>(key: C, i: number, field: K, value: Koord3DItem<C>[K]) => {
    if (key === 'points' && (field === 'x' || field === 'y' || field === 'z')) {
      setConfig(prev => {
        const arr = [...prev.points]
        arr[i] = { ...arr[i], [field]: value }
        const newVectors = prev.vectors.map(v => {
          let u = { ...v }
          if ((v.start_point_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x1: value as number }
            else if (field === 'y') u = { ...u, y1: value as number }
            else u = { ...u, z1: value as number }
          }
          if ((v.end_point_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x2: value as number }
            else if (field === 'y') u = { ...u, y2: value as number }
            else u = { ...u, z2: value as number }
          }
          return u
        })
        const newLines = prev.lines.map(l => {
          let u = { ...l }
          if ((l.svec_point_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x0: value as number }
            else if (field === 'y') u = { ...u, y0: value as number }
            else u = { ...u, z0: value as number }
          }
          if ((l.pt1_idx ?? null) === i && (l.line_mode ?? 'stuetz_richtung') === '2_punkte') {
            if (field === 'x') { const v2 = value as number; u = { ...u, pt1_x: v2, x0: v2, rx: l.pt2_x - v2 } }
            else if (field === 'y') { const v2 = value as number; u = { ...u, pt1_y: v2, y0: v2, ry: l.pt2_y - v2 } }
            else { const v2 = value as number; u = { ...u, pt1_z: v2, z0: v2, rz: l.pt2_z - v2 } }
          }
          if ((l.pt2_idx ?? null) === i && (l.line_mode ?? 'stuetz_richtung') === '2_punkte') {
            if (field === 'x') { const v2 = value as number; u = { ...u, pt2_x: v2, rx: v2 - l.pt1_x } }
            else if (field === 'y') { const v2 = value as number; u = { ...u, pt2_y: v2, ry: v2 - l.pt1_y } }
            else { const v2 = value as number; u = { ...u, pt2_z: v2, rz: v2 - l.pt1_z } }
          }
          return u
        })
        const newPlanes = prev.planes.map(p => {
          let u = { ...p }
          if ((p.p1_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x1: value as number }
            else if (field === 'y') u = { ...u, y1: value as number }
            else u = { ...u, z1: value as number }
          }
          if ((p.p2_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x2: value as number }
            else if (field === 'y') u = { ...u, y2: value as number }
            else u = { ...u, z2: value as number }
          }
          if ((p.p3_idx ?? null) === i) {
            if (field === 'x') u = { ...u, x3: value as number }
            else if (field === 'y') u = { ...u, y3: value as number }
            else u = { ...u, z3: value as number }
          }
          return u
        })
        return { ...prev, points: arr, vectors: newVectors, lines: newLines, planes: newPlanes }
      })
    } else {
      const arr = [...config[key]] as Array<Koord3DItem<C>>
      arr[i] = { ...arr[i], [field]: value }
      updateConfig(key, arr as Config3D[C])
    }
  }
  const duplicateItem = <C extends Koord3DCollection>(key: C, i: number) => {
    const idx = config[key].length
    const newItem = structuredClone(config[key][i]) as Koord3DItem<C>
    setConfig(prev => ({ ...prev, [key]: [...prev[key], newItem] }))
    const prefixMap: Record<Koord3DCollection, string> = { points: 'pt', vectors: 'vec', lines: 'ln', planes: 'pl', intersections: 'int', shapes: 'sh' }
    autoExpand(`${prefixMap[key]}-${idx}`)
  }

  // ---- handlers ----
  const addPoint = () => { const idx = config.points.length; addItem('points', { show: true, name: '', x: 2.0, y: 1.0, z: 3.0, label: `P_{${idx + 1}}`, color: '#1e293b', mark: '*', size: 2.0, anchor: 'west', trail: false, trail_marks: false, trail_color: '#64748b', trail_style: 'dashed', trail_width: 0.8, trail_alpha: 80, proj_xy: false, proj_xz: false, proj_yz: false, proj_color: '#64748b', proj_style: 'dashed' }) }
  const addVector = () => { addItem('vectors', { show: true, name: '', x1: 1.0, y1: 0.0, z1: 0.0, x2: 0.0, y2: 2.0, z2: 2.0, color: '#ef4444', style: 'solid', width: 1.2, arrow: 'Stealth[length=3mm]', label: '', label_pos: 'midway, above', draw_mode: 'vorne', behind_style: 'dashed, opacity=0.5', start_point_idx: null, end_point_idx: null }) }
  const addLine = () => { addItem('lines', { show: true, name: '', x0: 2.0, y0: 0.0, z0: 4.0, rx: 1.0, ry: 2.0, rz: 1.0, color: '#64748b', style: 'solid', width: 1.0, tmin: -10.0, tmax: 10.0, rvec_show: false, rvec_color: '#1e293b', rvec_style: 'solid', rvec_width: 1.2, rvec_arrow: 'Stealth[length=3mm]', rvec_label: '$\\vec{r}$', rvec_label_style: 'midway, below', svec_show: false, svec_color: '#1e293b', svec_style: 'solid', svec_width: 1.2, svec_arrow: 'Stealth[length=3mm]', svec_label: '$\\vec{s}$', svec_label_style: 'midway, below', draw_mode: 'vorne', behind_style: 'dashed, opacity=0.5', line_mode: 'stuetz_richtung', svec_point_idx: null, pt1_x: 2.0, pt1_y: 0.0, pt1_z: 4.0, pt2_x: 3.0, pt2_y: 2.0, pt2_z: 5.0, pt1_idx: null, pt2_idx: null }) }
  const addPlane = () => { addItem('planes', { show: true, name: '', mode: '3 Punkte', x1: 2.0, y1: 0.0, z1: 0.0, x2: 0.0, y2: 2.0, z2: 0.0, x3: 0.0, y3: 0.0, z3: 2.0, n1: 0.0, n2: 0.0, n3: 1.0, d: 2.0, color: '#2563eb', alpha: 50, pattern: '', normal_show: false, normal_color: '#1e293b', normal_style: 'solid', normal_width: 1.2, normal_arrow: 'Stealth[length=3mm]', normal_label: '$\\vec{n}$', normal_label_pos: 'midway, above right', p1_idx: null, p2_idx: null, p3_idx: null }) }
  const addIntersection = () => { addItem('intersections', { show: true, type: 'Gerade-Gerade', item1_index: 0, item2_index: 0, color: 'black', label: 'S', mark: '*', size: 3.0, width: 1.5, style: 'solid' }) }
  const addShape = () => { addItem('shapes', { show: true, name: '', point_indices: [], color: '#1e293b', fill_color: '#2563eb', fill_alpha: 30, width: 1.0, style: 'solid', closed: false }) }

  const tabs = [
    { id: 'basis', label: 'Basis', icon: <Box size={16} /> },
    { id: 'achsen', label: 'Achsen', icon: <Sliders size={16} /> },
    { id: 'visuals', label: 'Visuals', icon: <Grid3X3 size={16} /> },
    { id: 'punkte', label: 'Punkte', icon: <MapPin size={16} /> },
    { id: 'vektoren', label: 'Vektoren', icon: <Navigation size={16} /> },
    { id: 'geraden', label: 'Geraden', icon: <Minus size={16} /> },
    { id: 'ebenen', label: 'Ebenen', icon: <Layers size={16} /> },
    { id: 'shapes', label: 'Shapes', icon: <Box size={16} /> },
    { id: 'schnitte', label: 'Schnitte', icon: <Plus size={16} /> },
    { id: 'erweitert', label: 'Erweitert', icon: <Settings size={16} /> },
    { id: 'manual', label: 'Manual', icon: <Terminal size={16} /> },
    { id: 'presets', label: 'Presets', icon: <Folders size={16} /> },
  ]

  return (
    <div className="flex flex-col gap-6 h-full overflow-hidden">
      <Koord3DHeader
        latexCode={latexCode}
        isCompiling={isCompiling}
        onCompile={handleCompile}
        onReset={() => setConfig(DEFAULT_CONFIG)}
        config={config}
        onApplyConfig={setConfig}
      />

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        <div className={s.editorPanel}>
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
            <TabContent id="basis" activeTab={activeTab}>
              <Koord3DTabBasis config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="achsen" activeTab={activeTab}>
              <Koord3DTabAchsen
                config={config}
                updateConfig={updateConfig}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
              />
            </TabContent>

            <TabContent id="visuals" activeTab={activeTab}>
              <Koord3DTabVisuals config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="punkte" activeTab={activeTab}>
              <Koord3DTabPoints
                config={config}
                addPoint={addPoint}
                removePoint={(i) => removeItem('points', i)}
                updatePoint={(i, f, v) => updateItem('points', i, f, v)}
                duplicatePoint={(i) => duplicateItem('points', i)}
                setTabVisible={(key, val) => setTabVisible(key, val)}
                setAllExpanded={setAllExpanded}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
              />
            </TabContent>

            <TabContent id="vektoren" activeTab={activeTab}>
              <Koord3DTabVectors
                config={config}
                addVector={addVector}
                removeVector={(i) => removeItem('vectors', i)}
                updateVector={(i, f, v) => updateItem('vectors', i, f, v)}
                duplicateVector={(i) => duplicateItem('vectors', i)}
                setTabVisible={(key, val) => setTabVisible(key, val)}
                setAllExpanded={setAllExpanded}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
                onSetPoints={(i, startIdx, endIdx) => {
                  setConfig(prev => {
                    const arr = [...prev.vectors]
                    let u = { ...arr[i], start_point_idx: startIdx, end_point_idx: endIdx }
                    if (startIdx !== null) {
                      const pt = config.points[startIdx]
                      u = { ...u, x1: pt.x, y1: pt.y, z1: pt.z }
                    }
                    if (endIdx !== null) {
                      const pt = config.points[endIdx]
                      u = { ...u, x2: pt.x, y2: pt.y, z2: pt.z }
                    }
                    arr[i] = u
                    return { ...prev, vectors: arr }
                  })
                }}
              />
            </TabContent>

            <TabContent id="geraden" activeTab={activeTab}>
              <Koord3DTabLines
                config={config}
                addLine={addLine}
                removeLine={(i) => removeItem('lines', i)}
                updateLine={(i, f, v) => updateItem('lines', i, f, v)}
                duplicateLine={(i) => duplicateItem('lines', i)}
                setTabVisible={(key, val) => setTabVisible(key, val)}
                setAllExpanded={setAllExpanded}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
                onSetMode={(i, mode) => {
                  if (mode === '2_punkte') {
                    setConfig(prev => {
                      const arr = [...prev.lines]
                      arr[i] = { ...arr[i], line_mode: '2_punkte', pt1_x: arr[i].x0, pt1_y: arr[i].y0, pt1_z: arr[i].z0, pt2_x: arr[i].x0 + arr[i].rx, pt2_y: arr[i].y0 + arr[i].ry, pt2_z: arr[i].z0 + arr[i].rz }
                      return { ...prev, lines: arr }
                    })
                  } else {
                    updateItem('lines', i, 'line_mode', mode)
                  }
                }}
                onSetPoint1={(i, ptIdx) => {
                  if (ptIdx === null) {
                    updateItem('lines', i, 'pt1_idx', null)
                  } else {
                    const pt = config.points[ptIdx]
                    setConfig(prev => {
                      const arr = [...prev.lines]
                      arr[i] = { ...arr[i], pt1_idx: ptIdx, pt1_x: pt.x, pt1_y: pt.y, pt1_z: pt.z, x0: pt.x, y0: pt.y, z0: pt.z, rx: arr[i].pt2_x - pt.x, ry: arr[i].pt2_y - pt.y, rz: arr[i].pt2_z - pt.z }
                      return { ...prev, lines: arr }
                    })
                  }
                }}
                onSetPoint2={(i, ptIdx) => {
                  if (ptIdx === null) {
                    updateItem('lines', i, 'pt2_idx', null)
                  } else {
                    const pt = config.points[ptIdx]
                    setConfig(prev => {
                      const arr = [...prev.lines]
                      arr[i] = { ...arr[i], pt2_idx: ptIdx, pt2_x: pt.x, pt2_y: pt.y, pt2_z: pt.z, rx: pt.x - arr[i].pt1_x, ry: pt.y - arr[i].pt1_y, rz: pt.z - arr[i].pt1_z }
                      return { ...prev, lines: arr }
                    })
                  }
                }}
                onSetSvecPoint={(i, ptIdx) => {
                  if (ptIdx === null) {
                    updateItem('lines', i, 'svec_point_idx', null)
                  } else {
                    const pt = config.points[ptIdx]
                    setConfig(prev => {
                      const arr = [...prev.lines]
                      arr[i] = { ...arr[i], svec_point_idx: ptIdx, x0: pt.x, y0: pt.y, z0: pt.z }
                      return { ...prev, lines: arr }
                    })
                  }
                }}
              />
            </TabContent>

            <TabContent id="ebenen" activeTab={activeTab}>
              <Koord3DTabPlanes
                config={config}
                addPlane={addPlane}
                removePlane={(i) => removeItem('planes', i)}
                updatePlane={(i, f, v) => updateItem('planes', i, f, v)}
                duplicatePlane={(i) => duplicateItem('planes', i)}
                setTabVisible={(key, val) => setTabVisible(key, val)}
                setAllExpanded={setAllExpanded}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
                onSetPoint={(i, n, ptIdx) => {
                  const pIdxKey = `p${n}_idx` as 'p1_idx' | 'p2_idx' | 'p3_idx'
                  const xKey = `x${n}` as 'x1' | 'x2' | 'x3'
                  const yKey = `y${n}` as 'y1' | 'y2' | 'y3'
                  const zKey = `z${n}` as 'z1' | 'z2' | 'z3'
                  if (ptIdx === null) {
                    updateItem('planes', i, pIdxKey, null)
                  } else {
                    const pt = config.points[ptIdx]
                    setConfig(prev => {
                      const arr = [...prev.planes]
                      arr[i] = { ...arr[i], [pIdxKey]: ptIdx, [xKey]: pt.x, [yKey]: pt.y, [zKey]: pt.z }
                      return { ...prev, planes: arr }
                    })
                  }
                }}
              />
            </TabContent>

            <TabContent id="shapes" activeTab={activeTab}>
              <Koord3DTabShapes
                config={config}
                addShape={addShape}
                removeShape={(i) => removeItem('shapes', i)}
                updateShape={(i, f, v) => updateItem('shapes', i, f, v)}
                duplicateShape={(i) => duplicateItem('shapes', i)}
                setTabVisible={(key, val) => setTabVisible(key, val)}
                setAllExpanded={setAllExpanded}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
              />
            </TabContent>

            <TabContent id="schnitte" activeTab={activeTab}>
              <Koord3DTabIntersections
                config={config}
                addIntersection={addIntersection}
                removeIntersection={(i) => removeItem('intersections', i)}
                updateIntersection={(i, f, v) => updateItem('intersections', i, f, v)}
                isExpanded={isExpanded}
                toggleExpand={toggleExpand}
              />
            </TabContent>

            <TabContent id="erweitert" activeTab={activeTab}>
              <Koord3DTabErweitert config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="manual" activeTab={activeTab}>
              <Koord3DTabManual config={config} updateConfig={updateConfig} />
            </TabContent>

            <TabContent id="presets" activeTab={activeTab}>
              <PresetManager
                generator="koord3d"
                currentConfig={config}
                onLoad={(loaded) => setConfig({ ...DEFAULT_CONFIG, ...loaded })}
              />
            </TabContent>
          </Tabs>
        </div>

        <Koord3DPreview
          latexCode={latexCode}
          compileData={compileData}
          isCompiling={isCompiling}
          previewDpi={previewDpi}
          setPreviewDpi={setPreviewDpi}
        />
      </div>
    </div>
  )
}

export default Koord3DPage
