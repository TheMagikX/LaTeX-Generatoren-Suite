// SPDX-License-Identifier: AGPL-3.0-or-later

import axios from 'axios'
import type { ArbeitsblattConfig } from '../pages/Arbeitsblatt/typesArbeitsblatt'
import { executeWorksheetCodeInPyodide } from '../pages/Arbeitsblatt/worker/pyodideClient'
import type { Config as BaumConfig } from '../pages/Baumdiagramm/typesBaum'
import type { BruchConfig } from '../pages/Bruch/typesBruch'
import type { FlaschenzugConfig } from '../pages/Flaschenzug/typesFlasche'
import type { Config as GeoConfig, GeoSolved } from '../pages/Geometrie/typesGeo'
import type { GluckConfig } from '../pages/Glucksrad/typesGluck'
import type { Config as KoordConfig } from '../pages/Koordinatensystem/typesKoord'
import type { Config3D } from '../pages/Koordinatensystem3D/typesKoord3D'
import type { LatexImageConfig } from '../pages/LatexImage/typesLatexImage'
import type { ErwartungshorizontConfig } from '../pages/Erwartungshorizont/typesErwartungshorizont'
import type { ImageMetric, OptikConfig } from '../pages/Optik/typesOptik'
import type { SchaltplanConfig } from '../pages/Schaltplan/typesSchalt'
import type { SitzplanRequest, SitzplanResponse } from '../pages/Sitzplan/typesSitz'
import type { StatistikConfig, StatistikResult } from '../pages/Statistik/typesStatistik'
import type { StellenwertConfig } from '../pages/Stellenwerttafel/typesStellenwert'
import type { StrahlenoptikConfig } from '../pages/Strahlenoptik/typesStrahlen'
import type { TikzConfig } from '../pages/TikzPicture/typesTikz'
import type { ZahlenstrahlConfig } from '../pages/Zahlenstrahl/typesZahlen'

import { emitGlobalTelemetry, getGlobalCompilerEngine, type CompilerEngine } from '../context/DebugContext'

const API_BASE_URL = '/api/'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Requested-With': 'GenSuite',
  },
})

export interface CompileResponse {
  ok: boolean
  engine?: CompilerEngine
  png_base64?: string
  pdf_base64?: string
  svg_base64?: string
  pages_png_base64?: string[]
  pages_svg_base64?: string[]
  pages_pdf_base64?: string[]
  log?: string
  compile_time?: number
  convert_time?: number
  total_backend_time?: number
  latex_size_bytes?: number
  pdf_size_bytes?: number
  png_size_bytes?: number
}

export interface LatexResponse {
  latex: string
}

export interface ArbeitsblattExecutionResponse {
  success: boolean
  vars?: Record<string, unknown>
  output?: string
  error?: string
  seed?: string | number | null
}

export interface ArbeitsblattGenerateRequest extends ArbeitsblattConfig {
  variables?: Record<string, unknown>
}

export interface ArbeitsblattGenerateResponse {
  latex_tasks?: string
  latex_solutions?: string
  latex?: string
  variables?: Record<string, unknown>
  error?: string
  seed?: string | number | null
}

export interface BruchResponse extends LatexResponse {
  erweitern_latex?: string
  kuerzen_latex?: string
}

export interface OptikResponse extends LatexResponse {
  metrics: ImageMetric[]
}

export interface GeoResponse extends LatexResponse {
  solved?: GeoSolved
  error?: string
}

export interface StatistikResponse extends LatexResponse {
  results: StatistikResult[]
}

export type PresetMap<TConfig> = Record<string, TConfig>

// Track last generator call timing if needed
let lastGeneratorTimeMs = 0
let lastGeneratorName = ''

export const recordGeneratorDuration = (name: string, durationMs: number) => {
  lastGeneratorTimeMs = durationMs
  lastGeneratorName = name
}

