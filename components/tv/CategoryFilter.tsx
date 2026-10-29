"use client";
import {
  Grid2X2,
  Newspaper,
  Clapperboard,
  Trophy,
  Film,
  Music2,
  Tv,
  Sparkles,
  Compass,
  Sun,
} from "lucide-react";
import { categories } from "@/lib/channels";
const icons = [
  Grid2X2,
  Newspaper,
  Clapperboard,
  Trophy,
  Film,
  Music2,
  Tv,
  Sparkles,
  Compass,
  Sun,
];
export function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="category-filters" aria-label="Filter by category">
      {categories.map((category, index) => {
        const Icon = icons[index];
        return (
          <button
            type="button"
            key={category}
            aria-pressed={selected === category}
            className={selected === category ? "selected" : ""}
            onClick={() => onChange(category)}
          >
            <Icon size={16} />
            {category}
          </button>
        );
      })}
    </div>
  );
}
