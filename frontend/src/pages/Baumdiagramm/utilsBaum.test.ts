// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect } from 'vitest'
import {
  MAX_WIZARD_DEPTH,
  clampWizardDepth,
  clampProbability,
  buildBernoulliNodes,
  buildBinomialNodes,
} from './utilsBaum'

describe('utilsBaum Wizard Guards & Generatoren', () => {
  it('clampWizardDepth begrenzt n auf [1, MAX_WIZARD_DEPTH] und fällt bei NaN/Infinity auf 2 zurück', () => {
    expect(clampWizardDepth(NaN)).toBe(2)
    expect(clampWizardDepth(Infinity)).toBe(2)
    expect(clampWizardDepth(-Infinity)).toBe(2)
    expect(clampWizardDepth(0)).toBe(1)
    expect(clampWizardDepth(-5)).toBe(1)
    expect(clampWizardDepth(2.9)).toBe(2)
    expect(clampWizardDepth(99)).toBe(MAX_WIZARD_DEPTH)
  })

  it('clampProbability begrenzt p auf [0, 1] und fällt bei NaN/Infinity auf 0.5 zurück', () => {
    expect(clampProbability(NaN)).toBe(0.5)
    expect(clampProbability(Infinity)).toBe(0.5)
    expect(clampProbability(-Infinity)).toBe(0.5)
    expect(clampProbability(-0.3)).toBe(0)
    expect(clampProbability(1.8)).toBe(1)
    expect(clampProbability(0.25)).toBe(0.25)
  })

  it('buildBernoulliNodes erzeugt für n=2 exakt 6 Knoten und 4 Ergebnisse', () => {
    const { nodes, results } = buildBernoulliNodes(2)
    expect(Object.keys(nodes)).toHaveLength(6)
    expect(Object.keys(results)).toHaveLength(4)
    expect(results['0_0']).toBe('TT')
    expect(results['1_1']).toBe('NN')
  })

  it('buildBernoulliNodes verhindert Stack-Overflow und exponentiellen Blowup bei NaN / großem n', () => {
    const nanRes = buildBernoulliNodes(NaN)
    expect(Object.keys(nanRes.results)).toHaveLength(4)

    const largeRes = buildBernoulliNodes(50)
    expect(Object.keys(largeRes.results)).toHaveLength(Math.pow(2, MAX_WIZARD_DEPTH))
    expect(Object.keys(largeRes.nodes)).toHaveLength(Math.pow(2, MAX_WIZARD_DEPTH + 1) - 2)
  })

  it('buildBinomialNodes stürzt bei p=NaN oder p=Infinity nicht mit Stack-Overflow ab', () => {
    const nanP = buildBinomialNodes(2, NaN, true)
    expect(Object.keys(nanP.results)).toHaveLength(4)
    expect(nanP.results['0_0']).toBe('$P(TT) = \\frac{1}{4}$')

    const infP = buildBinomialNodes(2, Infinity, true)
    expect(Object.keys(infP.results)).toHaveLength(4)
    expect(infP.results['0_0']).toBe('$P(TT) = \\frac{1}{4}$')
  })

  it('buildBinomialNodes clampt p außerhalb [0, 1] sowie n auf gültige Grenzen', () => {
    const overP = buildBinomialNodes(2, 1.5, true)
    expect(overP.nodes['0'].prob_value).toBe(1)
    expect(overP.nodes['1'].prob_value).toBe(0)
    expect(overP.results['0_0']).toBe('$P(TT) = \\frac{1}{1}$')

    const underP = buildBinomialNodes(2, -0.5, false)
    expect(underP.nodes['0'].prob_value).toBe(0)
    expect(underP.nodes['1'].prob_value).toBe(1)
    expect(underP.results['0_0']).toBe('TT')

    const largeN = buildBinomialNodes(100, 0.5, false)
    expect(Object.keys(largeN.results)).toHaveLength(Math.pow(2, MAX_WIZARD_DEPTH))
    expect(MAX_WIZARD_DEPTH).toBe(8)
  })
})
