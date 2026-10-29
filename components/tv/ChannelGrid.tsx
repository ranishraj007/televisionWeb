"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  Heart,
  RotateCcw,
  ChevronDown,
  Radio,
} from "lucide-react";
import { orderedChannels } from "@/lib/channels";
import { useFavorites } from "./FavoritesProvider";
import { ChannelCard } from "./ChannelCard";
import { CategoryFilter } from "./CategoryFilter";
export function ChannelGrid({
  favoritesOnly = false,
  compact = false,
  initialQuery = "",
  initialCategory = "All channels",
}: {
  favoritesOnly?: boolean;
  compact?: boolean;
  initialQuery?: string;
  initialCategory?: string;
}) {
  const { ids, ready, storageError } = useFavorites();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");
  const [limit, setLimit] = useState(compact ? 12 : 24);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = orderedChannels.filter(
      (channel) =>
        (!favoritesOnly || ids.includes(channel.id)) &&
        (category === "All channels" || channel.category === category) &&
        `${channel.name} ${channel.category} ${channel.group} ${channel.language || ""}`
          .toLowerCase()
          .includes(needle),
    );
    return sort === "name"
      ? list.sort((a, b) => a.name.localeCompare(b.name))
      : list;
  }, [query, category, sort, favoritesOnly, ids]);
  const reset = () => {
    setQuery("");
    setCategory("All channels");
  };
  if (favoritesOnly && !ready)
    return (
      <div className="channel-grid" aria-label="Loading favorites">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton card-skeleton" />
        ))}
      </div>
    );
  return (
    <div id="channel-library">
      {storageError && (
        <p className="inline-notice" role="status">
          Your browser is blocking local storage. Favorites will last for this
          visit only.
        </p>
      )}
      <CategoryFilter
        selected={category}
        onChange={(value) => {
          setCategory(value);
          setLimit(compact ? 12 : 24);
        }}
      />
      <div className="library-toolbar">
        <p aria-live="polite">
          <Radio size={15} />
          <strong>{filtered.length}</strong>{" "}
          {favoritesOnly ? "saved channels" : "channels to explore"}
          <span className="toolbar-divider" />
          <span className="subtle">Find your next favorite.</span>
        </p>
        <div className="library-tools">
          <label className="library-search">
            <Search size={16} />
            <input
              aria-label="Filter channels"
              placeholder="Search channels…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(compact ? 12 : 24);
              }}
            />
            {query && (
              <button onClick={() => setQuery("")} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <label className="sort-label">
            <span className="sr-only">Sort channels</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Featured</option>
              <option value="name">A to Z</option>
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>
      {filtered.length > 0 ? (
        <>
          <div className="channel-grid">
            {filtered.slice(0, limit).map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>
          {filtered.length > limit && (
            <div className="load-more">
              {compact ? (
                <Link
                  href={`/live?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}`}
                  className="button button-secondary"
                >
                  Explore all {filtered.length} channels
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  className="button button-secondary"
                  onClick={() => setLimit((value) => value + 24)}
                >
                  Show more channels
                  <ChevronDown size={16} />
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          {favoritesOnly && ids.length === 0 ? (
            <Heart size={34} />
          ) : (
            <Search size={34} />
          )}
          <h3>
            {favoritesOnly && ids.length === 0
              ? "Your favorites start here"
              : "No channels found"}
          </h3>
          <p>
            {favoritesOnly && ids.length === 0
              ? "Tap the heart on a channel to keep the ones you love close."
              : "Try another channel name or choose a different category."}
          </p>
          {favoritesOnly && ids.length === 0 ? (
            <Link className="button button-primary" href="/live">
              Discover channels
              <ArrowRight size={17} />
            </Link>
          ) : (
            <button className="button button-secondary" onClick={reset}>
              <RotateCcw size={16} />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
