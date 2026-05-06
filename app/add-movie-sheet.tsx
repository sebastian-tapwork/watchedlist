"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/src/components/material-icon";

type MovieRating = "liked" | "okay" | "disliked";

type MovieSearchResult = {
  tmdb_id: number;
  title: string;
  release_year: number | null;
  poster_url: string | null;
};

type SearchState = "idle" | "loading" | "success" | "error";
type SaveState = "idle" | "saving";

const ratingOptions: { value: MovieRating; label: string }[] = [
  { value: "liked", label: "Liked" },
  { value: "okay", label: "Okay" },
  { value: "disliked", label: "Disliked" },
];

function getReleaseYearLabel(releaseYear: number | null) {
  return releaseYear === null ? "null" : String(releaseYear);
}

export function AddMovieSheet() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(
    null
  );
  const [watchedDate, setWatchedDate] = useState("");
  const [platform, setPlatform] = useState("");
  const [rating, setRating] = useState<MovieRating>("okay");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!isOpen || selectedMovie || trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearchState("loading");
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/search-movies?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Search failed.");
        }

        const data = (await response.json()) as {
          results?: MovieSearchResult[];
        };

        setResults(data.results ?? []);
        setSearchState("success");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
        setSearchError("Search failed");
        setSearchState("error");
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query, selectedMovie]);

  function openSheet() {
    setIsOpen(true);
  }

  function resetFlow() {
    setQuery("");
    setResults([]);
    setSearchState("idle");
    setSearchError(null);
    setSelectedMovie(null);
    setWatchedDate("");
    setPlatform("");
    setRating("okay");
    setSaveState("idle");
    setSaveError(null);
  }

  function closeSheet() {
    setIsOpen(false);
    resetFlow();
  }

  function returnToSearch() {
    setSelectedMovie(null);
    setWatchedDate("");
    setPlatform("");
    setRating("okay");
    setSaveError(null);
  }

  function updateQuery(value: string) {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      setSearchState("idle");
    }
  }

  async function saveWatchedEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedMovie) {
      return;
    }

    setSaveState("saving");
    setSaveError(null);

    try {
      const response = await fetch("/api/watched-entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdb_id: selectedMovie.tmdb_id,
          title: selectedMovie.title,
          release_year: selectedMovie.release_year,
          poster_url: selectedMovie.poster_url,
          watched_date: watchedDate,
          platform,
          rating,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        throw new Error(data?.error ?? "Save failed.");
      }

      closeSheet();
      router.refresh();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Save failed");
      setSaveState("idle");
    }
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-24 z-30 mx-auto w-full max-w-[480px] px-6 sm:px-8">
        <button
          type="button"
          aria-label="Add movie"
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          onClick={openSheet}
        >
          <MaterialIcon name="add" className="h-9 w-9" />
        </button>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20">
          <button
            type="button"
            aria-label="Close add movie"
            className="absolute inset-0 cursor-default"
            onClick={closeSheet}
          />

          <section
            aria-labelledby="add-movie-title"
            aria-modal="true"
            className="relative z-10 w-full max-w-[480px] rounded-t-[28px] bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_60px_rgba(0,0,0,0.16)] sm:px-8"
            role="dialog"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-black/15" />

            <div className="mt-5 flex h-9 items-center justify-between">
              {selectedMovie ? (
                <button
                  type="button"
                  aria-label="Back to search"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-wrapper text-black/70"
                  onClick={returnToSearch}
                >
                  <MaterialIcon name="arrow_back" className="h-5 w-5" />
                </button>
              ) : (
                <span className="h-9 w-9" aria-hidden="true" />
              )}

              <h2
                id="add-movie-title"
                className="text-[18px] font-extrabold leading-6"
              >
                Add movie
              </h2>

              <button
                type="button"
                aria-label="Close add movie"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-wrapper text-black/70"
                onClick={closeSheet}
              >
                <MaterialIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[74dvh] overflow-y-auto pb-2">
              {selectedMovie ? (
                <form className="mt-6" onSubmit={saveWatchedEntry}>
                  <div className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4">
                    <div className="relative h-[90px] w-[60px] overflow-hidden rounded-sm bg-wrapper">
                      {selectedMovie.poster_url ? (
                        <Image
                          src={selectedMovie.poster_url}
                          alt={`${selectedMovie.title} poster`}
                          fill
                          sizes="60px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-[20px] font-extrabold leading-[26px]">
                        {selectedMovie.title}
                      </h3>
                      <p className="mt-2 text-[14px] font-medium leading-5 text-black/55">
                        {getReleaseYearLabel(selectedMovie.release_year)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label
                        className="mb-2 block text-[13px] font-extrabold text-black/55"
                        htmlFor="watched-date"
                      >
                        Watched date
                      </label>
                      <input
                        id="watched-date"
                        type="date"
                        value={watchedDate}
                        className="h-12 w-full rounded-md bg-wrapper px-4 text-[16px] font-semibold outline-none focus:bg-wrapper-strong"
                        onChange={(event) => setWatchedDate(event.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        className="mb-2 block text-[13px] font-extrabold text-black/55"
                        htmlFor="platform"
                      >
                        Platform
                      </label>
                      <input
                        id="platform"
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

                    {saveError ? (
                      <p
                        className="text-[13px] font-semibold text-red-600"
                        role="alert"
                      >
                        {saveError}
                      </p>
                    ) : null}

                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-extrabold text-white disabled:bg-black/15"
                      disabled={saveState === "saving"}
                    >
                      {saveState === "saving" ? "Saving" : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mt-6 flex h-12 items-center gap-3 rounded-full bg-wrapper px-4">
                    <MaterialIcon
                      name="search"
                      className="h-5 w-5 shrink-0 text-black/35"
                    />
                    <label className="sr-only" htmlFor="movie-search">
                      Search movies
                    </label>
                    <input
                      id="movie-search"
                      type="search"
                      value={query}
                      autoFocus
                      className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold outline-none placeholder:text-black/30"
                      placeholder="Search"
                      onChange={(event) => updateQuery(event.target.value)}
                    />
                  </div>

                  <div className="mt-5 space-y-1">
                    {searchState === "loading" ? (
                      <p className="py-6 text-center text-[14px] font-medium text-black/45">
                        Searching
                      </p>
                    ) : null}

                    {searchError ? (
                      <p
                        className="py-6 text-center text-[14px] font-medium text-red-600"
                        role="alert"
                      >
                        {searchError}
                      </p>
                    ) : null}

                    {searchState === "success" && results.length === 0 ? (
                      <p className="py-6 text-center text-[14px] font-medium text-black/45">
                        No results
                      </p>
                    ) : null}

                    {results.map((movie) => (
                      <button
                        key={movie.tmdb_id}
                        type="button"
                        className="grid w-full grid-cols-[44px_minmax(0,1fr)] items-center gap-3 rounded-md py-2 text-left"
                        onClick={() => setSelectedMovie(movie)}
                      >
                        <div className="relative h-[66px] w-[44px] overflow-hidden rounded-sm bg-wrapper">
                          {movie.poster_url ? (
                            <Image
                              src={movie.poster_url}
                              alt={`${movie.title} poster`}
                              fill
                              sizes="44px"
                              className="object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-[16px] font-extrabold leading-5">
                            {movie.title}
                          </h3>
                          <p className="mt-1 text-[13px] font-medium text-black/55">
                            {getReleaseYearLabel(movie.release_year)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
