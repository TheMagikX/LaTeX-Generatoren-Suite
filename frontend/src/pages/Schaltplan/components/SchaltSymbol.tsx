// SPDX-License-Identifier: AGPL-3.0-or-later

import React from 'react'

interface SchaltSymbolProps {
  typeName: string
  mid: { x: number; y: number }
  angle: number
  stroke: string
  label?: string
  value?: string
}

export const SchaltSymbol: React.FC<SchaltSymbolProps> = ({
  typeName,
  mid,
  angle,
  stroke,
  label,
  value,
}) => {
  const displayLabel = [label, value].filter(Boolean).join(' ')

  const renderSymbolDetails = () => {
    switch (typeName) {
      case 'Voltmeter':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <g transform={`rotate(${-angle})`}>
              <text textAnchor="middle" dominantBaseline="central" fill="rgb(241,245,249)" fontSize="13" fontWeight="bold">
                V
              </text>
            </g>
          </g>
        )

      case 'Amperemeter':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <g transform={`rotate(${-angle})`}>
              <text textAnchor="middle" dominantBaseline="central" fill="rgb(241,245,249)" fontSize="13" fontWeight="bold">
                A
              </text>
            </g>
          </g>
        )

      case 'Messgerät':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <g transform={`rotate(${-angle})`}>
              <text textAnchor="middle" dominantBaseline="central" fill="rgb(241,245,249)" fontSize="13" fontWeight="bold">
                M
              </text>
            </g>
          </g>
        )

      case 'Lampe':
        return (
          <g>
            <circle cx="0" cy="0" r="13" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <line x1="-7" y1="-7" x2="7" y2="7" stroke={stroke} strokeWidth="2" />
            <line x1="-7" y1="7" x2="7" y2="-7" stroke={stroke} strokeWidth="2" />
          </g>
        )

      case 'Widerstand (R)':
        return (
          <g>
            <rect x="-18" y="-8" width="36" height="16" rx="2" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
          </g>
        )

      case 'Widerstand (Veränderbar)':
        return (
          <g>
            <rect x="-18" y="-8" width="36" height="16" rx="2" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <line x1="-14" y1="12" x2="14" y2="-12" stroke={stroke} strokeWidth="2" />
            <polygon points="10,-14 15,-10 13,-6" fill={stroke} />
          </g>
        )

      case 'Kondensator (C)':
        return (
          <g>
            <rect x="-10" y="-14" width="20" height="28" fill="rgb(15,23,42)" />
            <line x1="-4" y1="-12" x2="-4" y2="12" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="-12" x2="4" y2="12" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )

      case 'Elko':
        return (
          <g>
            <rect x="-12" y="-14" width="24" height="28" fill="rgb(15,23,42)" />
            <line x1="-5" y1="-12" x2="-5" y2="12" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 5 -12 Q 1 0 5 12" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <g transform={`rotate(${-angle})`}>
              <text x="-11" y="-8" fill="rgb(241,245,249)" fontSize="10" fontWeight="bold">
                +
              </text>
            </g>
          </g>
        )

      case 'Spule (L)':
        return (
          <g>
            <rect x="-20" y="-10" width="40" height="20" fill="rgb(15,23,42)" />
            <path
              d="M -18 0 Q -13.5 -13 -9 0 Q -4.5 -13 0 0 Q 4.5 -13 9 0 Q 13.5 -13 18 0"
              fill="none"
              stroke={stroke}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )

      case 'Batterie':
        return (
          <g>
            <rect x="-14" y="-14" width="28" height="28" fill="rgb(15,23,42)" />
            <line x1="-4" y1="-13" x2="-4" y2="13" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="4" y1="-7" x2="4" y2="7" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
            <g transform={`rotate(${-angle})`}>
              <text x="-12" y="-9" fill="rgb(241,245,249)" fontSize="10" fontWeight="bold">
                +
              </text>
            </g>
          </g>
        )

      case 'Spannungsquelle (DC)':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <g transform={`rotate(${-angle})`}>
              <line x1="-7" y1="0" x2="-3" y2="0" stroke={stroke} strokeWidth="2" />
              <line x1="-5" y1="-2" x2="-5" y2="2" stroke={stroke} strokeWidth="2" />
              <line x1="3" y1="0" x2="7" y2="0" stroke={stroke} strokeWidth="2" />
            </g>
          </g>
        )

      case 'Spannungsquelle (AC)':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <path d="M -7 0 Q -3.5 -7 0 0 Q 3.5 7 7 0" fill="none" stroke={stroke} strokeWidth="2" />
          </g>
        )

      case 'Stromquelle':
        return (
          <g>
            <circle cx="0" cy="0" r="14" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <line x1="-7" y1="0" x2="7" y2="0" stroke={stroke} strokeWidth="2" />
            <polygon points="3,-4 9,0 3,4" fill={stroke} />
          </g>
        )

      case 'Diode':
        return (
          <g>
            <rect x="-14" y="-12" width="28" height="24" fill="rgb(15,23,42)" />
            <polygon points="-7,-10 -7,10 6,0" fill={stroke} stroke={stroke} strokeWidth="1" />
            <line x1="6" y1="-10" x2="6" y2="10" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )

      case 'LED':
        return (
          <g>
            <rect x="-14" y="-12" width="28" height="24" fill="rgb(15,23,42)" />
            <polygon points="-7,-10 -7,10 6,0" fill={stroke} stroke={stroke} strokeWidth="1" />
            <line x1="6" y1="-10" x2="6" y2="10" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M -2 -11 L 3 -16 M 3 -12 L 8 -17" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="1,-16 4,-16 3,-13" fill={stroke} />
            <polygon points="6,-17 9,-17 8,-14" fill={stroke} />
          </g>
        )

      case 'Schalter (Offen)':
        return (
          <g>
            <rect x="-16" y="-12" width="32" height="24" fill="rgb(15,23,42)" />
            <circle cx="-10" cy="0" r="3" fill={stroke} />
            <circle cx="10" cy="0" r="3" fill={stroke} />
            <line x1="-10" y1="0" x2="9" y2="-9" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )

      case 'Schalter (Geschlossen)':
        return (
          <g>
            <rect x="-16" y="-10" width="32" height="20" fill="rgb(15,23,42)" />
            <circle cx="-10" cy="0" r="3" fill={stroke} />
            <circle cx="10" cy="0" r="3" fill={stroke} />
            <line x1="-10" y1="0" x2="10" y2="0" stroke={stroke} strokeWidth="2.5" />
          </g>
        )

      case 'Schalter (Taster)':
        return (
          <g>
            <rect x="-16" y="-16" width="32" height="26" fill="rgb(15,23,42)" />
            <circle cx="-9" cy="0" r="3" fill={stroke} />
            <circle cx="9" cy="0" r="3" fill={stroke} />
            <line x1="-11" y1="-6" x2="11" y2="-6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
            <line x1="0" y1="-6" x2="0" y2="-13" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          </g>
        )

      default:
        return (
          <g>
            <rect x="-22" y="-10" width="44" height="20" rx="4" fill="rgb(15,23,42)" stroke={stroke} strokeWidth="2" />
            <g transform={`rotate(${-angle})`}>
              <text textAnchor="middle" dominantBaseline="central" fill="rgb(241,245,249)" fontSize="9" fontWeight="semibold">
                {typeName.slice(0, 6)}
              </text>
            </g>
          </g>
        )
    }
  }

  return (
    <g transform={`translate(${mid.x}, ${mid.y})`}>
      <g transform={`rotate(${angle})`}>
        {renderSymbolDetails()}
      </g>
      {displayLabel && (
        <g transform={`translate(0, -20)`}>
          <rect
            x={-displayLabel.length * 3.5 - 6}
            y="-9"
            width={displayLabel.length * 7 + 12}
            height="16"
            rx="4"
            fill="rgb(15,23,42)"
            fillOpacity="0.85"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="1"
          />
          <text textAnchor="middle" dominantBaseline="central" className="fill-slate-200 text-[11px] font-semibold">
            {displayLabel}
          </text>
        </g>
      )}
    </g>
  )
}
