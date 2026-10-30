// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Student } from './typesSitz'

export const parseStudentCSV = (data: Array<Record<string, unknown>>): Student[] => {
  return data.flatMap(row => {
    const keys = Object.keys(row)
    const norm = (s: string) => s.toLowerCase().replace(/[^\u0020-\u007E]/g, '')
    const findVal = (patterns: string[]) => {
      const key = keys.find(k => patterns.some(p => norm(k).includes(norm(p))))
      return key ? row[key] : ''
    }

    const name = String(findVal(['name']) || '').trim()
    if (!name) return []

    const splitNames = (val: unknown) => {
      if (!val) return []
      return String(val).split(/[;,]/).map(s => s.trim()).filter(s => s && s !== name)
    }

    return [{
      name,
      wants_neighbors: splitNames(findVal(['wüns', 'wuns', 'pref', 'wunsch', 'wns'])),
      dislikes_neighbors: splitNames(findVal(['abneig', 'dislike'])),
      wants_front: false
    }]
  })
}
