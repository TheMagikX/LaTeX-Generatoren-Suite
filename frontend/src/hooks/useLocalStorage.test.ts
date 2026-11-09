// SPDX-License-Identifier: AGPL-3.0-or-later

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import useLocalStorage from './useLocalStorage.ts'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Konfigurationsobjekte', () => {
    interface Config {
      theme: string
      zoom: number
      showGrid?: boolean
    }

    const defaultConfig: Config = {
      theme: 'dark',
      zoom: 1,
    }

    it('gibt defaultValue zurück, wenn kein Eintrag im localStorage existiert', () => {
      const { result } = renderHook(() => useLocalStorage<Config>('test_cfg', defaultConfig))
      expect(result.current[0]).toEqual(defaultConfig)
    })

    it('speichert Änderungen im localStorage und aktualisiert den State', () => {
      const { result } = renderHook(() => useLocalStorage<Config>('test_cfg', defaultConfig))

      act(() => {
        result.current[1]({ theme: 'light', zoom: 2 })
      })

      expect(result.current[0]).toEqual({ theme: 'light', zoom: 2 })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(JSON.parse(localStorage.getItem('test_cfg')!)).toEqual({ theme: 'light', zoom: 2 })
    })

    it('unterstützt funktionale State-Updates', () => {
      const { result } = renderHook(() => useLocalStorage<Config>('test_cfg', defaultConfig))

      act(() => {
        result.current[1](prev => ({ ...prev, zoom: prev.zoom + 1 }))
      })

      expect(result.current[0]).toEqual({ theme: 'dark', zoom: 2 })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(JSON.parse(localStorage.getItem('test_cfg')!)).toEqual({ theme: 'dark', zoom: 2 })
    })

    it('führt ein Shallow-Merge durch, wenn neue Felder im defaultValue hinzukommen', () => {
      // Simuliere einen älteren gespeicherten Stand ohne 'showGrid'
      localStorage.setItem('test_cfg', JSON.stringify({ theme: 'light', zoom: 1.5 }))

      const extendedDefault: Config = {
        theme: 'dark',
        zoom: 1,
        showGrid: true,
      }

      const { result } = renderHook(() => useLocalStorage<Config>('test_cfg', extendedDefault))

      // Der gespeicherte Wert überschreibt theme und zoom, das neue Feld showGrid bleibt erhalten
      expect(result.current[0]).toEqual({
        theme: 'light',
        zoom: 1.5,
        showGrid: true,
      })
    })

    it('fällt bei korruptem JSON im localStorage sicher auf den Default-Wert zurück', () => {
      localStorage.setItem('test_cfg', 'invalid-json{{{')

      const { result } = renderHook(() => useLocalStorage<Config>('test_cfg', defaultConfig))
      expect(result.current[0]).toEqual(defaultConfig)
    })
  })

  describe('Primitive Datentypen & Arrays', () => {
    it('erhält boolesche Werte (true/false) nach Re-Initialisierung ohne Umwandlung in {}', () => {
      localStorage.setItem('bool_key', JSON.stringify(false))

      const { result } = renderHook(() => useLocalStorage<boolean>('bool_key', true))

      expect(typeof result.current[0]).toBe('boolean')
      expect(result.current[0]).toBe(false)
    })

    it('erhält Arrays (z. B. ["a", "b"]) ohne Transformation in indexierte Objekte { "0": "a", "1": "b" }', () => {
      localStorage.setItem('arr_key', JSON.stringify(['a', 'b']))

      const { result } = renderHook(() => useLocalStorage<string[]>('arr_key', []))

      expect(Array.isArray(result.current[0])).toBe(true)
      expect(result.current[0]).toEqual(['a', 'b'])
    })

    it('erhält Zahlen und Strings zuverlässig', () => {
      localStorage.setItem('num_key', JSON.stringify(42))
      localStorage.setItem('str_key', JSON.stringify('nord'))

      const { result: numRes } = renderHook(() => useLocalStorage<number>('num_key', 0))
      const { result: strRes } = renderHook(() => useLocalStorage<string>('str_key', 'dark'))

      expect(numRes.current[0]).toBe(42)
      expect(strRes.current[0]).toBe('nord')
    })

    it('fällt auf defaultValue zurück, wenn ein inkonsistenter Datentyp im localStorage liegt', () => {
      localStorage.setItem('obj_key', JSON.stringify('unexpected-string'))

      const { result } = renderHook(() =>
        useLocalStorage<{ a: number }>('obj_key', { a: 1 })
      )

      expect(result.current[0]).toEqual({ a: 1 })
    })
  })
})
