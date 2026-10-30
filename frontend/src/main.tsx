// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App'
import { ThemeProvider } from './context/ThemeContext'
import { DebugProvider } from './context/DebugContext'
import { AiProvider } from './context/AiContext'
import { UpdateProvider } from './context/UpdateContext'
import { REPO_URL } from './pages/versions'

const queryClient = new QueryClient()

// Copyright & GNU AGPL Disclaimer
console.log(
  '%c Generator-Suite v4.1.0 %c GNU AGPLv3 (AGPL-3.0-or-later) \n' +
  'Copyright (C) 2026 C. Meyer\n\n' +
  'This program is free software: you can redistribute it and/or modify\n' +
  'it under the terms of the GNU Affero General Public License as published by\n' +
  'the Free Software Foundation, either version 3 of the License, or\n' +
  '(at your option) any later version.\n\n' +
  'This program is distributed in the hope that it will be useful,\n' +
  'but WITHOUT ANY WARRANTY; without even the implied warranty of\n' +
  'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the\n' +
  'GNU Affero General Public License for more details.\n\n' +
  '' + 'Source Code: ' + REPO_URL + '\n' +
  'Educational Materials: Built-in presets are subject to non-commercial terms.',
  'background: #f0a030; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
  'background: #2563eb; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;'
)

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    <ThemeProvider>
      <DebugProvider>
        <AiProvider>
          <UpdateProvider>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </QueryClientProvider>
          </UpdateProvider>
        </AiProvider>
      </DebugProvider>
    </ThemeProvider>
  )
}
