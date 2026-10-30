// SPDX-License-Identifier: AGPL-3.0-or-later

const TIKZ_ENVIRONMENT_PATTERN = /\\begin\{(tikzpicture|circuitikz)\}[\s\S]*?\\end\{\1\}/g

/**
 * Extracts standalone TikZ / CircuiTikZ code along with any color definitions
 * (\\definecolor, \\colorlet, \\providecolor) defined before/outside the environment.
 */
export const extractTikzCode = (latex: string): string | null => {
  if (!latex) return null

  const envMatches = Array.from(latex.matchAll(TIKZ_ENVIRONMENT_PATTERN))
  if (envMatches.length === 0) {
    return null
  }

  const environments = envMatches.map(match => match[0].trim())
  const combinedEnvCode = environments.join('\n\n')

  // Find all parts of the document that are OUTSIDE the TikZ environments
  let outsideText = latex
  for (const match of envMatches) {
    if (match.index !== undefined) {
      outsideText =
        outsideText.slice(0, match.index) +
        ' '.repeat(match[0].length) +
        outsideText.slice(match.index + match[0].length)
    }
  }

  // Extract color definitions outside the environments (\definecolor, \colorlet, \providecolor)
  const colorDefPattern =
    /\\(?:definecolor|colorlet|providecolor)\s*(?:\[[^\]\r\n]*\])?(?:\s*\{[^}\r\n]+\}){2,3}/g
  const colorDefs = Array.from(outsideText.matchAll(colorDefPattern), m => m[0].trim()).filter(
    def => !def.includes('#1')
  )

  const uniqueColorDefs = Array.from(new Set(colorDefs))
  if (uniqueColorDefs.length > 0) {
    return `${uniqueColorDefs.join('\n')}\n\n${combinedEnvCode}`
  }

  return combinedEnvCode
}

