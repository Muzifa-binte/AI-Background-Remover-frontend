import { useState, useCallback, useRef, useEffect } from 'react'
import axios from 'axios'
import type { Quality } from './useUpload'

// ── Types ──────────────────────────────────────────────────────────────────

export type JobStatus  = 'idle' | 'uploading' | 'pending' | 'running' | 'done' | 'error'
export type FileStatus = 'queued' | 'processing' | 'done' | 'error'

export interface BatchFile {
  original_name:   string
  output_filename: string | null
  download_url:    string | null
  status:          FileStatus
  error:           string | null
}

export interface BatchJob {
  job_id:     string
  status:     'pending' | 'running' | 'done'
  quality:    Quality
  created_at: string
  total:      number
  completed:  number
  failed:     number
  files:      BatchFile[]
}

export interface StartResult {
  job_id:      string
  total_files: number
  quality:     Quality
  status:      string
}

const POLL_INTERVAL_MS = 1500

export function useBatch() {
  const [jobStatus,   setJobStatus]   = useState<JobStatus>('idle')
  const [job,         setJob]         = useState<BatchJob | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [quality,     setQuality]     = useState<Quality>('fast')

  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const jobIdRef       = useRef<string | null>(null)

  // ── Stop polling & close SSE stream ────────────────────────────────────
  const cleanupSubscriptions = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (eventSourceRef.current !== null) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => () => cleanupSubscriptions(), [cleanupSubscriptions])

  // ── Fallback Poll job status ───────────────────────────────────────────
  const startPolling = useCallback((jobId: string) => {
    if (pollRef.current !== null) return

    pollRef.current = setInterval(async () => {
      try {
        const res = await axios.get<BatchJob>(`/api/batch/${jobId}/status`)
        setJob(res.data)
        if (res.data.status === 'done') {
          setJobStatus('done')
          cleanupSubscriptions()
        } else {
          setJobStatus(res.data.status as JobStatus)
        }
      } catch {
        // Non-fatal poll failure — keep trying
      }
    }, POLL_INTERVAL_MS)
  }, [cleanupSubscriptions])

  // ── Start Real-Time Tracking via SSE (with Polling fallback) ───────────
  const startTracking = useCallback((jobId: string) => {
    cleanupSubscriptions()

    if (typeof EventSource === 'undefined') {
      startPolling(jobId)
      return
    }

    try {
      const sse = new EventSource(`/api/batch/${jobId}/events`, { withCredentials: true })
      eventSourceRef.current = sse

      sse.addEventListener('snapshot', (e: MessageEvent) => {
        try {
          const data: BatchJob = JSON.parse(e.data)
          setJob(data)
          setJobStatus(data.status as JobStatus)
          if (data.status === 'done') {
            cleanupSubscriptions()
          }
        } catch {
          // ignore parse errors
        }
      })

      sse.addEventListener('job_started', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          setJobStatus('running')
          setJob(prev => prev ? { ...prev, status: 'running', ...data } : null)
        } catch {}
      })

      sse.addEventListener('file_processing', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          setJob(prev => {
            if (!prev) return prev
            const newFiles = [...prev.files]
            if (newFiles[data.index]) {
              newFiles[data.index] = {
                ...newFiles[data.index],
                status: 'processing',
              }
            }
            return { ...prev, files: newFiles }
          })
        } catch {}
      })

      sse.addEventListener('file_done', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          setJob(prev => {
            if (!prev) return prev
            const newFiles = [...prev.files]
            if (newFiles[data.index]) {
              newFiles[data.index] = {
                ...newFiles[data.index],
                status: 'done',
                output_filename: data.output_filename,
                download_url: data.download_url,
              }
            }
            return {
              ...prev,
              completed: data.completed,
              failed: data.failed,
              files: newFiles,
            }
          })
        } catch {}
      })

      sse.addEventListener('file_error', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          setJob(prev => {
            if (!prev) return prev
            const newFiles = [...prev.files]
            if (newFiles[data.index]) {
              newFiles[data.index] = {
                ...newFiles[data.index],
                status: 'error',
                error: data.error,
              }
            }
            return {
              ...prev,
              completed: data.completed,
              failed: data.failed,
              files: newFiles,
            }
          })
        } catch {}
      })

      sse.addEventListener('job_done', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          setJobStatus('done')
          setJob(prev => prev ? {
            ...prev,
            status: 'done',
            completed: data.completed,
            failed: data.failed,
            files: data.files,
          } : null)
          cleanupSubscriptions()
        } catch {}
      })

      sse.onerror = () => {
        // Fallback gracefully to polling if SSE connection encounters an issue
        cleanupSubscriptions()
        startPolling(jobId)
      }
    } catch {
      startPolling(jobId)
    }
  }, [cleanupSubscriptions, startPolling])

  // ── Start batch job ────────────────────────────────────────────────────
  const startBatch = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    setJobStatus('uploading')
    setJob(null)
    setUploadError(null)
    cleanupSubscriptions()

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))
    formData.append('quality', quality)

    try {
      const res = await axios.post<StartResult>(
        '/api/batch/start',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      jobIdRef.current = res.data.job_id
      setJobStatus('pending')
      startTracking(res.data.job_id)
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : 'Failed to start batch job. Please try again.'
      setUploadError(msg)
      setJobStatus('error')
    }
  }, [quality, startTracking, cleanupSubscriptions])

  // ── Download ZIP ───────────────────────────────────────────────────────
  const downloadZip = useCallback(() => {
    if (!jobIdRef.current) return
    const a = document.createElement('a')
    a.href = `/api/batch/${jobIdRef.current}/download`
    a.download = 'batch_results.zip'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  // ── Reset ──────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    cleanupSubscriptions()
    setJobStatus('idle')
    setJob(null)
    setUploadError(null)
    jobIdRef.current = null
  }, [cleanupSubscriptions])

  // ── Derived progress ───────────────────────────────────────────────────
  const progressPct = job
    ? Math.round(((job.completed + job.failed) / Math.max(job.total, 1)) * 100)
    : 0

  return {
    jobStatus,
    job,
    uploadError,
    progressPct,
    quality,
    setQuality,
    startBatch,
    downloadZip,
    reset,
  }
}
