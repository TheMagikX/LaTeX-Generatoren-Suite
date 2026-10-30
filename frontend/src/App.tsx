// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import { useEffect, useState } from 'react'
import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import {
  LineChart, Box, GitGraph, RotateCw, Triangle, Glasses, Wrench, Zap,
  FileText, Code, Code2, Ruler, PieChart, ChevronLeft, ChevronRight, Users,
  Flashlight, Layers, BarChart2, Settings, Sigma, Atom, Hammer, Wand2,
  QrCode, Home as HomeIcon, ListChecks,
} from 'lucide-react'
import Koordinatensystem    from './pages/Koordinatensystem'
import Koordinatensystem3D  from './pages/Koordinatensystem3D'
import Baumdiagramm         from './pages/Baumdiagramm'
import Glucksrad            from './pages/Glucksrad'
import Geometrie            from './pages/Geometrie'
import Zahlenstrahl         from './pages/Zahlenstrahl'
import Bruch                from './pages/Bruch'
import Optik                from './pages/Optik'
import Flaschenzug          from './pages/Flaschenzug'
import Schaltplan           from './pages/Schaltplan'
import Sitzplan             from './pages/Sitzplan'
import Arbeitsblatt         from './pages/Arbeitsblatt'
import Erwartungshorizont   from './pages/Erwartungshorizont'
import LatexImage           from './pages/LatexImage'
import TikzPicture          from './pages/TikzPicture'
import Strahlenoptik        from './pages/Strahlenoptik'
import Stellenwerttafel     from './pages/Stellenwerttafel'
import Statistik            from './pages/Statistik'
import QRCode               from './pages/QRCode'
import SettingsPage         from './pages/Settings'
import { UpdateBanner }        from './components/UpdateBanner'
import { FloatingDebugBadge } from './components/FloatingDebugBadge'
import { APP_VERSION, REPO_URL } from './pages/versions'

/* ─── Navigation definition ─────────────────────────────────────────────────── */

type NavItem = {
  to: string
  icon: React.ElementType
  label: string
  description?: string
}
type NavGroup = { id: string; label: string; icon: React.ElementType; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    id: 'math', label: 'Mathematik', icon: Sigma,
    items: [
      {
        to: '/koordinatensystem',
        icon: LineChart,
        label: '2D Koordinatensystem',
        description: 'Erstellung von Koordinatensystemen mit Funktionsgraphen und Weiterem'
      },
      {
        to: '/koordinatensystem3d',
        icon: Box,
        label: '3D Koordinatensystem',
        description: 'Erstellung von 3D-Koordinatensystemen mit Punkten, Vektoren und Ebenen'
      },
      {
        to: '/baumdiagramm',
        icon: GitGraph,
        label: 'Baumdiagramm',
        description: 'Erstellung von mehrstufigen Baumdiagrammen'
      },
      {
        to: '/glucksrad',
        icon: RotateCw,
        label: 'Glücksrad',
        description: 'Erstellung von anpassbaren Glücksrädern mit Sektoren'
      },
      {
        to: '/bruch',
        icon: PieChart,
        label: 'Bruch-Visualisierer',
        description: 'Visualisierung von Brüchen als Kreis, Rechteck oder Balken'
      },
      {
        to: '/statistik',
        icon: BarChart2,
        label: 'Statistik',
        description: 'Erstellung von Boxplots, Histogrammen und Diagrammen'
      },
      {
        to: '/zahlenstrahl',
        icon: Ruler,
        label: 'Zahlenstrahl',
        description: 'Erstellung von Zahlenstrahlen mit Intervallen und Markierungen'
      },
      {
        to: '/stellenwerttafel',
        icon: Layers,
        label: 'Stellenwerttafel',
        description: 'Erstellung von Stellenwerttafeln für verschiedene Zahlensysteme'
      },
    ],
  },
  {
    id: 'geo', label: 'Geometrie', icon: Triangle,
    items: [
      {
        to: '/geometrie',
        icon: Triangle,
        label: 'Geometrie',
        description: 'Erstellung und Konstruktion von geometrischen Figuren und Winkeln'
      },
    ],
  },
  {
    id: 'physics', label: 'Physik', icon: Atom,
    items: [
      {
        to: '/optik',
        icon: Glasses,
        label: 'Optik',
        description: 'Erstellung von optischen Systemen mit Linsen und Spiegeln'
      },
      {
        to: '/strahlenoptik',
        icon: Flashlight,
        label: 'Strahlenoptik',
        description: 'Konstruktion von Lichtstrahlen, Brechung und optischen Geräten'
      },
      {
        to: '/flaschenzug',
        icon: Wrench,
        label: 'Flaschenzug',
        description: 'Erstellung von Flaschenzügen mit Rollen und Seilen'
      },
      {
        to: '/schaltplan',
        icon: Zap,
        label: 'Schaltplan',
        description: 'Erstellung von elektrischen Schaltplänen und Stromkreisen'
      },
    ],
  },
  {
    id: 'tools', label: 'Werkzeuge', icon: Hammer,
    items: [
      {
        to: '/sitzplan',
        icon: Users,
        label: 'Sitzplan',
        description: 'Erstellung von Sitzplänen und optimierten Sitzordnungen'
      },
      {
        to: '/arbeitsblatt',
        icon: FileText,
        label: 'Arbeitsblatt',
        description: 'Generierung von mathematischen Aufgabenblättern mit Lösungen'
      },
      {
        to: '/qrcode',
        icon: QrCode,
        label: 'QR-Code',
        description: 'Erstellung von QR-Codes für Links und Texte'
      },
      {
        to: '/erwartungshorizont',
        icon: ListChecks,
        label: 'Erwartungshorizont',
        description: 'Erstellung von Teilaufgaben & Word-Export (Musterlösung)'
      },
      {
        to: '/lateximage',
        icon: Code,
        label: 'LaTeX Bild',
        description: 'Kompilierung von LaTeX-Code zu hochauflösenden Bildern'
      },
      {
        to: '/tikzpicture',
        icon: Wand2,
        label: 'TikZ Bild',
        description: 'Erstellung und Kompilierung von individuellen TikZ-Grafiken'
      },
    ],
  },
]

