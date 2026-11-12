// SPDX-License-Identifier: AGPL-3.0-or-later

import React, { StrictMode } from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  useGeneratorHistory,
  isDeepEqual,
  isEditableTextElement,
} from '../useGeneratorHistory'

describe('isDeepEqual', () => {
  it('erkennt primitive Werte und Referenzidentität korrekt', () => {
    expect(isDeepEqual(1, 1)).toBe(true)
    expect(isDeepEqual(1, 2)).toBe(false)
    expect(isDeepEqual('test', 'test')).toBe(true)
    expect(isDeepEqual('a', 'b')).toBe(false)
    expect(isDeepEqual(true, true)).toBe(true)
    expect(isDeepEqual(true, false)).toBe(false)
    expect(isDeepEqual(null, null)).toBe(true)
    expect(isDeepEqual(undefined, undefined)).toBe(true)
    expect(isDeepEqual(null, undefined)).toBe(false)
    expect(isDeepEqual(NaN, NaN)).toBe(true)

    const obj = { a: 1 }
    expect(isDeepEqual(obj, obj)).toBe(true)
  })

  it('erkennt Arrays und verschachtelte Strukturen unabhängig von Referenzen', () => {
    expect(isDeepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(isDeepEqual([1, 2], [1, 2, 3])).toBe(false)
    expect(isDeepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(isDeepEqual([[1, 2], [3]], [[1, 2], [3]])).toBe(true)
    expect(isDeepEqual([1], { 0: 1 })).toBe(false)
  })

  it('erkennt Objekte unabhängig von der Schlüsselreihenfolge', () => {
    const objA = { x: 10, y: 20, style: { color: 'red', width: 2 } }
    const objB = { y: 20, x: 10, style: { width: 2, color: 'red' } }
    expect(isDeepEqual(objA, objB)).toBe(true)

    const objC = { ...objA, y: 21 }
    expect(isDeepEqual(objA, objC)).toBe(false)

    const objD = { x: 10 }
    const objE = { x: 10, extra: true }
    expect(isDeepEqual(objD, objE)).toBe(false)
  })
})

describe('isEditableTextElement', () => {
  it('behandelt null und Nicht-Elemente sicher', () => {
    expect(isEditableTextElement(null)).toBe(false)
  })

  it('blockiert Generator-Undo bei nativen Text-Eingabefeldern', () => {
    const textarea = document.createElement('textarea')
    expect(isEditableTextElement(textarea)).toBe(true)

    const inputText = document.createElement('input')
    inputText.type = 'text'
    expect(isEditableTextElement(inputText)).toBe(true)

    const inputNumber = document.createElement('input')
    inputNumber.type = 'number'
    expect(isEditableTextElement(inputNumber)).toBe(true)

    const contentEditable = document.createElement('div')
    contentEditable.contentEditable = 'true'
    expect(isEditableTextElement(contentEditable)).toBe(true)
  })

  it('blockiert Generator-Undo innerhalb von Code-Editoren (.cm-editor, .ace_editor)', () => {
    const editorContainer = document.createElement('div')
    editorContainer.className = 'cm-editor'
    const childSpan = document.createElement('span')
    editorContainer.appendChild(childSpan)
    document.body.appendChild(editorContainer)

    expect(isEditableTextElement(childSpan)).toBe(true)

    document.body.removeChild(editorContainer)
  })

  it('erlaubt Generator-Undo bei Slidern, Checkboxen, Buttons und Dropdowns', () => {
    const inputRange = document.createElement('input')
    inputRange.type = 'range'
    expect(isEditableTextElement(inputRange)).toBe(false)

    const inputCheckbox = document.createElement('input')
    inputCheckbox.type = 'checkbox'
    expect(isEditableTextElement(inputCheckbox)).toBe(false)

    const inputColor = document.createElement('input')
    inputColor.type = 'color'
    expect(isEditableTextElement(inputColor)).toBe(false)

    const button = document.createElement('button')
    expect(isEditableTextElement(button)).toBe(false)

    const select = document.createElement('select')
    expect(isEditableTextElement(select)).toBe(false)
  })
})

describe('useGeneratorHistory Hook', () => {
  interface TestConfig {
    title: string
    count: number
    nested?: { factor: number }
  }

  const initialConfig: TestConfig = {
    title: 'Initial',
    count: 0,
    nested: { factor: 1 },
  }

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initialisiert mit Default-Werten und canUndo=false, canRedo=false', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    const [state, , history] = result.current
    expect(state).toEqual(initialConfig)
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })

  it('fasst kontinuierliche Änderungen im Debounce-Fenster zusammen (Coalescing)', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig, { debounceMs: 400 })
    )

    // Slider-Simulation: 5 schnelle Ticks
    act(() => {
      result.current[1]((prev) => ({ ...prev, count: 1 }))
    })
    expect(result.current[2].canUndo).toBe(true) // sofort aktivierbar
    expect(result.current[0].count).toBe(1)

    act(() => {
      vi.advanceTimersByTime(100)
      result.current[1]((prev) => ({ ...prev, count: 2 }))
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current[1]((prev) => ({ ...prev, count: 3 }))
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current[1]((prev) => ({ ...prev, count: 4 }))
    })
    act(() => {
      vi.advanceTimersByTime(100)
      result.current[1]((prev) => ({ ...prev, count: 5 }))
    })

    // Debounce-Timer verstreichen lassen
    act(() => {
      vi.advanceTimersByTime(400)
    })

    expect(result.current[0].count).toBe(5)
    expect(result.current[2].canUndo).toBe(true)
    expect(result.current[2].canRedo).toBe(false)

    // Genau 1 Undo springt direkt auf den Ausgangswert 0 zurück
    act(() => {
      result.current[2].undo()
    })

    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canUndo).toBe(false)
    expect(result.current[2].canRedo).toBe(true)

    // Redo stellt den finalen Wert 5 wieder her
    act(() => {
      result.current[2].redo()
    })

    expect(result.current[0].count).toBe(5)
    expect(result.current[2].canUndo).toBe(true)
    expect(result.current[2].canRedo).toBe(false)
  })

  it('unterstützt sofortiges Undo während aktivem Debounce-Fenster', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig, { debounceMs: 400 })
    )

    act(() => {
      result.current[1]({ ...initialConfig, count: 42 })
    })

    expect(result.current[0].count).toBe(42)
    expect(result.current[2].canUndo).toBe(true)

    // Sofort Undo drücken, BEVOR 400ms vergangen sind
    act(() => {
      vi.advanceTimersByTime(150)
      result.current[2].undo()
    })

    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canUndo).toBe(false)
    expect(result.current[2].canRedo).toBe(true)

    // Redo stellt 42 wieder her
    act(() => {
      result.current[2].redo()
    })
    expect(result.current[0].count).toBe(42)
  })

  it('erzeugt mit commitImmediate sofort einen History-Eintrag ohne Debounce-Verzögerung', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    act(() => {
      result.current[2].commitImmediate({ ...initialConfig, title: 'Preset A' })
    })

    expect(result.current[0].title).toBe('Preset A')
    expect(result.current[2].canUndo).toBe(true)
    expect(result.current[2].canRedo).toBe(false)

    act(() => {
      result.current[2].undo()
    })

    expect(result.current[0].title).toBe('Initial')
    expect(result.current[2].canUndo).toBe(false)
    expect(result.current[2].canRedo).toBe(true)
  })

  it('flusht ausstehendes Debounce, wenn commitImmediate aufgerufen wird', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig, { debounceMs: 400 })
    )

    // Slider-Änderung startet Debounce
    act(() => {
      result.current[1]((prev) => ({ ...prev, count: 10 }))
    })

    // Großaktion (z. B. Preset geladen) wird sofort committed
    act(() => {
      vi.advanceTimersByTime(50)
      result.current[2].commitImmediate((prev) => ({ ...prev, title: 'Committed' }))
    })

    expect(result.current[0]).toEqual({
      title: 'Committed',
      count: 10,
      nested: { factor: 1 },
    })

    // Erstes Undo geht zurück auf count: 10 (vor dem Commit)
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].title).toBe('Initial')
    expect(result.current[0].count).toBe(10)

    // Zweites Undo geht zurück auf count: 0 (vor dem Slider)
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canUndo).toBe(false)
  })

  it('ignoriert identische Zustände dank isDeepEqual und löscht nicht die Future-History', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    act(() => {
      result.current[2].commitImmediate({ ...initialConfig, count: 1 })
    })
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[2].canRedo).toBe(true)

    // Setze identischen Zustand (anderes Objekt, gleiche Werte)
    act(() => {
      result.current[1]({
        count: 0,
        title: 'Initial',
        nested: { factor: 1 },
      })
    })

    // Future-Historie bleibt erhalten, da keine reale Wertänderung stattfand
    expect(result.current[2].canRedo).toBe(true)

    act(() => {
      result.current[2].redo()
    })
    expect(result.current[0].count).toBe(1)
  })

  it('respektiert das Ringpuffer-Limit maxDepth', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig, { maxDepth: 3 })
    )

    // 5 Commits durchführen
    for (let i = 1; i <= 5; i++) {
      act(() => {
        result.current[2].commitImmediate((prev) => ({ ...prev, count: i }))
      })
    }

    expect(result.current[0].count).toBe(5)

    // Undo 1 -> count: 4
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(4)

    // Undo 2 -> count: 3
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(3)

    // Undo 3 -> count: 2 (Limit 3 erreicht)
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(2)
    expect(result.current[2].canUndo).toBe(false)
  })

  it('setzt Historie und optional Zustand mit resetHistory zurück', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    act(() => {
      result.current[2].commitImmediate({ ...initialConfig, count: 99 })
    })
    expect(result.current[2].canUndo).toBe(true)

    act(() => {
      result.current[2].resetHistory(initialConfig)
    })

    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canUndo).toBe(false)
    expect(result.current[2].canRedo).toBe(false)
  })

  it('reagiert auf globale Tastenkombinationen Strg+Z und Strg+Y / Strg+Shift+Z', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    act(() => {
      result.current[2].commitImmediate({ ...initialConfig, count: 50 })
    })
    expect(result.current[0].count).toBe(50)

    // Strg+Z drücken
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })
    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canRedo).toBe(true)

    // Strg+Y drücken
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })
      )
    })
    expect(result.current[0].count).toBe(50)

    // Strg+Z
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })
    expect(result.current[0].count).toBe(0)

    // Strg+Shift+Z drücken
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true })
      )
    })
    expect(result.current[0].count).toBe(50)
  })

  it('ignoriert Tastenkürzel, wenn der Fokus in einem Text-Eingabefeld liegt', () => {
    const { result } = renderHook(() =>
      useGeneratorHistory<TestConfig>('test_history', initialConfig)
    )

    act(() => {
      result.current[2].commitImmediate({ ...initialConfig, count: 77 })
    })

    const textInput = document.createElement('input')
    textInput.type = 'text'
    document.body.appendChild(textInput)
    textInput.focus()

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
      )
    })

    // State bleibt unverändert, da Textfeld fokussiert ist
    expect(result.current[0].count).toBe(77)

    document.body.removeChild(textInput)
  })

  it('arbeitet fehlerfrei und ohne doppelte History-Einträge unter React.StrictMode', () => {
    const { result } = renderHook(
      () => useGeneratorHistory<TestConfig>('test_history_strict', initialConfig),
      {
        wrapper: ({ children }) => React.createElement(StrictMode, null, children),
      }
    )

    act(() => {
      result.current[2].commitImmediate((prev) => ({ ...prev, count: 1 }))
    })

    expect(result.current[0].count).toBe(1)
    expect(result.current[2].canUndo).toBe(true)

    act(() => {
      result.current[2].commitImmediate((prev) => ({ ...prev, count: 2 }))
    })

    expect(result.current[0].count).toBe(2)

    // Bei 2 Commits darf man im StrictMode genau 2-mal Undo ausführen können
    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(1)
    expect(result.current[2].canUndo).toBe(true)

    act(() => {
      result.current[2].undo()
    })
    expect(result.current[0].count).toBe(0)
    expect(result.current[2].canUndo).toBe(false)
  })
})
