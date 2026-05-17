import Link from "next/link";
import { MaterialIcon } from "@/src/components/material-icon";
import { supabase } from "../src/lib/supabase";
import { AddMovieSheet } from "./add-movie-sheet";
import { HistoryList, type HistoryMovie } from "./history-list";
import { DEFAULT_MOVIE_RATING, getMovieRating } from "./movie-ratings";

export const dynamic = "force-dynamic";

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
    const watchedDate = getMetadataValue(entry.watched_date);
    const platform = getMetadataValue(entry.platform);

    return {
      id: entry.id,
      watchedEntryId: entry.id,
      title: movie?.title ?? "Untitled",
      metadata: getMovieMetadata({
        watchedDate,
        platform,
      }),
      rating: getMovieRating(entry.rating),
      poster: getMetadataValue(movie?.poster_url),
      watchedDate,
      platform,
    };
  });

  const legacyMovies: HistoryMovie[] = ((moviesResult.data ?? []) as MovieRow[])
    .filter((movie) => !watchedMovieIds.has(movie.id))
    .map((movie) => ({
      id: `movie-${movie.id}`,
      watchedEntryId: null,
      title: movie.title ?? "Untitled",
      metadata: getMovieMetadata({}),
      rating: DEFAULT_MOVIE_RATING,
      poster: getMetadataValue(movie.poster_url),
      watchedDate: null,
      platform: null,
    }));

  const movies = [...entryMovies, ...legacyMovies];

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
            <HistoryList movies={movies} />
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
