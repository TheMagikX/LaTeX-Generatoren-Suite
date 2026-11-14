// SPDX-License-Identifier: AGPL-3.0-or-later

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Mergt eine geladene (potenziell partielle oder ältere) Preset-Konfiguration
 * rekursiv mit `defaults`. Plain Objects werden tief gemergt; Arrays werden
 * auf Typgleichheit geprüft (und bei Vorhandensein vollständig ersetzt, niemals
 * mit Default-Einträgen gemischt), sodass fehlende oder ungültige Sub-Objekte
 * keine Laufzeitfehler (`TypeError`) verursachen. Verschachtelte Objekte und
 * Arrays aus `defaults` werden stets frisch geklont (referenzielle Isolation).
 */
export function deepMergeConfig<T extends object>(defaults: T, loaded: unknown): T {
  const defaultsRecord = defaults as Record<string, unknown>
  const loadedRecord = isPlainObject(loaded) ? loaded : {}
  const result: Record<string, unknown> = {}

  const keys = new Set([...Object.keys(defaultsRecord), ...Object.keys(loadedRecord)])

  for (const key of keys) {
    const defaultValue = defaultsRecord[key]
    const loadedValue = loadedRecord[key]

    if (isPlainObject(defaultValue)) {
      result[key] = isPlainObject(loadedValue)
        ? deepMergeConfig(defaultValue, loadedValue)
        : deepMergeConfig(defaultValue, {})
    } else if (Array.isArray(defaultValue)) {
      result[key] = Array.isArray(loadedValue) ? [...loadedValue] : [...defaultValue]
    } else if (loadedValue !== undefined) {
      result[key] = loadedValue
    } else {
      result[key] = defaultValue
    }
  }

  return result as T
}
