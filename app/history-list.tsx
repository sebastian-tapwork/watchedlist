"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  MaterialIcon,
  type MaterialIconName,
} from "@/src/components/material-icon";

type MovieRating = "liked" | "okay" | "disliked";
type MovieMetadataItem = {
  label: string;
  value: string;
};

export type HistoryMovie = {
  id: string;
  watchedEntryId: string | null;
  title: string;
  metadata: MovieMetadataItem[];
  rating: MovieRating;
  poster: string | null;
  watchedDate: string | null;
  platform: string | null;
};

type SaveState = "idle" | "saving" | "deleting";

const DETAIL_TRANSITION_MS = 320;

const ratingIcons: Record<MovieRating, MaterialIconName> = {
  liked: "thumb_up",
  okay: "sentiment_neutral",
  disliked: "thumb_down",
};

const ratingLabels: Record<MovieRating, string> = {
  liked: "Liked",
  okay: "Okay",
  disliked: "Disliked",
};

const ratingOptions: { value: MovieRating; label: string }[] = [
  { value: "liked", label: "Liked" },
  { value: "okay", label: "Okay" },
  { value: "disliked", label: "Disliked" },
];

function getDisplayValue(value: string | null) {
  return value?.trim() ? value : "null";
}

function MovieListItem({
  movie,
  index,
  onOpen,
}: {
  movie: HistoryMovie;
  index: number;
  onOpen: (movie: HistoryMovie) => void;
}) {
  const content = (
    <>
      <div className="relative h-[90px] w-[60px] overflow-hidden rounded-sm bg-wrapper">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            fill
            sizes="60px"
            loading={index < 3 ? "eager" : "lazy"}
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="min-w-0">
        <h2 className="min-w-0 text-[20px] font-extrabold leading-[26px]">
          {movie.title}
        </h2>

        <div className="mt-3 flex items-center justify-between gap-4">
          <dl className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[14px] font-medium leading-5 text-black/55">
            {movie.metadata.map((item, metadataIndex) => (
              <Fragment key={item.label}>
                {metadataIndex > 0 ? <dd aria-hidden="true">/</dd> : null}
                <dt className="sr-only">{item.label}</dt>
                <dd>{item.value}</dd>
              </Fragment>
            ))}
          </dl>

          <span
            aria-label={ratingLabels[movie.rating]}
            className="flex h-5 w-5 shrink-0 items-center justify-center text-black/45"
            role="img"
          >
            <MaterialIcon
              name={ratingIcons[movie.rating]}
              className="h-[17px] w-[17px]"
            />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <article>
      {movie.watchedEntryId ? (
        <button
          type="button"
          className="grid w-full touch-manipulation grid-cols-[60px_minmax(0,1fr)] items-center gap-4 text-left"
          onClick={() => onOpen(movie)}
        >
          {content}
        </button>
      ) : (
        <div className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4">
          {content}
        </div>
      )}
    </article>
  );
}

