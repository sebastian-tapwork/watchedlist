import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MaterialIcon,
  type MaterialIconName,
} from "@/src/components/material-icon";
import { supabase } from "../src/lib/supabase";
import { AddMovieSheet } from "./add-movie-sheet";

export const dynamic = "force-dynamic";

type MovieRating = "liked" | "okay" | "disliked";
type MovieMetadataItem = {
  label: string;
  value: string;
};

type MovieRow = {
  id: string;
  title: string | null;
  poster_url: string | null;
};

type WatchedEntryRow = {
  id: string;
  movie_id: string | null;
  watched_date: string | null;
  platform: string | null;
  rating: string | null;
  movies: MovieRow | MovieRow[] | null;
};

type HistoryMovie = {
  id: string;
  title: string;
  metadata: MovieMetadataItem[];
  rating: MovieRating;
  poster: string | null;
};

function getMetadataValue(value: string | null | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : null;
}

function getMovieMetadata({
  watchedDate,
  platform,
}: {
  watchedDate?: string | null;
  platform?: string | null;
}): MovieMetadataItem[] {
  const displayWatchedDate = getMetadataValue(watchedDate);
  const displayPlatform = getMetadataValue(platform);
  const metadata = [
    displayWatchedDate
      ? { label: "Watched on", value: displayWatchedDate }
      : null,
    displayPlatform ? { label: "Platform", value: displayPlatform } : null,
  ].filter((item): item is MovieMetadataItem => item !== null);

  return metadata.length > 0 ? metadata : [{ label: "Metadata", value: "null" }];
}

function getEntryMovie(movie: WatchedEntryRow["movies"]) {
  if (Array.isArray(movie)) {
    return movie[0] ?? null;
  }

  return movie;
}

function getMovieRating(value: string | null): MovieRating {
  return value === "liked" || value === "disliked" || value === "okay"
    ? value
    : "okay";
}

export default async function Home() {
  const [watchedEntriesResult, moviesResult] = await Promise.all([
    supabase
      .from("watched_entries")
      .select(
        "id, movie_id, watched_date, platform, rating, movies(id, title, poster_url)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("movies")
      .select("id, title, poster_url")
      .order("created_at", { ascending: false }),
  ]);

  if (watchedEntriesResult.error) {
    console.error(
      "Supabase error fetching watched entries:",
      watchedEntriesResult.error
    );
  }

  if (moviesResult.error) {
    console.error("Supabase error fetching movies:", moviesResult.error);
  }

  const watchedEntries = (watchedEntriesResult.data ?? []) as WatchedEntryRow[];
  const watchedMovieIds = new Set(
    watchedEntries
      .map((entry) => entry.movie_id)
      .filter((movieId): movieId is string => movieId !== null)
  );

  const entryMovies: HistoryMovie[] = watchedEntries.map((entry) => {
    const movie = getEntryMovie(entry.movies);

    return {
      id: entry.id,
      title: movie?.title ?? "Untitled",
      metadata: getMovieMetadata({
        watchedDate: entry.watched_date,
        platform: entry.platform,
      }),
      rating: getMovieRating(entry.rating),
      poster: getMetadataValue(movie?.poster_url),
    };
  });

  const legacyMovies: HistoryMovie[] = ((moviesResult.data ?? []) as MovieRow[])
    .filter((movie) => !watchedMovieIds.has(movie.id))
    .map((movie) => ({
      id: `movie-${movie.id}`,
      title: movie.title ?? "Untitled",
      metadata: getMovieMetadata({}),
      rating: "okay",
      poster: getMetadataValue(movie.poster_url),
    }));

  const movies = [...entryMovies, ...legacyMovies];

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

  return (
    <>
      <main className="min-h-dvh bg-white text-[15px] text-black">
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-32 pt-12 sm:px-8">
          <header>
            <h1 className="text-[32px] font-extrabold leading-[40px]">
              History
            </h1>
          </header>

          <section className="mt-11">
            <div className="space-y-8">
              {movies.length === 0 ? (
                <div className="py-12 text-center text-[16px] text-black/55">
                  No movies yet
                </div>
              ) : (
                movies.map((movie, index) => (
                  <article
                    key={movie.id}
                    className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4"
                  >
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
                              {metadataIndex > 0 ? (
                                <dd aria-hidden="true">/</dd>
                              ) : null}
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
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      <AddMovieSheet />

      <nav
        aria-label="Primary navigation"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-black/[0.035] bg-white/90 backdrop-blur-md"
      >
        <div className="mx-auto grid w-full max-w-[480px] grid-cols-2 px-6 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 sm:px-8">
          <Link
            href="/"
            aria-current="page"
            className="flex h-[52px] flex-col items-center justify-center gap-1 text-[12px] font-extrabold text-accent"
          >
            <MaterialIcon name="history" className="h-[21px] w-[21px]" />
            History
          </Link>
          <Link
            href="/friends"
            className="flex h-[52px] flex-col items-center justify-center gap-1 text-[12px] font-bold text-black/40"
          >
            <MaterialIcon name="groups" className="h-[21px] w-[21px]" />
            Friends
          </Link>
        </div>
      </nav>
    </>
  );
}
