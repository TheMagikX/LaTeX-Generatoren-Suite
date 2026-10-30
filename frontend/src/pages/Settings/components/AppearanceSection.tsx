// SPDX-License-Identifier: AGPL-3.0-or-later

import { Palette, Check } from 'lucide-react'
import { useTheme, type Theme } from '../../../context/useTheme'
import { THEMES } from '../constants/themes'
import { ThemePreview } from './ThemePreview'

interface AppearanceSectionProps {
  theme?: Theme
  onSelectTheme?: (theme: Theme) => void
}

export function AppearanceSection({
  theme: controlledTheme,
  onSelectTheme: controlledOnSelectTheme,
}: AppearanceSectionProps = {}) {
  const contextTheme = useTheme()
  const theme = controlledTheme ?? contextTheme.theme
  const setTheme = controlledOnSelectTheme ?? contextTheme.setTheme

  return (
    <section>
      <div className="flex items-center gap-2 mb-3.5">
        <Palette size={14} className="text-primary" />
        <h2 className="text-caption font-semibold">
          Erscheinungsbild
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {THEMES.map(t => {
          const active = theme === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`text-left rounded-2xl border p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                active
                  ? 'border-primary/60 bg-primary/10 ring-1 ring-primary/30'
                  : 'border-line bg-panel hover:border-primary/40 hover:bg-raised/70'
              }`}
            >
              <ThemePreview c={t.colors} />
              <div className="mt-3.5 flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-primary' : 'text-ink'}`}>
                    {t.label}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{t.desc}</p>
                </div>
                {active && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check size={12} strokeWidth={2.5} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
