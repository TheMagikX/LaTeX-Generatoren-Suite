// SPDX-License-Identifier: AGPL-3.0-or-later

import { DEFAULT_CONFIG } from './constantsFlasche'
import type {
  AnchorConfig,
  FlaschenzugConfig,
  ManualMountConfig,
  MassConfig,
  PulleyConfig,
  RopeConfig,
} from './typesFlasche'
import { genId } from './utilsFlasche'

export type FlaschenzugTemplateId =
  | 'feste_rolle'
  | 'lose_rolle'
  | 'flaschenzug_n'
  | 'potenzflaschenzug'

export type TragendeSeileCount = 2 | 3 | 4 | 6
export type PotenzStufenCount = 2 | 3

export interface FlaschenzugTemplateOptions {
  tragendeSeile?: TragendeSeileCount
  potenzStufen?: PotenzStufenCount
}

const roundCoord = (value: number): number => Math.round(value * 100) / 100

const baseConfig = (deckeWidth = 5.0): FlaschenzugConfig => ({
  pulleys: [],
  anchors: [],
  ropes: [],
  masses: [],
  forces: [],
  manual_mounts: [],
  global_opts: { ...DEFAULT_CONFIG.global_opts },
  environment: {
    show_boden: false,
    boden_y: -1.0,
    boden_width: 6.0,
    show_decke: true,
    decke_y: 3.5,
    decke_width: deckeWidth,
  },
})

const makeRope = (
  name: string,
  path: { name: string; side: 'cw' | 'ccw' | 'none' }[],
): RopeConfig => ({
  id: genId(),
  name,
  path: path.map((seg) => ({ id: genId(), name: seg.name, side: seg.side })),
  style: 'plain',
  color: 'black',
  width: 1.0,
})

const buildFesteRolle = (): FlaschenzugConfig => {
  const cfg = baseConfig(5.0)
  cfg.pulleys = [
    {
      id: genId(),
      name: 'R1',
      x: 0,
      y: 2.5,
      radius: 0.5,
      label: 'R1',
      label_pos: 'above right',
      mount: 'Einseitig',
      mount_angle: 90,
      mount_length: 1.0,
    },
  ]
  cfg.anchors = [
    {
      id: genId(),
      name: 'A1',
      x: -0.5,
      y: 0.75,
      label: '',
      shape: 'Kreis',
      size: 1.5,
    },
    {
      id: genId(),
      name: 'A2',
      x: 0.5,
      y: 0.75,
      label: '',
      shape: 'Keine',
      size: 2.0,
    },
  ]
  cfg.ropes = [
    makeRope('Seil 1', [
      { name: 'A1', side: 'none' },
      { name: 'R1', side: 'cw' },
      { name: 'A2', side: 'none' },
    ]),
  ]
  cfg.masses = [
    {
      id: genId(),
      ref: 'A1',
      name: 'M1',
      length: 0.5,
      width: 0.8,
      height: 0.6,
      label: '$m$',
      relation: 'Mitte',
    },
  ]
  return cfg
}

const buildLoseRolle = (): FlaschenzugConfig => {
  const cfg = baseConfig(5.0)
  cfg.anchors = [
    {
      id: genId(),
      name: 'A1',
      x: -0.5,
      y: 3.5,
      label: '',
      shape: 'Kreis',
      size: 2.0,
    },
    {
      id: genId(),
      name: 'A2',
      x: 0.5,
      y: 3.0,
      label: '',
      shape: 'Keine',
      size: 2.0,
    },
  ]
  cfg.pulleys = [
    {
      id: genId(),
      name: 'R1',
      x: 0,
      y: 1.25,
      radius: 0.5,
      label: 'R1',
      label_pos: 'right',
      mount: 'Keine',
      mount_angle: 90,
      mount_length: 0.5,
    },
  ]
  cfg.ropes = [
    makeRope('Seil 1', [
      { name: 'A1', side: 'none' },
      { name: 'R1', side: 'ccw' },
      { name: 'A2', side: 'none' },
    ]),
  ]
  cfg.masses = [
    {
      id: genId(),
      ref: 'R1',
      name: 'M1',
      length: 0.8,
      width: 0.8,
      height: 0.6,
      label: '$m$',
      relation: 'Mitte',
    },
  ]
  return cfg
}

