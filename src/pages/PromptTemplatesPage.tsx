import { useState } from 'react'
import { usePromptTemplates } from '../hooks/usePromptTemplates'

export default function PromptTemplatesPage() {
  const { items, loading, error, createTemplate, useTemplate, deleteTemplate } = usePromptTemplates()
  const [title, setTitle] = useState('')
  const [promptText, setPromptText] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !promptText.trim()) return
    setSaving(true)
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
      await createTemplate(title.trim(), promptText.trim(), tagList)
      setTitle('')
      setPromptText('')
      setTags('')
    } finally {
      setSaving(false)
    }
  }

  const handleUse = async (templateId: string, promptTextValue: string) => {
    await useTemplate(templateId)
    await navigator.clipboard.writeText(promptTextValue)
    setCopiedId(templateId)
    setTimeout(() => setCopiedId(null), 1800)
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-primary tracking-tight">
          Prompt Templates
        </h1>
        <p className="text-secondary text-sm mt-1">
          Save your best AI prompts and reuse them across images.
        </p>
      </div>

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="rounded-lg border border-border bg-surface p-4 mb-8 space-y-3"
      >
        <input
          type="text"
          placeholder="Template title (e.g. Product photo cleanup)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-primary focus:outline-none focus:shadow-focus"
          maxLength={120}
        />
        <textarea
          placeholder="Prompt text..."
          value={promptText}
          onChange={e => setPromptText(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-primary focus:outline-none focus:shadow-focus resize-none"
          maxLength={4000}
        />
        <input
          type="text"
          placeholder="Tags, comma separated (e.g. ecommerce, product)"
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-primary focus:outline-none focus:shadow-focus"
        />
        <button
          type="submit"
          disabled={saving || !title.trim() || !promptText.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save Template'}
        </button>
      </form>

      {loading && <p className="text-muted text-sm">Loading templates…</p>}

      {!loading && error && (
        <div role="alert" className="rounded-lg border border-danger/40 bg-surface px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-primary font-semibold">No templates yet</p>
          <p className="text-muted text-sm">Save your first prompt above to reuse it later.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((t, idx) => (
            <li
              key={t.template_id}
              className="rounded-lg border border-border bg-surface p-4 animate-fade-up flex flex-col gap-2"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-primary text-sm">{t.title}</h3>
                <button
                  onClick={() => deleteTemplate(t.template_id)}
                  className="text-muted hover:text-danger text-xs shrink-0"
                  aria-label={`Delete ${t.title}`}
                >
                  Delete
                </button>
              </div>
              <p className="text-secondary text-xs line-clamp-3">{t.prompt_text}</p>
              {t.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-teal/10 text-teal border border-teal/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-muted">Used {t.use_count} time{t.use_count !== 1 ? 's' : ''}</span>
                <button
                  onClick={() => handleUse(t.template_id, t.prompt_text)}
                  className="text-xs font-medium text-teal hover:underline"
                >
                  {copiedId === t.template_id ? 'Copied!' : 'Use & Copy'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
