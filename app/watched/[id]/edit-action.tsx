"use client";

import { useState } from "react";
import {
  WatchedEntryEditSheet,
  type WatchedEntryEditMovie,
} from "../../watched-entry-edit-sheet";

export function EditWatchedEntryAction({
  movie,
}: {
  movie: WatchedEntryEditMovie;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-full bg-white/70 px-4 py-2 text-[13px] font-semibold text-black/55 backdrop-blur-md"
        onClick={() => setIsEditing(true)}
      >
        Edit
      </button>

      {isEditing ? (
        <WatchedEntryEditSheet
          movie={movie}
          onClose={() => setIsEditing(false)}
        />
      ) : null}
    </>
  );
}