export const compileLatex = async (
  latex: string,
  dpi: number = 600,
  allPages: boolean = false,
  engine?: CompilerEngine
): Promise<CompileResponse> => {
  const activeEngine = engine || getGlobalCompilerEngine()
  const t0 = performance.now()
  const lines = latex.split('\n').length
  const chars = latex.length

  emitGlobalTelemetry({
    status: 'running',
    engine: activeEngine,
    generatorName: lastGeneratorName || undefined,
    latexChars: chars,
    latexLines: lines,
    dpi,
  })

  try {
    const response = await apiClient.post<CompileResponse>('compile/', {
      latex,
      dpi,
      all_pages: allPages,
      engine: activeEngine,
    })
    const data = response.data
    const totalClientSeconds = (performance.now() - t0) / 1000
    const buildCodeSeconds = lastGeneratorTimeMs > 0 ? lastGeneratorTimeMs / 1000 : undefined
    
    // Calculate network time (client roundtrip minus backend processing time)
    const backendTime = data.total_backend_time ?? ((data.compile_time ?? 0) + (data.convert_time ?? 0))
    const networkSeconds = Math.max(0, totalClientSeconds - backendTime)

    emitGlobalTelemetry({
      status: data.ok ? 'success' : 'error',
      engine: data.engine || activeEngine,
      generatorName: lastGeneratorName || undefined,
      buildCodeTime: buildCodeSeconds,
      compileTime: data.compile_time,
      convertTime: data.convert_time,
      totalBackendTime: data.total_backend_time,
      networkRtt: networkSeconds,
      totalTime: totalClientSeconds + (buildCodeSeconds || 0),
      latexChars: chars,
      latexLines: lines,
      latexSizeBytes: data.latex_size_bytes || chars,
      pdfSizeBytes: data.pdf_size_bytes,
      pngSizeBytes: data.png_size_bytes,
      dpi,
      errorMessage: data.ok ? undefined : data.log,
    })

    // Reset last generator timing for next run
    lastGeneratorTimeMs = 0
    lastGeneratorName = ''

    return data
  } catch (error: any) {
    const totalClientSeconds = (performance.now() - t0) / 1000
    console.error('Compilation failed:', error)
    
    emitGlobalTelemetry({
      status: 'error',
      engine: activeEngine,
      generatorName: lastGeneratorName || undefined,
      totalTime: totalClientSeconds,
      latexChars: chars,
      latexLines: lines,
      dpi,
      errorMessage: error?.message || 'Verbindungsfehler zur API',
    })

    lastGeneratorTimeMs = 0
    lastGeneratorName = ''

    return { ok: false, log: 'Verbindungsfehler zur API' }
  }
}

export const generateKoordinatensystem = async (config: KoordConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/koordinatensystem', config)
  return response.data
}

export const generateKoordinatensystem3D = async (config: Config3D): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/koordinatensystem3d', config)
  return response.data
}

export const generateBaumdiagramm = async (config: BaumConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/baumdiagramm', config)
  return response.data
}

export const generateGlucksrad = async (config: GluckConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/glucksrad', config)
  return response.data
}

export const generateGeometrie = async (config: GeoConfig): Promise<GeoResponse> => {
  const response = await apiClient.post<GeoResponse>('generators/geometrie', config)
  return response.data
}

export const generateOptik = async (config: OptikConfig): Promise<OptikResponse> => {
  const response = await apiClient.post<OptikResponse>('generators/optik', config)
  return response.data
}

export const generateFlaschenzug = async (config: FlaschenzugConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/flaschenzug', config)
  return response.data
}

export const executeArbeitsblattCode = async (payload: { python_code: string; random_seed?: string | number | null }): Promise<ArbeitsblattExecutionResponse> => {
  const response = { data: await executeWorksheetCodeInPyodide(payload) }
  return response.data
}

export const generateLatexImage = async (config: LatexImageConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/lateximage', config)
  return response.data
}

