// SPDX-License-Identifier: AGPL-3.0-or-later

import type { Student } from './typesSitz'

export const symmetrizeDislikes = (students: Student[]): Student[] => {
  const nameMap = new Map<string, Student>()
  students.forEach(st => {
    if (st.name) nameMap.set(st.name.trim().toLowerCase(), st)
  })

  // Collect all mutual dislikes
  const dislikesMap = new Map<string, Set<string>>()
  students.forEach(st => {
    dislikesMap.set(st.name, new Set(st.dislikes_neighbors || []))
  })

  // Symmetrisch propagieren: Wenn A -> B einträgt, muss auch B -> A haben
  students.forEach(st => {
    const aName = st.name
    const currentDislikes = st.dislikes_neighbors || []
    currentDislikes.forEach(targetName => {
      const targetStudent = nameMap.get(targetName.trim().toLowerCase())
      const canonicalTargetName = targetStudent ? targetStudent.name : targetName

      dislikesMap.get(aName)?.add(canonicalTargetName)
      if (dislikesMap.has(canonicalTargetName)) {
        dislikesMap.get(canonicalTargetName)?.add(aName)
      }
    })
  })

  return students.map(st => {
    const symDislikes = Array.from(dislikesMap.get(st.name) || [])
    // Gegenseitige Abneigungen entfernen eventuelle Wünsche auf dieselbe Person (Konfliktvermeidung)
    const cleanWants = (st.wants_neighbors || []).filter(
      w => !symDislikes.some(d => d.trim().toLowerCase() === w.trim().toLowerCase())
    )
    return {
      ...st,
      dislikes_neighbors: symDislikes,
      wants_neighbors: cleanWants,
    }
  })
}

export const parseStudentCSV = (data: Array<Record<string, unknown>>): Student[] => {
  const parsed = data.flatMap(row => {
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

  return symmetrizeDislikes(parsed)
}
