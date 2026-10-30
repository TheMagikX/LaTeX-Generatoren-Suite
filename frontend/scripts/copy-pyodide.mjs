// SPDX-License-Identifier: AGPL-3.0-or-later

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.resolve(__dirname, '../node_modules/pyodide')
const destDir = path.resolve(__dirname, '../public/pyodide')

const FILES_TO_COPY = [
  'pyodide-lock.json',
  'pyodide.asm.mjs',
  'pyodide.asm.wasm',
  'pyodide.js',
  'pyodide.mjs',
  'python_stdlib.zip',
]

if (!fs.existsSync(srcDir)) {
  console.warn('[copy-pyodide] node_modules/pyodide not found, skipping copy.')
  process.exit(0)
}

fs.mkdirSync(destDir, { recursive: true })

for (const file of FILES_TO_COPY) {
  const src = path.join(srcDir, file)
  const dest = path.join(destDir, file)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
  }
}

console.log(`[copy-pyodide] Copied Pyodide runtime assets to public/pyodide/`)
