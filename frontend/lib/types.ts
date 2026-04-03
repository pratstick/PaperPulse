// Type definitions matching the backend schemas

export interface Topic {
  id: number;
  name: string;
  display_name: string;
  arxiv_category?: string;
  arxiv_query?: string;
  is_default: boolean;
  icon?: string;
}

export interface UserTopic {
  id: number;
  user_id: number;
  topic_id: number;
  topic: Topic;
}

export interface PaperSummary {
  id: number;
  summary: string;
  key_contributions: string[];
  practical_relevance?: string;
  limitations?: string;
  why_it_matters?: string;
}

export interface Paper {
  id: number;
  arxiv_id: string;
  title: string;
  authors: string[];
  abstract: string;
  published_at: string;
  updated_at?: string;
  arxiv_url?: string;
  pdf_url?: string;
  importance_score: number;
  fetched_at: string;
  topics: Topic[];
  summary?: PaperSummary;
  is_saved: boolean;
  is_read: boolean;
}

export interface PaperListResponse {
  items: Paper[];
  total: number;
  page: number;
  per_page: number;
}

export interface Digest {
  id: number;
  user_id: number;
  date: string;
  paper_ids: number[];
  generated_at: string;
  estimated_read_minutes: number;
  papers: Paper[];
}

export interface User {
  id: number;
  name: string;
  email?: string;
  created_at: string;
  topics: UserTopic[];
}