function WatchedEntryDetailSheet({
  movie,
  onClose,
}: {
  movie: HistoryMovie;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [watchedDate, setWatchedDate] = useState(movie.watchedDate ?? "");
  const [platform, setPlatform] = useState(movie.platform ?? "");
  const [rating, setRating] = useState<MovieRating>(movie.rating);
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

  function closeSheet() {
    setIsVisible(false);

    closeTimeoutRef.current = window.setTimeout(() => {
      onClose();
      closeTimeoutRef.current = null;
    }, DETAIL_TRANSITION_MS);
  }

  async function saveEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!movie.watchedEntryId) {
      return;
    }

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
          }),
        }
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error ?? "Save failed.");
      }

      closeSheet();
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
      setSaveState("idle");
    }
  }

  async function deleteEntry() {
    if (!movie.watchedEntryId) {
      return;
    }

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

      closeSheet();
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Delete failed"
      );
      setSaveState("idle");
    }
  }

  return (
    <div
      className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/20"
      data-state={isVisible ? "open" : "closed"}
    >
      <button
        type="button"
        aria-label="Close movie details"
        className="absolute inset-0 cursor-default touch-manipulation"
        onClick={closeSheet}
      />

      <section
        aria-labelledby="movie-detail-title"
        aria-modal="true"
        className="sheet-panel relative z-10 flex w-full max-w-[480px] flex-col rounded-t-[28px] bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.16)] sm:px-8"
        data-state={isVisible ? "open" : "closed"}
        role="dialog"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />

        <div className="mt-5 flex h-9 items-center justify-between">
          <span className="h-9 w-9" aria-hidden="true" />
          <h2
            id="movie-detail-title"
            className="text-[18px] font-extrabold leading-6"
          >
            Details
          </h2>
          <button
            type="button"
            aria-label="Close movie details"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-wrapper text-black/70"
            onClick={closeSheet}
          >
            <MaterialIcon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-2">
          <div className="mt-7 flex flex-col items-center text-center">
            <div className="relative h-[180px] w-[120px] overflow-hidden rounded-sm bg-wrapper">
              {movie.poster ? (
                <Image
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              ) : null}
            </div>

            <h3 className="mt-5 text-[24px] font-extrabold leading-[30px]">
              {movie.title}
            </h3>

            <dl className="mt-3 flex flex-wrap justify-center gap-x-2 gap-y-1 text-[14px] font-medium leading-5 text-black/55">
              <dt className="sr-only">Watched date</dt>
              <dd>{getDisplayValue(watchedDate)}</dd>
              <dd aria-hidden="true">/</dd>
              <dt className="sr-only">Platform</dt>
              <dd>{getDisplayValue(platform)}</dd>
              <dd aria-hidden="true">/</dd>
              <dt className="sr-only">Rating</dt>
              <dd>{ratingLabels[rating]}</dd>
            </dl>
          </div>

          <form className="mt-7 space-y-5" onSubmit={saveEntry}>
            <div>
              <label
                className="mb-2 block text-[13px] font-extrabold text-black/55"
                htmlFor="detail-watched-date"
              >
                Watched date
              </label>
              <input
                id="detail-watched-date"
                type="date"
                value={watchedDate}
                className="h-12 w-full rounded-md bg-wrapper px-4 text-[16px] font-semibold outline-none focus:bg-wrapper-strong"
                onChange={(event) => setWatchedDate(event.target.value)}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-[13px] font-extrabold text-black/55"
                htmlFor="detail-platform"
              >
                Platform
              </label>
              <input
                id="detail-platform"
                type="text"
                value={platform}
                className="h-12 w-full rounded-md bg-wrapper px-4 text-[16px] font-semibold outline-none placeholder:text-black/30 focus:bg-wrapper-strong"
                placeholder="null"
                onChange={(event) => setPlatform(event.target.value)}
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-[13px] font-extrabold text-black/55">
                Rating
              </legend>
              <div className="grid grid-cols-3 gap-1 rounded-md bg-wrapper p-1">
                {ratingOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={rating === option.value}
                    className={`h-10 rounded-sm text-[14px] font-extrabold ${
                      rating === option.value
                        ? "bg-white text-accent shadow-[0_1px_6px_rgba(0,0,0,0.08)]"
                        : "text-black/45"
                    }`}
                    onClick={() => setRating(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {error ? (
              <p className="text-[13px] font-semibold text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <div className="space-y-3 pt-1">
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-extrabold text-white disabled:bg-black/15"
                disabled={saveState !== "idle"}
              >
                {saveState === "saving" ? "Saving" : "Save"}
              </button>

              <button
                type="button"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-wrapper text-[15px] font-extrabold text-black/55 disabled:text-black/25"
                disabled={saveState !== "idle"}
                onClick={deleteEntry}
              >
                <MaterialIcon name="delete" className="h-5 w-5" />
                {saveState === "deleting" ? "Deleting" : "Delete"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export function HistoryList({ movies }: { movies: HistoryMovie[] }) {
  const [selectedMovie, setSelectedMovie] = useState<HistoryMovie | null>(null);

  return (
    <>
      <div className="space-y-8">
        {movies.length === 0 ? (
          <div className="py-12 text-center text-[16px] text-black/55">
            No movies yet
          </div>
        ) : (
          movies.map((movie, index) => (
            <MovieListItem
              key={movie.id}
              movie={movie}
              index={index}
              onOpen={setSelectedMovie}
            />
          ))
        )}
      </div>

      {selectedMovie ? (
        <WatchedEntryDetailSheet
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      ) : null}
    </>
  );
}
