export interface Card {
  id: string;
  question: string;
  answer: string;
  memory_strength: number;
}

export interface Deck {
  id: string;
  title: string;
  card_count: number;
  is_public?: boolean;
  share_token?: string;
}

export type Screen = 'home' | 'study' | 'create' | 'result' | 'view-cards' | 'hard-quiz' | 'recall';
