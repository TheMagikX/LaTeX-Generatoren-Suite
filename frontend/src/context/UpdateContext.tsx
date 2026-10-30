// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 C. Meyer

import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import {
  checkForUpdates,
  getUpdateSettings,
  saveUpdateSettings,
  type UpdateCheckResult,
} from '../api/client'
import { APP_VERSION } from '../pages/versions'
import { UpdateContext } from './update'

const SESSION_DISMISS_KEY = 'gensuite_update_dismissed'

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [currentVersion, setCurrentVersion] = useState<string>(APP_VERSION)
  const [checkOnStartup, setCheckOnStartupState] = useState<boolean>(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [updateResult, setUpdateResult] = useState<UpdateCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState<boolean>(false)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState<boolean>(false)

  // Sync dismissal with sessionStorage based on latest_version
  useEffect(() => {
    if (!updateResult?.latest_version) return
    try {
      const dismissedVer = sessionStorage.getItem(SESSION_DISMISS_KEY)
      setIsDismissed(dismissedVer === updateResult.latest_version)
    } catch {
      // ignore storage error
    }
  }, [updateResult?.latest_version])

  const dismissBanner = useCallback(() => {
    setIsDismissed(true)
    if (updateResult?.latest_version) {
      try {
        sessionStorage.setItem(SESSION_DISMISS_KEY, updateResult.latest_version)
      } catch {
        // ignore storage error
      }
    }
  }, [updateResult?.latest_version])

  const checkForUpdatesNow = useCallback(
    async (force: boolean = true): Promise<UpdateCheckResult | null> => {
      setIsChecking(true)
      setCheckError(null)
      try {
        const result = await checkForUpdates(force)
        setUpdateResult(result)
        setLastChecked(new Date().toISOString())
        if (result.current_version) {
          setCurrentVersion(result.current_version)
        }
        if (result.status === 'error' || result.status === 'rate_limited') {
          setCheckError(result.message || 'Fehler beim Abrufen der Updates.')
        }
        return result
      } catch (err: unknown) {
        let msg = 'Verbindungsfehler zu GitHub.'
        if (axios.isAxiosError(err)) {
          msg = err.response?.data?.detail || err.message || msg
        } else if (err instanceof Error) {
          msg = err.message
        }
        setCheckError(msg)
        return null
      } finally {
        setIsChecking(false)
      }
    },
    []
  )

  const handleSetCheckOnStartup = useCallback(async (enabled: boolean) => {
    try {
      const res = await saveUpdateSettings({ check_on_startup: enabled })
      setCheckOnStartupState(res.check_on_startup)
    } catch (err: unknown) {
      console.error('Failed to save update settings:', err)
      throw err
    }
  }, [])

  // Initial load on startup
  useEffect(() => {
    let isMounted = true

    async function initUpdates() {
      try {
        const settings = await getUpdateSettings()
        if (!isMounted) return

        if (settings.current_version) {
          setCurrentVersion(settings.current_version)
        }
        setCheckOnStartupState(settings.check_on_startup)
        setLastChecked(settings.last_checked)
        if (settings.cached_result) {
          setUpdateResult(settings.cached_result)
        }

        // Automatic check ONLY if opt-in is enabled
        if (settings.check_on_startup) {
          checkForUpdatesNow(false)
        }
      } catch (err) {
        // Non-blocking, offline-first fallback
        console.warn('Update check initialization skipped or failed:', err)
      }
    }

    initUpdates()

    return () => {
      isMounted = false
    }
  }, [checkForUpdatesNow])

  return (
    <UpdateContext.Provider
      value={{
        currentVersion,
        checkOnStartup,
        setCheckOnStartup: handleSetCheckOnStartup,
        lastChecked,
        updateResult,
        isChecking,
        checkError,
        isDismissed,
        dismissBanner,
        checkForUpdatesNow,
      }}
    >
      {children}
    </UpdateContext.Provider>
  )
}
