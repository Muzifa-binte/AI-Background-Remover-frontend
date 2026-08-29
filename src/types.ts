// ── Chat ────────────────────────────────────────────────────────────────────

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  thinking?: string | null
  timestamp: number
  topic?: string
}

export interface ChatResponse {
  reply: string
  thinking?: string | null
}

// ── Image Analysis ───────────────────────────────────────────────────────────

export interface ImageAnalysis {
  subject: string
  image_type: string
  background_description: string
  suggested_use: string
  editing_recommendations: string[]
}

// ── Caption ──────────────────────────────────────────────────────────────────

export type CaptionStyle =
  | 'instagram'
  | 'professional'
  | 'product'
  | 'marketing'
  | 'casual'

export interface CaptionResponse {
  caption: string
  style: CaptionStyle
}

export interface CaptionsResponse {
  captions: string[]
  style: CaptionStyle
}

// ── Background Suggestions ───────────────────────────────────────────────────

export interface BackgroundSuggestionsResponse {
  suggestions: string[]
}

// ── Prompt Templates ─────────────────────────────────────────────────────────

export interface PromptTemplate {
  template_id: string
  user_id: string
  title: string
  prompt_text: string
  tags: string[]
  use_count: number
  created_at: string
}

// ── Favorites ─────────────────────────────────────────────────────────────

export interface Favorite {
  favorite_id: string
  user_id: string
  content: string
  source: 'chat' | 'caption' | 'suggestion'
  created_at: string
}
