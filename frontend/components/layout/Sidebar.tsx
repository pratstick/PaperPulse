"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Bookmark, Calendar, Home, RefreshCw, Settings, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { triggerSync } from "@/lib/api";

const navItems = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/digest", label: "Today's Digest", icon: Calendar },
  { href: "/topics", label: "My Topics", icon: Tag },
  { href: "/papers?is_saved=true", label: "Saved Papers", icon: Bookmark },
  { href: "/papers?is_read=true", label: "Read Papers", icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();
  const syncMutation = useMutation({
    mutationFn: triggerSync,
  });

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">📚</span>
          <span className="font-bold text-gray-900 text-lg">PaperPulse</span>
        </Link>
        <p className="text-xs text-gray-500 mt-1">Auto Research Digest</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href.split("?")[0]));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sync button */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
          {syncMutation.isPending ? "Syncing…" : "Sync Papers"}
        </button>
        {syncMutation.isSuccess && (
          <p className="text-xs text-emerald-600 mt-1 px-3">Sync started!</p>
        )}
      </div>
    </aside>
  );
}
