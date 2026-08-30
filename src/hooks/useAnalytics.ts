import { useCallback, useEffect, useState } from 'react'
import apiClient from '../services/apiClient'

export interface FeatureUsageCount {
  feature: string
  count: number
}

export interface UsageSummary {
  total_events: number
  by_feature: FeatureUsageCount[]
  period_days: number
}

export interface SuccessMetricRow {
  action_type: string
  suggested_count: number
  applied_count: number
  apply_rate: number
}

export interface SuccessMetrics {
  overall_apply_rate: number
  by_action_type: SuccessMetricRow[]
  period_days: number
}

export interface CostSummary {
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  by_feature: Record<string, number>
  period_days: number
}

export interface FeedbackSummaryRow {
  action_type: string
  avg_rating: number
  count: number
}

export interface FeedbackSummary {
  period_days: number
  by_action_type: FeedbackSummaryRow[]
}

export function useAnalytics(days = 30) {
  const [usage, setUsage] = useState<UsageSummary | null>(null)
  const [success, setSuccess] = useState<SuccessMetrics | null>(null)
  const [cost, setCost] = useState<CostSummary | null>(null)
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usageRes, successRes, costRes, feedbackRes] = await Promise.all([
        apiClient.get<UsageSummary>('/api/analytics/usage', { params: { days } }),
        apiClient.get<SuccessMetrics>('/api/analytics/success', { params: { days } }),
        apiClient.get<CostSummary>('/api/analytics/cost', { params: { days } }),
        apiClient.get<FeedbackSummary>('/api/analytics/feedback/summary', { params: { days } }),
      ])
      setUsage(usageRes.data)
      setSuccess(successRes.data)
      setCost(costRes.data)
      setFeedback(feedbackRes.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  return { usage, success, cost, feedback, loading, error, reload: load }
}