export const generateErwartungshorizont = async (config: ErwartungshorizontConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/erwartungshorizont', config)
  return response.data
}

export const generateTikzPicture = async (config: TikzConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/tikzpicture', config)
  return response.data
}

export const generateZahlenstrahl = async (config: ZahlenstrahlConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/zahlenstrahl', config)
  return response.data
}

export const generateBruch = async (config: BruchConfig): Promise<BruchResponse> => {
  const response = await apiClient.post<BruchResponse>('generators/bruch', config)
  return response.data
}

export const generateSchaltplan = async (config: SchaltplanConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/schaltplan', config)
  return response.data
}

export const solveSitzplan = async (config: SitzplanRequest): Promise<SitzplanResponse> => {
  const response = await apiClient.post<SitzplanResponse>('generators/sitzplan', config)
  return response.data
}

export const generateArbeitsblatt = async (config: ArbeitsblattGenerateRequest): Promise<ArbeitsblattGenerateResponse> => {
  const response = await apiClient.post<ArbeitsblattGenerateResponse>('generators/arbeitsblatt/generate', config)
  return response.data
}

export const generateStrahlenoptik = async (config: StrahlenoptikConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/strahlenoptik', config)
  return response.data
}

export const generateStellenwerttafel = async (config: StellenwertConfig): Promise<LatexResponse> => {
  const response = await apiClient.post<LatexResponse>('generators/stellenwerttafel', config)
  return response.data
}

export const generateStatistik = async (config: StatistikConfig): Promise<StatistikResponse> => {
  const response = await apiClient.post<StatistikResponse>('generators/statistik', config)
  return response.data
}

export const listPresets = async <TConfig>(generator: string): Promise<PresetMap<TConfig>> => {
  const response = await apiClient.get<PresetMap<TConfig>>(`presets/${generator}`)
  return response.data
}

export const savePreset = async <TConfig>(generator: string, name: string, data: TConfig): Promise<{ ok: boolean }> => {
  const response = await apiClient.post(`presets/${generator}/${name}`, data)
  return response.data
}

export const deletePreset = async (generator: string, name: string): Promise<{ ok: boolean }> => {
  const response = await apiClient.delete<{ ok: boolean }>(`presets/${generator}/${name}`)
  return response.data
}

export const downloadPresetFolder = async (generator: string, folder: string = ''): Promise<void> => {
  const response = await apiClient.get(`presets/${generator}/download-folder`, {
    params: { folder },
    responseType: 'blob',
  })

  let filename = ''
  const disposition = response.headers?.['content-disposition']
  if (disposition) {
    const filenameMatch = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i)
    if (filenameMatch && filenameMatch[1]) {
      filename = decodeURIComponent(filenameMatch[1])
    }
  }
  if (!filename) {
    const cleanFolder = folder.replace(/\s*\/\s*/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '') || 'all'
    filename = `presets_${generator}_${cleanFolder}.zip`
  }

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// --- AI Service Integration (Ollama Local & Cloud Google Gemini) ---

export type AiProviderType = 'ollama' | 'gemini'

export interface AiStatusResponse {
  available: boolean
  active_provider?: AiProviderType
  url?: string
  models: string[]
  default_model?: string
  model?: string
  error?: string
  has_gemini_key?: boolean
  masked_gemini_key?: string | null
  ollama_available?: boolean
  ollama_models?: string[]
}

export interface AiConfigResponse {
  active_provider: AiProviderType
  has_gemini_key: boolean
  masked_gemini_key: string | null
  gemini_default_model: string
  gemini_models: string[]
}

export interface GeminiTestResponse {
  available: boolean
  model?: string
  models?: string[]
  default_model?: string
  error?: string | null
}

export interface PromptToConfigRequest {
  generator: string
  prompt: string
  current_config?: Record<string, unknown>
  model?: string
  provider?: AiProviderType
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  generator: string
  messages: AiChatMessage[]
  current_config?: Record<string, unknown>
  model?: string
  provider?: AiProviderType
}

