"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/src/components/material-icon";
import { type MovieRating } from "./movie-ratings";
import { RatingSelector } from "./rating-selector";

export type { MovieRating };

export type WatchedEntryEditMovie = {
  watchedEntryId: string;
  title: string;
  releaseYear: number | null;
  poster: string | null;
  watchedDate: string | null;
  platform: string | null;
  rating: MovieRating;
  words: string | null;
};

type SaveState = "idle" | "saving" | "deleting";

const EDIT_SHEET_TRANSITION_MS = 320;

function getReleaseYearLabel(releaseYear: number | null) {
  return releaseYear === null ? "null" : String(releaseYear);
}

export function WatchedEntryEditSheet({
  movie,
  onClose,
  deleteRedirectHref = "/",
}: {
  movie: WatchedEntryEditMovie;
  onClose: () => void;
  deleteRedirectHref?: string;
}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [watchedDate, setWatchedDate] = useState(movie.watchedDate ?? "");
  const [platform, setPlatform] = useState(movie.platform ?? "");
  const [rating, setRating] = useState<MovieRating>(movie.rating);
  const [words, setWords] = useState(movie.words ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    openFrameRef.current = window.requestAnimationFrame(() => {
      openFrameRef.current = window.requestAnimationFrame(() => {
        setIsVisible(true);
        openFrameRef.current = null;
      });
    });

    return () => {
      document.body.style.overflow = previousOverflow;

      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }

      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  function closeSheet(afterClose?: () => void) {
    setIsVisible(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
      afterClose?.();
      closeTimeoutRef.current = null;
    }, EDIT_SHEET_TRANSITION_MS);
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setError(null);

    try {
      const response = await fetch(
        `/api/watched-entries/${movie.watchedEntryId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            watched_date: watchedDate,
            platform,
            rating,
            words,
          }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error ?? "Save failed.");
      }

      closeSheet(() => router.refresh());
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
      setSaveState("idle");
    }
  }

  async function deleteEntry() {
    setSaveState("deleting");
    setError(null);

    try {
      const response = await fetch(
        `/api/watched-entries/${movie.watchedEntryId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error ?? "Delete failed.");
      }

      closeSheet(() => {
        router.replace(deleteRedirectHref);
        router.refresh();
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed"
      );
      setSaveState("idle");
    }
  }

  return (
    <div
      className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-black/20"
      data-state={isVisible ? "open" : "closed"}
    >
      <button
        type="button"
        aria-label="Close edit sheet"
        className="absolute inset-0 cursor-default touch-manipulation"
        onClick={() => closeSheet()}
      />

      <section
        aria-labelledby="edit-entry-title"
        aria-modal="true"
        className="sheet-panel relative z-10 mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden rounded-t-[28px] bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 text-black shadow-[0_-18px_60px_rgba(0,0,0,0.16)] sm:px-8"
        data-state={isVisible ? "open" : "closed"}
        role="dialog"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />

        <div className="mt-5 flex h-9 min-w-0 items-center justify-between">
          <span className="h-9 w-9" aria-hidden="true" />
          <h2
            id="edit-entry-title"
            className="text-[18px] font-extrabold leading-6 text-black"
          >
            Edit
          </h2>
          <button
            type="button"
            aria-label="Close edit sheet"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-wrapper text-black/70"
            onClick={() => closeSheet()}
          >
            <MaterialIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
          <form className="mt-6 min-w-0" onSubmit={saveEntry}>
            <div className="grid min-w-0 grid-cols-[60px_minmax(0,1fr)] items-center gap-4">
              <div className="relative h-[90px] w-[60px] overflow-hidden rounded-sm bg-wrapper">
                {movie.poster ? (
                  <Image
                    src={movie.poster}
                    alt={`${movie.title} poster`}
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-[20px] font-extrabold leading-[26px] text-black">
                  {movie.title}
                </h3>
                <p className="mt-2 text-[14px] font-medium leading-5 text-black/55">
                  {getReleaseYearLabel(movie.releaseYear)}
                </p>
              </div>
            </div>

            <div className="mt-6 min-w-0 space-y-5">
              <div className="min-w-0">
                <label
                  className="mb-2 block text-[13px] font-extrabold text-black/55"
                  htmlFor="edit-watched-date"
                >
                  Watched date
                </label>
                <input
                  id="edit-watched-date"
                  type="date"
                  value={watchedDate}
                  className="h-12 w-full min-w-0 max-w-full rounded-md bg-wrapper px-4 text-[16px] font-semibold text-black outline-none focus:bg-wrapper-strong"
                  onChange={(event) => setWatchedDate(event.target.value)}
                />
              </div>

              <div className="min-w-0">
                <label
                  className="mb-2 block text-[13px] font-extrabold text-black/55"
                  htmlFor="edit-platform"
                >
                  Platform
                </label>
                <input
                  id="edit-platform"
                  type="text"
                  value={platform}
                  className="h-12 w-full min-w-0 max-w-full rounded-md bg-wrapper px-4 text-[16px] font-semibold text-black outline-none placeholder:text-black/30 focus:bg-wrapper-strong"
                  placeholder="Cinema, Netflix, Apple TV"
                  onChange={(event) => setPlatform(event.target.value)}
                />
              </div>

              <RatingSelector value={rating} onChange={setRating} />

              <div className="min-w-0">
                <label
                  className="mb-2 block text-[13px] font-extrabold text-black/55"
                  htmlFor="edit-words"
                >
                  Words
                </label>
                <textarea
                  id="edit-words"
                  value={words}
                  rows={3}
                  className="min-h-24 w-full min-w-0 max-w-full resize-none rounded-md bg-wrapper px-4 py-3 text-[16px] font-semibold text-black outline-none placeholder:text-black/30 focus:bg-wrapper-strong"
                  placeholder="Why did you like it?"
                  onChange={(event) => setWords(event.target.value)}
                />
              </div>

              {error ? (
                <p
                  className="text-[13px] font-semibold text-red-600"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="min-w-0 space-y-3 pt-1">
                <button
                  type="submit"
                  className="flex h-12 w-full min-w-0 items-center justify-center rounded-full bg-accent text-[15px] font-extrabold text-white disabled:bg-black/15"
                  disabled={saveState !== "idle"}
                >
                  {saveState === "saving" ? "Saving" : "Save"}
                </button>

                <button
                  type="button"
                  className="flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full bg-wrapper text-[15px] font-extrabold text-red-600 disabled:text-black/25"
                  disabled={saveState !== "idle"}
                  onClick={deleteEntry}
                >
                  <MaterialIcon name="delete" className="h-5 w-5" />
                  {saveState === "deleting" ? "Deleting" : "Delete"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
