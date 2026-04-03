"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search papers…", className }: SearchBarProps) {
  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
