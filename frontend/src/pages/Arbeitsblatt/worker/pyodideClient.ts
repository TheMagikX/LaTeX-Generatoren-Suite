// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ArbeitsblattExecutionResponse } from '../../../api/client'
import type { WorkerExecuteRequest, WorkerExecuteResponse } from './pyodide.worker'

interface PendingWorkerRequest {
  id: number
  worker: Worker
  timer: number
  seed?: string | number | null
  cleanupAndResolve: (response: ArbeitsblattExecutionResponse) => void
}

let workerInstance: Worker | null = null
let requestIdCounter = 0
let isInitialized = false
const pendingRequests = new Map<number, PendingWorkerRequest>()

function getOrCreateWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL('./pyodide.worker.ts', import.meta.url), {
      type: 'module',
    })
  }
  return workerInstance
}

function terminateWorker(
  targetWorker?: Worker,
  reason?: string,
  excludeRequestId?: number
): void {
  const workerToTerminate = targetWorker ?? workerInstance
  if (!workerToTerminate) return

  if (workerInstance === workerToTerminate) {
    workerInstance.terminate()
    workerInstance = null
    isInitialized = false
  } else {
    workerToTerminate.terminate()
  }

  for (const [reqId, pending] of Array.from(pendingRequests.entries())) {
    if (pending.worker === workerToTerminate && reqId !== excludeRequestId) {
      pending.cleanupAndResolve({
        success: false,
        vars: {},
        error: reason ?? 'Die Python-Ausführung wurde abgebrochen, da der Worker neu gestartet wurde.',
        seed: pending.seed,
      })
    }
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
    let settled = false

    const cleanupAndResolve = (response: ArbeitsblattExecutionResponse) => {
      if (settled) return
      settled = true
      pendingRequests.delete(id)
      window.clearTimeout(timer)
      worker.removeEventListener('message', handleMessage)
      worker.removeEventListener('error', handleError)
      resolve(response)
    }

    const timer = window.setTimeout(() => {
      const timeoutError = `Zeitüberschreitung: Die Python-Ausführung wurde nach ${timeoutMs / 1000} Sekunden abgebrochen (mögliche Endlosschleife).`
      cleanupAndResolve({
        success: false,
        vars: {},
        error: timeoutError,
        seed: payload.random_seed,
      })
      terminateWorker(
        worker,
        'Vorherige Python-Ausführung wegen Zeitüberschreitung abgebrochen. Bitte erneut ausführen.',
        id
      )
    }, timeoutMs)

    const handleMessage = (event: MessageEvent<WorkerExecuteResponse>) => {
      if (event.data?.id !== id) return
      isInitialized = true

      cleanupAndResolve({
        success: !event.data.error,
        vars: event.data.vars ?? {},
        error: event.data.error ?? undefined,
        seed: event.data.seed ?? payload.random_seed,
      })
    }

    const handleError = (err: ErrorEvent) => {
      const errorMessage = err.message || 'Unbekannter Fehler im Pyodide-Web-Worker.'
      cleanupAndResolve({
        success: false,
        vars: {},
        error: errorMessage,
        seed: payload.random_seed,
      })
      terminateWorker(worker, errorMessage, id)
    }

    pendingRequests.set(id, {
      id,
      worker,
      timer,
      seed: payload.random_seed,
      cleanupAndResolve,
    })

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