export interface AiChatResponse<T = Record<string, unknown>> {
  ok: boolean
  message: string
  config: T
  model_used?: string
  provider_used?: AiProviderType
}

export interface PromptToConfigResponse<T = Record<string, unknown>> {
  ok: boolean
  config: T
  model_used?: string
  provider_used?: AiProviderType
}

export const getAiStatus = async (): Promise<AiStatusResponse> => {
  const response = await apiClient.get<AiStatusResponse>('ai/status')
  return response.data
}

export const getAiConfig = async (): Promise<AiConfigResponse> => {
  const response = await apiClient.get<AiConfigResponse>('ai/config')
  return response.data
}

export const setAiProvider = async (provider: AiProviderType): Promise<{ status: string; active_provider: AiProviderType }> => {
  const response = await apiClient.post<{ status: string; active_provider: AiProviderType }>('ai/config/provider', { provider })
  return response.data
}

export const saveGeminiKey = async (apiKey: string): Promise<{ status: string; masked_key: string | null }> => {
  const response = await apiClient.post<{ status: string; masked_key: string | null }>('ai/config/gemini-key', { api_key: apiKey })
  return response.data
}

export const testGeminiConnection = async (apiKey?: string): Promise<GeminiTestResponse> => {
  const payload = apiKey ? { api_key: apiKey } : {}
  const response = await apiClient.post<GeminiTestResponse>('ai/config/test-gemini', payload)
  return response.data
}

export const promptToConfig = async <T = Record<string, unknown>>(payload: PromptToConfigRequest): Promise<PromptToConfigResponse<T>> => {
  const response = await apiClient.post<PromptToConfigResponse<T>>('ai/prompt-to-config', payload)
  return response.data
}

export const chatToConfig = async <T = Record<string, unknown>>(payload: AiChatRequest): Promise<AiChatResponse<T>> => {
  const response = await apiClient.post<AiChatResponse<T>>('ai/chat', payload)
  return response.data
}

export interface StopOllamaResponse {
  ok: boolean
  mode: string
  stopped?: boolean
  unloaded_models?: string[]
  message?: string
  error?: string
}

export const extractApiErrorMessage = (err: any, fallback: string): string => {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d: any) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join(', ')
  }
  if (detail && typeof detail === 'object') {
    return detail.message || JSON.stringify(detail)
  }
  return err?.message || fallback
}

export const stopOllama = async (mode: 'stop_server' | 'unload_models' = 'stop_server'): Promise<StopOllamaResponse> => {
  const response = await apiClient.post<StopOllamaResponse>('ai/stop', { mode })
  return response.data
}


export interface UpdateCheckResult {
  status: 'success' | 'up_to_date' | 'rate_limited' | 'error'
  message?: string
  current_version: string
  latest_version?: string
  has_update: boolean
  is_security_update: boolean
  release_name?: string
  release_url?: string
  release_notes?: string
  published_at?: string
  from_cache?: boolean
}

export interface UpdateSettingsResponse {
  status: string
  current_version: string
  check_on_startup: boolean
  last_checked: string | null
  cached_result: UpdateCheckResult | null
}

export interface UpdateSettingsPayload {
  check_on_startup?: boolean
}

export const getUpdateSettings = async (): Promise<UpdateSettingsResponse> => {
  const response = await apiClient.get<UpdateSettingsResponse>('settings/updates')
  return response.data
}

export const saveUpdateSettings = async (payload: UpdateSettingsPayload): Promise<UpdateSettingsResponse> => {
  const response = await apiClient.post<UpdateSettingsResponse>('settings/updates', payload)
  return response.data
}

export const checkForUpdates = async (force: boolean = false): Promise<UpdateCheckResult> => {
  const response = await apiClient.post<UpdateCheckResult>('settings/updates/check', null, {
    params: { force },
  })
  return response.data
}
