import { useAnalytics } from '../hooks/useAnalytics'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-2xl font-display font-bold text-primary">{value}</p>
      {sub && <p className="text-[11px] text-secondary mt-0.5">{sub}</p>}
    </div>
  )
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-secondary w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-page overflow-hidden">
        <div
          className="h-full bg-teal rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-primary w-8 text-right shrink-0">{value}</span>
    </div>
  )
}

export default function AnalyticsDashboardPage() {
  const { usage, success, cost, feedback, loading, error } = useAnalytics(30)

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-muted text-sm">Loading analytics…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div role="alert" className="rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
          {error}
        </div>
      </main>
    )
  }

  const maxUsage = Math.max(1, ...(usage?.by_feature.map(f => f.count) ?? [0]))
  const avgFeedback =
    feedback && feedback.by_action_type.length > 0
      ? (
          feedback.by_action_type.reduce((sum, r) => sum + r.avg_rating * r.count, 0) /
          feedback.by_action_type.reduce((sum, r) => sum + r.count, 0)
        ).toFixed(1)
      : '—'

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
          Analytics & Insights
        </h1>
        <p className="text-secondary text-sm mt-1">Last 30 days</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total AI actions" value={String(usage?.total_events ?? 0)} />
        <StatCard
          label="Suggestion apply rate"
          value={`${Math.round((success?.overall_apply_rate ?? 0) * 100)}%`}
        />
        <StatCard
          label="Estimated AI cost"
          value={`$${(cost?.total_cost_usd ?? 0).toFixed(4)}`}
          sub={`${(cost?.total_input_tokens ?? 0) + (cost?.total_output_tokens ?? 0)} tokens`}
        />
        <StatCard label="Avg. feedback rating" value={`${avgFeedback} / 5`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage by feature */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-primary text-sm mb-4">Most used AI features</h2>
          {usage && usage.by_feature.length > 0 ? (
            <div className="space-y-3">
              {usage.by_feature.map(f => (
                <BarRow key={f.feature} label={f.feature} value={f.count} max={maxUsage} />
              ))}
            </div>
          ) : (
            <p className="text-muted text-xs">No usage data yet.</p>
          )}
        </div>

        {/* Success metrics */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-primary text-sm mb-4">Suggestion apply rate by feature</h2>
          {success && success.by_action_type.length > 0 ? (
            <ul className="space-y-2.5">
              {success.by_action_type.map(row => (
                <li key={row.action_type} className="flex items-center justify-between text-xs">
                  <span className="text-secondary">{row.action_type}</span>
                  <span className="text-primary font-medium">
                    {row.applied_count}/{row.suggested_count} ({Math.round(row.apply_rate * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-xs">No action history yet.</p>
          )}
        </div>

        {/* Cost by feature */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-primary text-sm mb-4">Cost by feature</h2>
          {cost && Object.keys(cost.by_feature).length > 0 ? (
            <ul className="space-y-2.5">
              {Object.entries(cost.by_feature).map(([feature, amount]) => (
                <li key={feature} className="flex items-center justify-between text-xs">
                  <span className="text-secondary">{feature}</span>
                  <span className="text-primary font-medium">${amount.toFixed(4)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-xs">No cost data yet.</p>
          )}
        </div>

        {/* Feedback ratings */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-semibold text-primary text-sm mb-4">Quality feedback by feature</h2>
          {feedback && feedback.by_action_type.length > 0 ? (
            <ul className="space-y-2.5">
              {feedback.by_action_type.map(row => (
                <li key={row.action_type} className="flex items-center justify-between text-xs">
                  <span className="text-secondary">{row.action_type}</span>
                  <span className="text-primary font-medium">
                    {row.avg_rating.toFixed(1)} / 5 ({row.count} rating{row.count !== 1 ? 's' : ''})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted text-xs">No feedback submitted yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}
