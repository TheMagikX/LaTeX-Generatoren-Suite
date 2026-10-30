// SPDX-License-Identifier: AGPL-3.0-or-later

import { Hash, Layers, Settings2, Plus } from 'lucide-react'

export const getBruchTabs = () => [
  { id: 'bruch', label: '🔢 Bruch', icon: <Hash size={16} /> },
  { id: 'form', label: '🔷 Form', icon: <Layers size={16} /> },
  { id: 'erweitern', label: '✖️ Erweitern/Kürzen', icon: <Plus size={16} /> },
  { id: 'presets', label: '📂 Presets', icon: <Settings2 size={16} /> },
]
