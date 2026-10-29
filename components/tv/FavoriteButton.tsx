"use client";
import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";
export function FavoriteButton({
  id,
  name,
  withLabel = false,
}: {
  id: string;
  name: string;
  withLabel?: boolean;
}) {
  const { ids, ready, toggle } = useFavorites();
  const active = ids.includes(id);
  return (
    <button
      type="button"
      className={`favorite-button ${active ? "is-favorite" : ""} ${withLabel ? "with-label" : ""}`}
      disabled={!ready}
      onClick={() => toggle(id)}
      aria-pressed={active}
      aria-label={`${active ? "Remove" : "Add"} ${name} ${active ? "from" : "to"} favorites`}
      title={active ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={18} fill={active ? "currentColor" : "none"} />
      {withLabel && (
        <span>{active ? "Saved to favorites" : "Add to favorites"}</span>
      )}
    </button>
  );
}
