import axios from "axios";
import type { Topic, Paper, PaperListResponse, Digest, User, UserTopic } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({ baseURL: API_BASE });

// ── Users ──────────────────────────────────────────────────────────────────

export const getMe = (): Promise<User> => api.get("/users/me").then((r) => r.data);
export const updateMe = (data: { name: string; email?: string }): Promise<User> =>
  api.put("/users/me", data).then((r) => r.data);

// ── Topics ─────────────────────────────────────────────────────────────────

export const listTopics = (): Promise<Topic[]> => api.get("/topics/").then((r) => r.data);

export const createTopic = (data: Partial<Topic>): Promise<Topic> =>
  api.post("/topics/", data).then((r) => r.data);

export const deleteTopic = (id: number): Promise<void> =>
  api.delete(`/topics/${id}`).then(() => undefined);

export const getSubscriptions = (): Promise<UserTopic[]> =>
  api.get("/topics/subscriptions").then((r) => r.data);

export const subscribe = (topicId: number): Promise<UserTopic> =>
  api.post("/topics/subscriptions", { topic_id: topicId }).then((r) => r.data);

export const unsubscribe = (topicId: number): Promise<void> =>
  api.delete(`/topics/subscriptions/${topicId}`).then(() => undefined);

// ── Papers ─────────────────────────────────────────────────────────────────

export interface PaperFilters {
  topic_id?: number;
  search?: string;
  min_score?: number;
  is_saved?: boolean;
  is_read?: boolean;
  page?: number;
  per_page?: number;
}

export const listPapers = (filters: PaperFilters = {}): Promise<PaperListResponse> => {
  const params: Record<string, string | number | boolean> = {};
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params[k] = v;
  });
  return api.get("/papers/", { params }).then((r) => r.data);
};

export const getPaper = (id: number): Promise<Paper> =>
  api.get(`/papers/${id}`).then((r) => r.data);

export const getRelatedPapers = (id: number): Promise<Paper[]> =>
  api.get(`/papers/${id}/related`).then((r) => r.data);

export const updatePaperState = (
  id: number,
  state: { is_saved?: boolean; is_read?: boolean }
): Promise<void> => api.patch(`/papers/${id}/state`, state).then(() => undefined);

// ── Digest ─────────────────────────────────────────────────────────────────

export const getTodayDigest = (): Promise<Digest> =>
  api.get("/digest/today").then((r) => r.data);

// ── Sync ───────────────────────────────────────────────────────────────────

export const triggerSync = (): Promise<{ message: string }> =>
  api.post("/sync/").then((r) => r.data);
