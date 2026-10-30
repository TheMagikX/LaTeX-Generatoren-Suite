// SPDX-License-Identifier: AGPL-3.0-or-later

import { CheckCircle2, AlertCircle } from 'lucide-react'
import type { LatexFeedbackMessage } from '../../types'

interface LatexFeedbackAlertProps {
  feedback: LatexFeedbackMessage | null
  section: LatexFeedbackMessage['section']
}

export function LatexFeedbackAlert({ feedback, section }: LatexFeedbackAlertProps) {
  if (!feedback || feedback.section !== section) return null

  return (
    <div
      className={`text-xs flex items-center gap-1.5 p-2 rounded-lg border animate-in fade-in duration-150 ${
        feedback.type === 'success'
          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
          : feedback.type === 'error'
          ? 'text-red-500 bg-red-500/10 border-red-500/20'
          : 'text-primary bg-primary/10 border-primary/20'
      }`}
    >
      {feedback.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      <span>{feedback.text}</span>
    </div>
  )
}
