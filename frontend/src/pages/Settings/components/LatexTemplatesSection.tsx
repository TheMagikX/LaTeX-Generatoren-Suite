// SPDX-License-Identifier: AGPL-3.0-or-later

import { FileCode } from 'lucide-react'
import { useLatexSettings } from './latex/useLatexSettings'
import { LatexSingleFileCard } from './latex/LatexSingleFileCard'
import { LatexMultiFileCard } from './latex/LatexMultiFileCard'

export function LatexTemplatesSection() {
  const { commands, packages, additionals, customSty } = useLatexSettings()

  return (
    <section className="pt-4 border-t border-line">
      <div className="flex items-center gap-2 mb-3.5">
        <FileCode size={14} className="text-primary" />
        <h2 className="text-caption font-semibold">
          LaTeX-Standard-Inputs & Vorlagen
        </h2>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          Git-Schutz
        </span>
      </div>

      <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink text-sm">Persönliche Inputs & Pakete einbinden</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Binde deine persönlichen Inputs ein, die standardmäßig im Compiler geladen werden. Alle Pfade werden lokal in der unversionierten <code className="font-mono text-muted bg-raised px-1 py-0.5 rounded">user_settings.json</code> gespeichert und gelangen niemals in Git-Commits.
          </p>
        </div>

        {/* 1. Haupt-Makros: commands.tex */}
        <LatexSingleFileCard
          title="Standard: Befehle & Makros (commands.tex)"
          description="Persönliche mathematische Operatoren und Umgebungen. Ohne Angabe greift das neutrale Dummy-Fallback."
          activeCustomBadgeText="Eigene commands.tex aktiv"
          defaultBadgeText="Standard-Dummy aktiv"
          placeholder="C:/Pfad/zu/deiner/commands.tex oder leer lassen für Dummy"
          uploadButtonTooltip="Wähle eine commands.tex von deinem Computer aus und lade sie in die Suite hoch"
          browseButtonTooltip="Öffnet den Windows Explorer zur Dateiauswahl (nur lokaler Windows Desktop)"
          resetButtonTooltip="Zurücksetzen auf Standard commands-default.tex"
          fallbackStatusText="Nicht gefunden (Dummy aktiv)"
          sectionKey="commands"
          status={commands.status}
          inputPath={commands.inputPath}
          setInputPath={commands.setInputPath}
          isBrowsing={commands.isBrowsing}
          isSaving={commands.isSaving}
          isUploading={commands.isUploading}
          onSave={commands.onSave}
          onBrowse={commands.onBrowse}
          onReset={commands.onReset}
          onUpload={commands.onUpload}
          feedback={commands.feedback}
        />

        {/* 2. Pakete: Pakete.tex */}
        <LatexSingleFileCard
          title="Standard: LaTeX-Pakete & Bibliotheken (Pakete.tex)"
          description="Globale LaTeX-Pakete (z. B. amsmath, tikz, pgfplots). Ohne Angabe greift Pakete-default.tex."
          activeCustomBadgeText="Eigene Pakete.tex aktiv"
          defaultBadgeText="Standard (Pakete-default.tex)"
          placeholder="C:/Pfad/zu/deiner/Pakete.tex oder leer lassen für Standard"
          uploadButtonTooltip="Wähle eine Pakete.tex von deinem Computer aus und lade sie in die Suite hoch"
          browseButtonTooltip="Öffnet den Windows Explorer zur Dateiauswahl (nur lokaler Windows Desktop)"
          resetButtonTooltip="Zurücksetzen auf Standard Pakete-default.tex"
          fallbackStatusText="Nicht gefunden (Fallback aktiv)"
          sectionKey="packages"
          status={packages.status}
          inputPath={packages.inputPath}
          setInputPath={packages.setInputPath}
          isBrowsing={packages.isBrowsing}
          isSaving={packages.isSaving}
          isUploading={packages.isUploading}
          onSave={packages.onSave}
          onBrowse={packages.onBrowse}
          onReset={packages.onReset}
          onUpload={packages.onUpload}
          feedback={packages.feedback}
        />

        {/* 3. Optionale eigene Pakete (.sty) */}
        <LatexMultiFileCard
          title="Optional: Eigene Pakete (.sty-Dateien)"
          description="Lade eigene LaTeX-Pakete (z. B. mygeodreieck.sty). Diese werden direkt nach Pakete.tex im Compiler eingebunden."
          uploadButtonText="Paket hochladen (.sty)"
          uploadButtonTooltip="Paketdatei (.sty) vom Computer hochladen"
          addRowButtonText="Pfad hinzufügen"
          suggestionsLabel="Gefundene lokale Pakete:"
          emptyStateText="Keine eigenen .sty-Pakete eingebunden. Klicke auf „Paket (.sty) hinzufügen“, um z. B. eine lokale mygeodreieck.sty einzubinden."
          placeholder="C:/Pfad/zu/deinem/paket.sty"
          browseButtonTooltip="Paket-Datei (.sty) im Windows Explorer auswählen"
          countSuffix=".sty-Paket(e) konfiguriert"
          saveButtonText="Pakete speichern"
          sectionKey="sty"
          inputs={customSty.inputs}
          setInputs={customSty.setInputs}
          status={customSty.status}
          suggested={customSty.suggested}
          browsingIndex={customSty.browsingIndex}
          isSaving={customSty.isSaving}
          isUploading={customSty.isUploading}
          onAddRow={customSty.onAddRow}
          onRemoveRow={customSty.onRemoveRow}
          onBrowse={customSty.onBrowse}
          onSave={customSty.onSave}
          onUpload={customSty.onUpload}
          feedback={customSty.feedback}
        />

        {/* 4. Optionale weitere .tex Inputs */}
        <LatexMultiFileCard
          title="Optional: Weitere .tex-Inputs"
          description="Zusätzliche Dateien, die standardmäßig im Compiler eingebunden werden (z. B. columntypes.tex, colorboxen.tex, TikZ.tex)."
          uploadButtonText="Datei hochladen (.tex)"
          uploadButtonTooltip="Zusätzliche .tex-Datei vom Computer hochladen"
          addRowButtonText="Pfad hinzufügen"
          suggestionsLabel="Gefundene Projektdateien:"
          emptyStateText="Keine zusätzlichen .tex-Inputs konfiguriert. Klicke auf „Input hinzufügen“, um eine weitere Datei einzubinden."
          placeholder="C:/Pfad/zu/deiner/datei.tex"
          browseButtonTooltip="Datei im Windows Explorer auswählen"
          countSuffix="zusätzliche Datei(en) konfiguriert"
          saveButtonText="Inputs speichern"
          sectionKey="additionals"
          inputs={additionals.inputs}
          setInputs={additionals.setInputs}
          status={additionals.status}
          suggested={additionals.suggested}
          browsingIndex={additionals.browsingIndex}
          isSaving={additionals.isSaving}
          isUploading={additionals.isUploading}
          onAddRow={additionals.onAddRow}
          onRemoveRow={additionals.onRemoveRow}
          onBrowse={additionals.onBrowse}
          onSave={additionals.onSave}
          onUpload={additionals.onUpload}
          feedback={additionals.feedback}
        />
      </div>
    </section>
  )
}