const PAGE_TITLES = new Map<string, string>([
  ['/', 'Startseite'],
  ...NAV_GROUPS.flatMap(group => group.items.map(item => [item.to, item.label] as [string, string])),
])

const DocumentTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const pageTitle = PAGE_TITLES.get(pathname)
      ?? (pathname === '/settings' ? 'Einstellungen' : null)

    document.title = pageTitle ? `${pageTitle} | Generatoren` : 'Generatoren'
  }, [pathname])

  return null
}

/* ─── Logo mark ─────────────────────────────────────────────────────────────── */

const LogoMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12h18M12 3v18M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" opacity="0.6" />
  </svg>
)

/* ─── Sidebar ────────────────────────────────────────────────────────────────── */

const Sidebar = ({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) => (
  <aside
    className={`${collapsed ? 'w-[68px]' : 'w-60'} bg-panel border-r border-line h-full flex flex-col transition-[width] duration-300 relative z-50`}
  >
    {/* Logo */}
    <div className={`flex items-center ${collapsed ? 'justify-center px-0 py-5' : 'gap-3 px-5 py-5'} border-b border-line relative`}>
      <Link to="/" className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity">
        <div className="text-primary shrink-0">
          <LogoMark size={collapsed ? 26 : 22} />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-lg text-ink tracking-tight truncate pb-0.5">
              Generatoren
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
              v{APP_VERSION}
            </span>
          </div>
        )}
      </Link>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-raised border border-rim flex items-center justify-center text-muted hover:text-ink hover:bg-overlay transition-all shadow-md z-10"
        title={collapsed ? 'Erweitern' : 'Einklappen'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>

    {/* Navigation */}
    <nav className="flex-1 overflow-y-auto custom-scrollbar py-3">
      {/* Home / Startseite */}
      <div className="px-2 mb-2">
        <NavLink
          to="/"
          end
          title={collapsed ? 'Startseite' : undefined}
          className={({ isActive }) =>
            `flex items-center ${collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-150 border text-sm font-medium ${
              isActive
                ? 'bg-primary/12 text-primary border-primary/25 shadow-sm'
                : 'text-muted hover:text-ink hover:bg-raised border-transparent'
            } ${collapsed ? 'px-0 w-full' : ''}`
          }
        >
          <HomeIcon size={18} className="shrink-0" />
          {!collapsed && <span className="truncate">Startseite</span>}
        </NavLink>
      </div>
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.id} className={gi > 0 ? 'mt-1' : ''}>
          {/* Group header */}
          {!collapsed ? (
            <div className="flex items-center gap-1.5 px-4 pt-4 pb-1.5">
              <group.icon size={10} className="text-ghost shrink-0" />
              <span className="text-caption">
                {group.label}
              </span>
            </div>
          ) : (
            gi > 0 && <div className="mx-4 my-2.5 h-px bg-line" />
          )}

          {/* Items */}
          <div className={`flex flex-col gap-0.5 ${collapsed ? 'px-2' : 'px-2'}`}>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center ${collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-150 border text-sm font-medium ${
                    isActive
                      ? 'bg-primary/12 text-primary border-primary/25 shadow-sm'
                      : 'text-muted hover:text-ink hover:bg-raised border-transparent'
                  } ${collapsed ? 'px-0 w-full' : ''}`
                }
              >
                <item.icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>

    {/* Footer */}
    <div className={`border-t border-line flex flex-col gap-1 ${collapsed ? 'px-2 py-3' : 'px-2 py-3'}`}>
      <NavLink
        to="/settings"
        title={collapsed ? 'Einstellungen' : undefined}
        className={({ isActive }) =>
          `flex items-center ${collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-150 border text-sm font-medium ${
            isActive
              ? 'bg-primary/12 text-primary border-primary/25'
              : 'text-ghost hover:text-muted hover:bg-raised border-transparent'
          }`
        }
      >
        <Settings size={18} className="shrink-0" />
        {!collapsed && <span>Einstellungen</span>}
      </NavLink>

      <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={collapsed ? 'Quellcode (GNU AGPLv3)' : undefined}
        className={`flex items-center ${collapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'} rounded-xl transition-all duration-150 border text-sm font-medium text-ghost hover:text-primary hover:bg-raised border-transparent`}
      >
        <Code2 size={18} className="shrink-0" />
        {!collapsed && <span className="text-xs truncate">Quellcode (AGPLv3)</span>}
      </a>
    </div>
  </aside>
)

/* ─── Home page ──────────────────────────────────────────────────────────────── */

const Home = () => (
  <div className="w-full max-w-7xl mx-auto">
    {/* Hero */}
    <div className="mb-10 pt-2">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="text-primary opacity-80 shrink-0">
          <LogoMark size={42} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight pb-0.5">
              Generatoren
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
              v{APP_VERSION}
            </span>
          </div>
          <p className="text-muted text-sm mt-1">
            LaTeX-Diagramme für Mathematik, Physik und den Schulalltag
          </p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-primary/40 via-line to-transparent" />
    </div>

    {/* Generator groups */}
    {NAV_GROUPS.map(group => (
      <div key={group.id} className="mb-10">
        <div className="flex items-center gap-2 mb-3.5">
          <group.icon size={14} className="text-primary" />
          <h2 className="text-caption font-semibold">
            {group.label}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {group.items.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className="group bg-panel border border-line hover:border-primary/40 hover:bg-raised/70 rounded-2xl p-4.5 transition-all duration-200 flex flex-col gap-2.5 shadow-xs hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 group-hover:scale-105 transition-all shrink-0">
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-semibold text-ink group-hover:text-primary transition-colors duration-200 leading-normal truncate pb-0.5">
                  {item.label}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-muted leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      </div>
    ))}

    {/* AGPL Footer */}
    <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
      <div>
        <span>Generator-Suite v{APP_VERSION} • Lizenziert unter </span>
        <a
          href="https://www.gnu.org/licenses/agpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium"
        >
          GNU AGPLv3+
        </a>
      </div>
      <div className="flex items-center gap-4">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-ink transition-colors flex items-center gap-1.5"
        >
          <Code2 size={14} />
          <span>Quellcode erhalten</span>
        </a>
        <Link to="/settings" className="hover:text-ink transition-colors">
          Einstellungen & Lizenz
        </Link>
      </div>
    </div>
  </div>
)

/* ─── App ────────────────────────────────────────────────────────────────────── */

function App() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-canvas text-ink font-body overflow-hidden">
      <DocumentTitle />
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main
        className="flex-1 h-full overflow-hidden flex flex-col min-w-0"
      >
        <UpdateBanner />
        <div className="p-8 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"                   element={<Home />}             />
            <Route path="/koordinatensystem"   element={<Koordinatensystem />} />
            <Route path="/koordinatensystem3d" element={<Koordinatensystem3D />} />
            <Route path="/baumdiagramm"        element={<Baumdiagramm />}    />
            <Route path="/glucksrad"           element={<Glucksrad />}       />
            <Route path="/geometrie"           element={<Geometrie />}       />
            <Route path="/bruch"               element={<Bruch />}           />
            <Route path="/statistik"           element={<Statistik />}       />
            <Route path="/stellenwerttafel"    element={<Stellenwerttafel />} />
            <Route path="/zahlenstrahl"        element={<Zahlenstrahl />}    />
            <Route path="/optik"               element={<Optik />}           />
            <Route path="/flaschenzug"         element={<Flaschenzug />}     />
            <Route path="/schaltplan"          element={<Schaltplan />}      />
            <Route path="/sitzplan"            element={<Sitzplan />}        />
            <Route path="/arbeitsblatt"        element={<Arbeitsblatt />}    />
            <Route path="/qrcode"              element={<QRCode />}          />
            <Route path="/erwartungshorizont"  element={<Erwartungshorizont />} />
            <Route path="/lateximage"          element={<LatexImage />}      />
            <Route path="/tikzpicture"         element={<TikzPicture />}     />
            <Route path="/strahlenoptik"       element={<Strahlenoptik />}   />
            <Route path="/settings"            element={<SettingsPage />}     />
          </Routes>
        </div>
      </main>
      <FloatingDebugBadge />
    </div>
  )
}

export default App