const buildFlaschenzugN = (n: TragendeSeileCount = 4): FlaschenzugConfig => {
  const r = 0.35
  const step = 2 * r
  const yOben = 2.5
  const yUnten = 0.75
  const yZug = 0.75
  const yDecke = 3.5

  const cfg = baseConfig(n === 6 ? 6.0 : 5.0)

  if (n === 3) {
    const pulleys: PulleyConfig[] = [
      {
        id: genId(),
        name: 'R1',
        x: -0.35,
        y: yOben,
        radius: r,
        label: 'R1',
        label_pos: 'above right',
        mount: 'Einseitig',
        mount_angle: 90,
        mount_length: 1.0,
      },
      {
        id: genId(),
        name: 'R2',
        x: 0.35,
        y: yUnten,
        radius: r,
        label: 'R2',
        label_pos: 'right',
        mount: 'Keine',
        mount_angle: 90,
        mount_length: 0.5,
      },
      {
        id: genId(),
        name: 'R3',
        x: 1.05,
        y: yOben,
        radius: r,
        label: 'R3',
        label_pos: 'above right',
        mount: 'Einseitig',
        mount_angle: 90,
        mount_length: 1.0,
      },
    ]
    const anchors: AnchorConfig[] = [
      {
        id: genId(),
        name: 'A1',
        x: -0.7,
        y: yUnten,
        label: '',
        shape: 'Kreis',
        size: 1.5,
      },
      {
        id: genId(),
        name: 'A2',
        x: 1.4,
        y: yZug,
        label: '',
        shape: 'Keine',
        size: 2.0,
      },
    ]
    const manualMounts: ManualMountConfig[] = [
      {
        id: genId(),
        x1: -0.7,
        y1: yUnten,
        x2: 0.35,
        y2: yUnten,
        type: 'Einseitig',
      },
    ]
    const masses: MassConfig[] = [
      {
        id: genId(),
        ref: 'R2',
        name: 'M1',
        length: 0.7,
        width: 0.8,
        height: 0.6,
        label: '$m$',
        relation: 'Mitte',
      },
    ]
    cfg.pulleys = pulleys
    cfg.anchors = anchors
    cfg.manual_mounts = manualMounts
    cfg.masses = masses
    cfg.ropes = [
      makeRope('Seil 1', [
        { name: 'A1', side: 'none' },
        { name: 'R1', side: 'cw' },
        { name: 'R2', side: 'ccw' },
        { name: 'R3', side: 'cw' },
        { name: 'A2', side: 'none' },
      ]),
    ]
    return cfg
  }

  // Gerades n (2, 4, 6): k = n / 2 Paare, abwechselnd unten (ccw) und oben (cw)
  const k = n / 2
  const pulleys: PulleyConfig[] = []
  const ropePath: { name: string; side: 'cw' | 'ccw' | 'none' }[] = [
    { name: 'A1', side: 'none' },
  ]

  for (let i = 0; i < n; i++) {
    const isBottom = i % 2 === 0
    const name = `R${i + 1}`
    const x = roundCoord((i - (n - 1) / 2) * step)
    const y = isBottom ? yUnten : yOben
    pulleys.push({
      id: genId(),
      name,
      x,
      y,
      radius: r,
      label: name,
      label_pos: isBottom ? 'below right' : 'above right',
      mount: isBottom ? 'Keine' : 'Einseitig',
      mount_angle: 90,
      mount_length: isBottom ? 0.5 : 1.0,
    })
    ropePath.push({ name, side: isBottom ? 'ccw' : 'cw' })
  }

  ropePath.push({ name: 'A2', side: 'none' })

  const xFirst = pulleys[0].x
  const xLast = pulleys[n - 1].x
  const anchors: AnchorConfig[] = [
    {
      id: genId(),
      name: 'A1',
      x: roundCoord(xFirst - r),
      y: yDecke,
      label: '',
      shape: 'Kreis',
      size: 2.0,
    },
    {
      id: genId(),
      name: 'A2',
      x: roundCoord(xLast + r),
      y: yZug,
      label: '',
      shape: 'Keine',
      size: 2.0,
    },
  ]

  if (k >= 2) {
    const xLastBottom = pulleys[n - 2].x
    cfg.manual_mounts = [
      {
        id: genId(),
        x1: xFirst,
        y1: yUnten,
        x2: xLastBottom,
        y2: yUnten,
        type: 'Einseitig',
      },
    ]
  }

  let massRef = 'R1'
  if (n === 4) {
    const xMid = roundCoord((pulleys[0].x + pulleys[2].x) / 2)
    anchors.push({
      id: genId(),
      name: 'A_last',
      x: xMid,
      y: yUnten,
      label: '',
      shape: 'Keine',
      size: 1.5,
    })
    massRef = 'A_last'
  } else if (n === 6) {
    massRef = 'R3'
  }

  cfg.pulleys = pulleys
  cfg.anchors = anchors
  cfg.ropes = [makeRope('Seil 1', ropePath)]
  cfg.masses = [
    {
      id: genId(),
      ref: massRef,
      name: 'M1',
      length: 0.5,
      width: 0.8,
      height: 0.6,
      label: '$m$',
      relation: 'Mitte',
    },
  ]
  return cfg
}

