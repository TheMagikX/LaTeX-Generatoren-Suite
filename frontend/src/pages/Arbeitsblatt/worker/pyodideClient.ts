// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ArbeitsblattExecutionResponse } from '../../../api/client'
import type { WorkerExecuteRequest, WorkerExecuteResponse } from './pyodide.worker'

let workerInstance: Worker | null = null
let requestIdCounter = 0
let isInitialized = false

function getOrCreateWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('./pyodide.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return workerInstance
}

function terminateWorker(): void {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
    isInitialized = false
  }
}

/**
 * Executes worksheet Python code inside an isolated client-side WebAssembly (Pyodide) Web Worker.
 * Enforces an execution timeout (longer on first cold load of WASM, strict 5s once initialized)
 * and terminates the worker if an infinite loop occurs.
 */
export function executeWorksheetCodeInPyodide(payload: {
  python_code: string
  random_seed?: string | number | null
}): Promise<ArbeitsblattExecutionResponse> {
  const id = ++requestIdCounter
  const worker = getOrCreateWorker()
  // Allow up to 25s on first run (loading WASM + stdlib), and 5s on subsequent runs
  const timeoutMs = isInitialized ? 5000 : 25000

  return new Promise<ArbeitsblattExecutionResponse>((resolve) => {
    const timer = window.setTimeout(() => {
      terminateWorker()
      resolve({
        success: false,
        vars: {},
        error: `Zeitüberschreitung: Die Python-Ausführung wurde nach ${timeoutMs / 1000} Sekunden abgebrochen (mögliche Endlosschleife).`,
        seed: payload.random_seed,
      })
    }, timeoutMs)

    const handleMessage = (event: MessageEvent<WorkerExecuteResponse>) => {
      if (event.data?.id !== id) return
      window.clearTimeout(timer)
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      isInitialized = true

      resolve({
        success: !event.data.error,
        vars: event.data.vars ?? {},
        error: event.data.error ?? undefined,
        seed: event.data.seed ?? payload.random_seed,
      })
    }

    const handleError = (err: ErrorEvent) => {
      window.clearTimeout(timer)
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      terminateWorker()

      resolve({
        success: false,
        vars: {},
        error: err.message || 'Unbekannter Fehler im Pyodide-Web-Worker.',
        seed: payload.random_seed,
      })
    }

    worker.addEventListener('message', handleMessage)
    worker.addEventListener('error', handleError)

    const req: WorkerExecuteRequest = {
      id,
      python_code: payload.python_code,
      random_seed: payload.random_seed,
    }
    worker.postMessage(req)
  })
}
