// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { Cpu, ShieldCheck, HeartHandshake, Code2, ExternalLink } from 'lucide-react'
import { APP_VERSION, REPO_URL } from '../../versions'

export function SystemInfoSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-line">
      {/* System & Version */}
      <section className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Cpu size={14} className="text-primary" />
          <h2 className="text-caption font-semibold">
            System & Version
          </h2>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-5 flex flex-col gap-3.5 flex-1 shadow-xs">
          <div className="flex items-center justify-between text-sm pb-3 border-b border-line">
            <span className="text-muted">Generator-Suite</span>
            <span className="font-mono font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20 text-xs">
              v{APP_VERSION}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm pb-3 border-b border-line">
            <span className="text-muted">Rendering-Engine</span>
            <span className="font-medium text-ink text-xs">XeLaTeX / TikZ & PGFPlots</span>
          </div>
          <div className="flex items-center justify-between text-sm pb-3 border-b border-line">
            <span className="text-muted">Frontend & UI</span>
            <span className="font-medium text-ink text-xs">React 19 • Tailwind CSS 4</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Laufzeit</span>
            <span className="text-muted text-xs text-right">Docker / Lokaler Dienst</span>
          </div>
        </div>
      </section>

      {/* Lizenz & Quellcode */}
      <section className="lg:col-span-8 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-primary" />
          <h2 className="text-caption font-semibold">
            Lizenz & Quellcode (GNU AGPLv3)
          </h2>
        </div>
        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 flex flex-col gap-4 flex-1 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <div className="font-semibold text-ink text-sm">GNU Affero General Public License v3.0</div>
              <div className="text-xs text-muted mt-0.5">Copyright © 2026 C. Meyer • Freie und Open-Source-Software</div>
            </div>
            <span className="self-start sm:self-center font-mono text-[11px] font-semibold px-2.5 py-1 rounded bg-primary/15 text-primary border border-primary/25">
              AGPL-3.0-or-later
            </span>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            Dieses Programm ist freie Software: Sie können es unter den Bedingungen der <strong>GNU Affero General Public License (AGPLv3 oder neuer)</strong> weitergeben und/oder modifizieren.
            Gemäß § 13 der GNU AGPL haben alle Nutzer, die über ein Netzwerk mit dieser Anwendung interagieren, das Recht auf freien Zugriff auf den vollständigen Quellcode.
          </p>

          <div className="bg-raised/70 rounded-xl p-3.5 border border-rim flex items-start gap-2.5 text-xs text-muted">
            <HeartHandshake size={16} className="text-primary shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Unterrichtsmaterialien:</strong> Alle mit dieser Suite erstellten Diagramme, Grafiken und Arbeitsblätter dürfen frei für schulische und unterrichtliche Zwecke genutzt werden. Materialien, die auf Basis der mitgelieferten Vorlagen (Presets) erstellt werden, dürfen <strong>nicht kommerziell vertrieben</strong> werden.
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1 mt-auto">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary text-white hover:opacity-90 font-medium text-xs shadow-xs transition-opacity"
            >
              <Code2 size={14} />
              <span>Quellcode auf GitHub (AGPLv3)</span>
              <ExternalLink size={12} className="opacity-70" />
            </a>
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-raised border border-rim text-ink hover:bg-overlay font-medium text-xs transition-colors"
            >
              <span>GNU AGPL Lizenztext</span>
              <ExternalLink size={12} className="text-muted" />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
