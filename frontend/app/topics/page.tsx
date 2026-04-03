"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listTopics, getSubscriptions, subscribe, unsubscribe, createTopic, deleteTopic } from "@/lib/api";
import type { Topic } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Check } from "lucide-react";

export default function TopicsPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDisplay, setNewDisplay] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newQuery, setNewQuery] = useState("");

  const { data: allTopics } = useQuery({ queryKey: ["topics"], queryFn: listTopics });
  const { data: subscriptions } = useQuery({ queryKey: ["subscriptions"], queryFn: getSubscriptions });

  const subscribedIds = new Set(subscriptions?.map((s) => s.topic_id) ?? []);

  const subscribeMutation = useMutation({
    mutationFn: subscribe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const unsubscribeMutation = useMutation({
    mutationFn: unsubscribe,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  const createMutation = useMutation({
    mutationFn: createTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      setShowCreate(false);
      setNewName("");
      setNewDisplay("");
      setNewCategory("");
      setNewQuery("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["topics"] });
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  const handleCreate = () => {
    if (!newName || !newDisplay) return;
    createMutation.mutate({
      name: newName.toLowerCase().replace(/\s+/g, "-"),
      display_name: newDisplay,
      arxiv_category: newCategory || undefined,
      arxiv_query: newQuery || undefined,
      is_default: false,
    });
  };

  const defaultTopics = allTopics?.filter((t) => t.is_default) ?? [];
  const customTopics = allTopics?.filter((t) => !t.is_default) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Topics</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Choose topics to follow. Papers will be fetched from arXiv based on your selections.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Topic
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">New Topic</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Internal Name *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. diffusion-models"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Display Name *</label>
              <input
                value={newDisplay}
                onChange={(e) => setNewDisplay(e.target.value)}
                placeholder="e.g. Diffusion Models"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">arXiv Category</label>
              <input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="e.g. cs.LG"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search Query</label>
              <input
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="e.g. diffusion models"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 rounded-lg text-sm text-gray-500 border border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName || !newDisplay || createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating…" : "Create Topic"}
            </button>
          </div>
        </div>
      )}

      {/* Default topics */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Default Topics
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {defaultTopics.map((topic: Topic) => {
            const isSubscribed = subscribedIds.has(topic.id);
            return (
              <div
                key={topic.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border-2 transition-colors",
                  isSubscribed
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{topic.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{topic.display_name}</p>
                    {topic.arxiv_category && (
                      <p className="text-xs text-gray-400">{topic.arxiv_category}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    isSubscribed
                      ? unsubscribeMutation.mutate(topic.id)
                      : subscribeMutation.mutate(topic.id)
                  }
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isSubscribed
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border-2 border-gray-300 text-gray-300 hover:border-indigo-400 hover:text-indigo-400"
                  )}
                >
                  {isSubscribed && <Check className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Custom topics */}
      {customTopics.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Custom Topics
          </h2>
          <div className="grid gap-3">
            {customTopics.map((topic: Topic) => {
              const isSubscribed = subscribedIds.has(topic.id);
              return (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{topic.icon ?? "🔬"}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{topic.display_name}</p>
                      <p className="text-xs text-gray-400">
                        {[topic.arxiv_category, topic.arxiv_query].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        isSubscribed
                          ? unsubscribeMutation.mutate(topic.id)
                          : subscribeMutation.mutate(topic.id)
                      }
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                        isSubscribed
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "border-2 border-gray-300 text-gray-300 hover:border-indigo-400"
                      )}
                    >
                      {isSubscribed && <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(topic.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
