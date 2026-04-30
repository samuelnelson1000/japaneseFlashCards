export interface FlashCard {
  id: string
  japanese: string
  reading: string
  english: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  created_at: string
}

export interface StudySession {
  id: string
  user_id: string
  cards_studied: number
  correct: number
  incorrect: number
  created_at: string
}

export type CardState = 'unseen' | 'correct' | 'incorrect'
