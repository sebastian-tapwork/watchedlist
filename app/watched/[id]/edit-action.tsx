"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
  const portalRoot = typeof document === "undefined" ? null : document.body;

  return (
    <>
      <button
        type="button"
        className="rounded-full bg-white/70 px-4 py-2 text-[13px] font-semibold text-black/55 backdrop-blur-md"
        onClick={() => setIsEditing(true)}
      >
        Edit
      </button>

      {isEditing && portalRoot
        ? createPortal(
            <WatchedEntryEditSheet
              movie={movie}
              onClose={() => setIsEditing(false)}
            />,
            portalRoot
          )
        : null}
    </>
  );
}
