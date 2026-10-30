// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { ShieldAlert, ArrowUpCircle, X, ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useUpdateCheck } from '../hooks/useUpdateCheck'

export function UpdateBanner() {
  const { updateResult, isDismissed, dismissBanner } = useUpdateCheck()
  const location = useLocation()

  if (!updateResult || !updateResult.has_update || isDismissed) {
    return null
  }

  const isSecurity = updateResult.is_security_update
  const isOnSettings = location.pathname === '/settings'

  return (
    <aside
      role="alert"
      className={`relative z-40 w-full px-4 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm border-b transition-colors shadow-xs ${
        isSecurity
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-950 dark:text-amber-200'
          : 'bg-primary/10 border-primary/20 text-ink'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isSecurity ? (
          <ShieldAlert className="shrink-0 text-amber-600 dark:text-amber-400" size={18} />
        ) : (
          <ArrowUpCircle className="shrink-0 text-primary" size={18} />
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
          <span className="font-semibold tracking-tight">
            {isSecurity ? 'Wichtiges Sicherheitsupdate verfügbar:' : 'Update verfügbar:'}
          </span>
          <span className="font-mono font-medium text-xs px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10">
            v{updateResult.latest_version}
          </span>
          <span className="hidden md:inline text-muted text-xs truncate max-w-md">
            {updateResult.release_name || 'Neue Version auf GitHub'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isOnSettings && (
          <Link
            to="/settings"
            className={`inline-flex items-center gap-1 font-medium text-xs px-2.5 py-1 rounded-lg transition-colors ${
              isSecurity
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border border-amber-500/30'
                : 'bg-primary/15 hover:bg-primary/25 text-primary border border-primary/25'
            }`}
          >
            <span>Details ansehen</span>
            <ChevronRight size={14} />
          </Link>
        )}

        <button
          onClick={dismissBanner}
          title="In dieser Sitzung ausblenden"
          aria-label="In dieser Sitzung ausblenden"
          className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  )
}
