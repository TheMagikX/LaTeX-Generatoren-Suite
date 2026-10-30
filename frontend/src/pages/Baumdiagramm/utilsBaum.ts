// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Config, BaumNodeConfig } from './typesBaum'

// ---------------------------------------------------------------------------
// Pure helper functions
// ---------------------------------------------------------------------------

export const parseLatexProb = (tex: string): number | null => {
  if (!tex) return null
  // \frac{a}{b}, \dfrac{a}{b}, \tfrac{a}{b}
  let m = tex.match(/\\[dt]?frac\{(\d+)\}\{(\d+)\}/)
  if (m) {
    const num = parseInt(m[1])
    const den = parseInt(m[2])
    return den !== 0 ? num / den : null
  }
  // plain a/b (not preceded by a backslash)
  m = tex.match(/(?<!\\)\b(\d+)\s*\/\s*(\d+)\b/)
  if (m) {
    const num = parseInt(m[1])
    const den = parseInt(m[2])
    return den !== 0 ? num / den : null
  }
  // plain decimal or integer in [0, 1]
  m = tex.match(/\b(0(?:\.\d+)?|1(?:\.0+)?|\.\d+)\b/)
  if (m) return parseFloat(m[0])
  return null
}

export const getNumChildren = (cfg: Config, nodeId: string, currentLevel: number): number => {
  if (currentLevel >= cfg.max_depth) return 0
  if (cfg.mode === 'Symmetrisch (Standard)') return cfg.branches_global
  if (nodeId === 'root') return cfg.root_node.num_children
  return cfg.nodes[nodeId]?.num_children ?? 2
}

export const getAllNodesWithBranchIndex = (cfg: Config, targetK: number): string[] => {
  const result: string[] = []
  const traverse = (parentId: string, currentLevel: number) => {
    const numKids = getNumChildren(cfg, parentId, currentLevel)
    for (let k = 0; k < numKids; k++) {
      const childId = parentId === 'root' ? `${k}` : `${parentId}_${k}`
      if (k === targetK) result.push(childId)
      traverse(childId, currentLevel + 1)
    }
  }
  traverse('root', 0)
  return result
}

export const getAllPaths = (cfg: Config, nodeId: string, currentLevel: number): string[][] => {
  const numKids = getNumChildren(cfg, nodeId, currentLevel)
  if (numKids === 0) return [[nodeId]]
  const paths: string[][] = []
  for (let k = 0; k < numKids; k++) {
    const childId = nodeId === 'root' ? `${k}` : `${nodeId}_${k}`
    const subPaths = getAllPaths(cfg, childId, currentLevel + 1)
    for (const p of subPaths) {
      paths.push([nodeId, ...p])
    }
  }
  return paths
}

export const calcPathProb = (cfg: Config, path: string[]): number | null => {
  let result = 1.0
  for (const nodeId of path.slice(1)) {
    const nodeCfg = cfg.nodes[nodeId]
    let val: number | null = null

    if (nodeCfg) {
      val = cfg.use_numeric_probs ? nodeCfg.prob_value : parseLatexProb(nodeCfg.edge_label)
    }

    if (val === null) {
      // Fallback: guess from sibling count
      const parentId = path[path.indexOf(nodeId) - 1]
      const level = path.indexOf(nodeId) - 1
      const numSibs = getNumChildren(cfg, parentId, level)
      val = 1.0 / Math.max(numSibs, 1)
    }

    result *= val
  }
  return result
}

export const formatProb = (p: number): string => {
  if (p === 1) return '1'
  if (p === 0) return '0'
  // Try to find a simple fraction for common ones
  const eps = 0.0001
  for (let d = 2; d <= 100; d++) {
    const n = Math.round(p * d)
    if (Math.abs(p - n / d) < eps) return `${n}/${d}`
  }
  return p.toFixed(4).replace(/\.?0+$/, '')
}

// Returns the LaTeX complement "1 - value" for a 2-branch sibling auto-fill.
// Preserves \frac{} format when the input uses it.
export const computeLatexComplement = (value: string): string | null => {
  const p = parseLatexProb(value)
  if (p === null) return null
  const c = Math.max(0, Math.min(1, 1 - p))
  const formatted = formatProb(c)
  if (/\\[dt]?frac/.test(value) && formatted.includes('/')) {
    const [num, den] = formatted.split('/')
    return `\\frac{${num}}{${den}}`
  }
  return formatted
}

// ---------------------------------------------------------------------------
// Wizard helpers
// ---------------------------------------------------------------------------

export const buildBernoulliNodes = (n: number): { nodes: Record<string, BaumNodeConfig>; results: Record<string, string> } => {
  const nodes: Record<string, BaumNodeConfig> = {}
  const results: Record<string, string> = {}
  const recurse = (parentId: string, level: number, pathSoFar: string[]) => {
    if (level > n) return
    for (let k = 0; k < 2; k++) {
      const childId = parentId === 'root' ? `${k}` : `${parentId}_${k}`
      const isT = k === 0
      const letter = isT ? 'T' : 'N'
      nodes[childId] = { label: letter, labelHidden: false, edge_label: isT ? '$p$' : '$1-p$', edgeLabelHidden: false, prob_value: null, node_style: null, edge_style: null, num_children: 2 }
      const path = [...pathSoFar, letter]
      if (level === n) results[childId] = path.join('')
      else recurse(childId, level + 1, path)
    }
  }
  recurse('root', 1, [])
  return { nodes, results }
}

export const buildBinomialNodes = (n: number, p: number, annotate: boolean): { nodes: Record<string, BaumNodeConfig>; results: Record<string, string> } => {
  const q = 1 - p;
  const nodes: Record<string, BaumNodeConfig> = {};
  const results: Record<string, string> = {};

  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);

  const toFractionLaTeX = (decimal: number): string => {
    const precision = 1_000_000_000;
    const num = Math.round(decimal * precision);
    const den = precision;
    const common = gcd(num, den);
    return `\\frac{${num / common}}{${den / common}}`;
  };

  const recurse = (parentId: string, level: number, pathSoFar: string[]) => {
    if (level > n) return;
    for (let k = 0; k < 2; k++) {
      const childId = parentId === 'root' ? `${k}` : `${parentId}_${k}`;
      const isT = k === 0;
      const letter = isT ? 'T' : 'N';

      nodes[childId] = {
        label: letter,
        labelHidden: false,
        edge_label: '',
        edgeLabelHidden: false,
        prob_value: isT ? p : q,
        node_style: null,
        edge_style: null,
        num_children: 2
      };

      const path = [...pathSoFar, letter];
      if (level === n) {
        const successes = path.filter(l => l === 'T').length;
        const pathProb = Math.pow(p, successes) * Math.pow(q, n - successes);

        // Erstellung des LaTeX-Strings
        const pString = toFractionLaTeX(pathProb);
        results[childId] = annotate ? `$P(${path.join('')}) = ${pString}$` : path.join('');
      } else {
        recurse(childId, level + 1, path);
      }
    }
  };

  recurse('root', 1, []);
  return { nodes, results };
}