const buildPotenzflaschenzug = (k: PotenzStufenCount = 3): FlaschenzugConfig => {
  const r = 0.35
  const cfg = baseConfig(5.0)

  const pulleys: PulleyConfig[] = []
  const anchors: AnchorConfig[] = []
  const ropes: RopeConfig[] = []

  // k lose Rollen
  for (let i = 1; i <= k; i++) {
    const x = roundCoord((i - 1) * r - 0.7)
    const y = roundCoord(0.75 + (i - 1) * 0.75)
    pulleys.push({
      id: genId(),
      name: `R${i}`,
      x,
      y,
      radius: r,
      label: `R${i}`,
      label_pos: 'right',
      mount: 'Keine',
      mount_angle: 90,
      mount_length: 0.5,
    })
  }

  // 1 feste Umlenkrolle R_{k+1} an der Decke
  const xLastLose = pulleys[k - 1].x
  const fixedPulleyName = `R${k + 1}`
  pulleys.push({
    id: genId(),
    name: fixedPulleyName,
    x: roundCoord(xLastLose + 2 * r),
    y: 2.75,
    radius: r,
    label: fixedPulleyName,
    label_pos: 'above right',
    mount: 'Einseitig',
    mount_angle: 90,
    mount_length: 0.75,
  })

  // Seile & Anker
  for (let i = 1; i <= k; i++) {
    const p = pulleys[i - 1]
    const anchorName = `A${i}`
    anchors.push({
      id: genId(),
      name: anchorName,
      x: roundCoord(p.x - r),
      y: 3.5,
      label: '',
      shape: 'Kreis',
      size: 2.0,
    })

    if (i < k) {
      const nextP = pulleys[i]
      const helperName = `H${i + 1}`
      anchors.push({
        id: genId(),
        name: helperName,
        x: nextP.x,
        y: nextP.y,
        label: '',
        shape: 'Keine',
        size: 1.5,
      })
      ropes.push(
        makeRope(`Seil ${i}`, [
          { name: anchorName, side: 'none' },
          { name: `R${i}`, side: 'ccw' },
          { name: helperName, side: 'none' },
        ]),
      )
    } else {
      anchors.push({
        id: genId(),
        name: 'A_zug',
        x: roundCoord(p.x + 3 * r),
        y: 1.0,
        label: '',
        shape: 'Keine',
        size: 2.0,
      })
      ropes.push(
        makeRope(`Seil ${i}`, [
          { name: anchorName, side: 'none' },
          { name: `R${i}`, side: 'ccw' },
          { name: fixedPulleyName, side: 'cw' },
          { name: 'A_zug', side: 'none' },
        ]),
      )
    }
  }

  cfg.pulleys = pulleys
  cfg.anchors = anchors
  cfg.ropes = ropes
  cfg.masses = [
    {
      id: genId(),
      ref: 'R1',
      name: 'M1',
      length: 0.6,
      width: 0.8,
      height: 0.6,
      label: '$m$',
      relation: 'Mitte',
    },
  ]
  return cfg
}

export function buildFlaschenzugTemplate(
  id: FlaschenzugTemplateId,
  options?: FlaschenzugTemplateOptions,
): FlaschenzugConfig {
  switch (id) {
    case 'feste_rolle':
      return buildFesteRolle()
    case 'lose_rolle':
      return buildLoseRolle()
    case 'flaschenzug_n':
      return buildFlaschenzugN(options?.tragendeSeile ?? 4)
    case 'potenzflaschenzug':
      return buildPotenzflaschenzug(options?.potenzStufen ?? 3)
  }
}
