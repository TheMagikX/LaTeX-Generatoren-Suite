// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  children: React.ReactNode
}

export const Tabs = ({ tabs, activeTab, onChange, children }: TabsProps) => {
  return (
    <div className="flex flex-col h-full min-w-0">
      <div className="flex border-b border-line overflow-x-auto shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-display font-semibold tracking-wide border-b-2 transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/8'
                : 'border-transparent text-muted hover:text-ink hover:bg-raised'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  )
}

export const TabContent = ({ id, activeTab, children }: { id: string, activeTab: string, children: React.ReactNode }) => {
  if (id !== activeTab) return null
  return <div className="animate-in fade-in duration-300">{children}</div>
}
