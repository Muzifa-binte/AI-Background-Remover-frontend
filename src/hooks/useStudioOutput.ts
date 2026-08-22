/**
 * useStudioOutput
 *
 * Convenience hook for tool result pages.
 * Call `registerOutput(url, filename)` once a result is ready to push it
 * into the pipeline context so `SendToMenu` can offer "Send to…" actions.
 *
 * Also exposes `sendTo(route)` for inline "Send to…" button wiring.
 */

import { useCallback } from 'react'
import { useActiveImage } from '../contexts/ActiveImageContext'

export function useStudioOutput() {
  const { setOutput, sendToTool, isSending } = useActiveImage()

  /**
   * Register a completed tool output in the pipeline context.
   * Call this inside a hook/page whenever a result URL is obtained.
   *
   * @param url      Full or relative URL to the processed image
   * @param filename Suggested filename (e.g. "result_abc.png")
   */
  const registerOutput = useCallback(
    (url: string, filename: string) => {
      setOutput(url, filename)
    },
    [setOutput],
  )

  /**
   * Navigate to another tool, pre-filling it with the current output.
   * Wraps `sendToTool` from the context.
   */
  const sendTo = useCallback(
    (route: string, displayName?: string) => sendToTool(route, displayName),
    [sendToTool],
  )

  return { registerOutput, sendTo, isSending }
}
