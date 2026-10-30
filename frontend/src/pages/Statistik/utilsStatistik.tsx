import type { StatistikConfig } from './typesStatistik'

export const parseRawData = (value: string): number[] => {
  return value.split(/[,\s\n]+/)
    .map((v: string) => parseFloat(v.replace(',', '.')))
    .filter((v: number) => !isNaN(v))
}

export const extractBarchartCategories = (ds: {
  data_mode: 'Raw' | 'Frequency' | 'Parameters' | string
  freq_data_string?: string
  raw_data_string?: string
  raw_data?: number[]
}): string[] => {
  const categories: string[] = []

  if (ds.data_mode === 'Frequency' && ds.freq_data_string) {
    for (const line of ds.freq_data_string.split(/[;\n]+/)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const sep = trimmed.includes(':') ? ':' : ','
      const parts = trimmed.split(sep)
      if (parts.length >= 2) {
        const cat = parts[0].trim().replace(/[{}]/g, '')
        if (cat && !categories.includes(cat)) {
          categories.push(cat)
        }
      }
    }
    return categories
  }

  // Raw mode
  if (ds.raw_data_string && ds.raw_data_string.trim()) {
    const tokens = ds.raw_data_string
      .split(/[,;\n\s]+/)
      .map(t => t.trim())
      .filter(Boolean)

    if (tokens.length > 0) {
      const allNumbers = tokens.every(t => !isNaN(Number(t.replace(',', '.'))))
      if (allNumbers) {
        const uniqueNums = Array.from(new Set(tokens.map(t => Number(t.replace(',', '.'))))).sort((a, b) => a - b)
        return uniqueNums.map(n => String(n).replace('.', ','))
      } else {
        const seen = new Set<string>()
        for (const t of tokens) {
          if (!seen.has(t)) {
            seen.add(t)
            categories.push(t)
          }
        }
        return categories
      }
    }
  }

  if (ds.raw_data && ds.raw_data.length > 0) {
    return ds.raw_data.map((_, i) => String(i + 1))
  }

  return []
}

export const computeAutoYRange = (config: StatistikConfig): { min: number; max: number } => {
  if (config.type === 'Säulendiagramm') {
    if (config.barchart_opts.orientation === 'horizontal') {
      const count = config.datasets.reduce((max, ds) => Math.max(max, extractBarchartCategories(ds).length), 0)
      return { min: 0, max: Math.max(count, 5) }
    }
    const allVals: number[] = []
    for (const ds of config.datasets) {
      if (ds.data_mode === 'Frequency' && ds.freq_data_string) {
        for (const line of ds.freq_data_string.split(/[;\n]+/)) {
          const sep = line.includes(':') ? ':' : ','
          const parts = line.split(sep)
          if (parts.length >= 2) {
            const val = parseFloat(parts[1].trim().replace(',', '.'))
            if (!isNaN(val)) allVals.push(val)
          }
        }
      } else if (ds.raw_data_string) {
        const tokens = ds.raw_data_string.split(/[,;\n\s]+/).map(t => t.trim()).filter(Boolean)
        const counts: Record<string, number> = {}
        for (const t of tokens) {
          counts[t] = (counts[t] || 0) + 1
        }
        allVals.push(...Object.values(counts))
      } else if (ds.raw_data) {
        allVals.push(...ds.raw_data)
      }
    }
    const maxVal = allVals.length > 0 ? Math.max(...allVals) : 5
    const step = config.y_axis.step > 0 ? config.y_axis.step : 1
    const ymin = config.y_axis.min ?? 0
    const stepsNeeded = Math.ceil((maxVal - ymin) / step) + 1
    const autoMax = ymin + Math.max(1, stepsNeeded) * step
    return { min: ymin, max: autoMax }
  }

  if (config.type === 'Histogramm') {
    const binWidth = config.histogram_opts.bin_width > 0 ? config.histogram_opts.bin_width : 1
    const allVals: number[] = []
    for (const ds of config.datasets) {
      if (ds.raw_data && ds.raw_data.length > 0) {
        allVals.push(...ds.raw_data)
      } else if (ds.raw_data_string) {
        allVals.push(...parseRawData(ds.raw_data_string))
      }
    }
    if (allVals.length > 0) {
      const minX = config.x_axis.min ?? 0
      const maxX = config.x_axis.max ?? 10
      const binCounts: Record<number, number> = {}
      for (const v of allVals) {
        if (v >= minX && v <= maxX) {
          const binIdx = Math.floor((v - minX) / binWidth)
          binCounts[binIdx] = (binCounts[binIdx] || 0) + 1
        }
      }
      const maxCount = Object.values(binCounts).length > 0 ? Math.max(...Object.values(binCounts)) : 5
      const autoMax = maxCount <= 5 ? maxCount + 1 : Math.ceil(maxCount * 1.25)
      return { min: 0, max: autoMax }
    }
    return { min: 0, max: 10 }
  }

  if (config.type === 'Summenkurve') {
    return { min: 0, max: config.summenkurve_opts.as_percent ? 100 : 1 }
  }

  if (config.type === 'Boxplot' || config.type === 'Violin') {
    const isHorizontal = config.type === 'Boxplot' 
      ? config.boxplot_opts.orientation === 'horizontal'
      : config.violin_opts.orientation === 'horizontal'
    if (isHorizontal) {
      return { min: 0.5, max: Math.max(config.datasets.length + 0.5, 2) }
    }
    const allVals: number[] = []
    for (const ds of config.datasets) {
      if (ds.raw_data && ds.raw_data.length > 0) {
        allVals.push(...ds.raw_data)
      } else if (ds.raw_data_string) {
        allVals.push(...parseRawData(ds.raw_data_string))
      }
    }
    if (allVals.length > 0) {
      const minVal = Math.min(...allVals)
      const maxVal = Math.max(...allVals)
      const pad = (maxVal - minVal) * 0.15 || 1
      return { min: Math.floor(minVal - pad), max: Math.ceil(maxVal + pad) }
    }
    return { min: 0, max: 10 }
  }

  return { min: 0, max: 10 }
}

