// SPDX-License-Identifier: AGPL-3.0-or-later

import { loadPyodide, type PyodideInterface } from 'pyodide'

let pyodidePromise: Promise<PyodideInterface> | null = null

function getPyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: '/pyodide/',
    })
  }
  return pyodidePromise
}

const PYTHON_RUNNER_SCRIPT = `
import json
import random
import traceback

def _run_worksheet_code(code_str, seed_val):
    previous_state = random.getstate()
    try:
        if seed_val is not None and seed_val != "":
            random.seed(seed_val)
        namespace = {}
        exec(code_str, namespace)
        clean_vars = {}
        for k, v in namespace.items():
            if k == "__builtins__" or str(k).startswith("_"):
                continue
            if isinstance(v, (str, int, float, bool, list, dict, type(None))):
                try:
                    # Verify full JSON serializability of nested lists/dicts
                    json.dumps(v)
                    clean_vars[k] = v
                except (TypeError, OverflowError):
                    pass
        return json.dumps({"vars": clean_vars, "error": None, "seed": seed_val})
    except Exception:
        return json.dumps({"vars": {}, "error": traceback.format_exc(), "seed": seed_val})
    finally:
        random.setstate(previous_state)
`

export interface WorkerExecuteRequest {
  id: number
  python_code: string
  random_seed?: string | number | null
}

export interface WorkerExecuteResponse {
  id: number
  vars: Record<string, unknown>
  error: string | null
  seed?: string | number | null
}

self.onmessage = async (event: MessageEvent<WorkerExecuteRequest>) => {
  const { id, python_code, random_seed } = event.data
  try {
    const pyodide = await getPyodide()
    await pyodide.runPythonAsync(PYTHON_RUNNER_SCRIPT)
    const runFn = pyodide.globals.get('_run_worksheet_code')
    const rawJson: string = runFn(python_code ?? '', random_seed ?? null)
    runFn.destroy?.()
    const parsed = JSON.parse(rawJson) as {
      vars: Record<string, unknown>
      error: string | null
      seed?: string | number | null
    }
    const response: WorkerExecuteResponse = {
      id,
      vars: parsed.vars ?? {},
      error: parsed.error ?? null,
      seed: parsed.seed ?? random_seed,
    }
    self.postMessage(response)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    const response: WorkerExecuteResponse = {
      id,
      vars: {},
      error: `Pyodide-Ausführungsfehler: ${message}`,
      seed: random_seed,
    }
    self.postMessage(response)
  }
}
