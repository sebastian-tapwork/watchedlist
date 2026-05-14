import Link from "next/link";
import { notFound } from "next/navigation";
import { MaterialIcon } from "@/src/components/material-icon";
import { supabase } from "@/src/lib/supabase";
import { EditWatchedEntryAction } from "./edit-action";
import { HeroImageSlider } from "./hero-image-slider";
import type {
  MovieRating,
  WatchedEntryEditMovie,
} from "../../watched-entry-edit-sheet";

export const dynamic = "force-dynamic";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TMDB_BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w780";
const MOVIE_KEYWORD_LIMIT = 5;
const WATCHED_ENTRY_SELECT_WITH_WORDS =
  "id, watched_date, platform, rating, words, movies(id, tmdb_id, title, poster_url, release_year)";
const WATCHED_ENTRY_SELECT =
  "id, watched_date, platform, rating, movies(id, tmdb_id, title, poster_url, release_year)";

type MovieRow = {
  id: string;
  tmdb_id: number | null;
  title: string | null;
  poster_url: string | null;
  release_year: number | null;
};

type MetadataItem = {
  label: string;
  value: string;
};

type WatchedEntryRow = {
  id: string;
  watched_date: string | null;
  platform: string | null;
  rating: string | null;
  words?: string | null;
  movies: MovieRow | MovieRow[] | null;
};

type TmdbImageResult = {
  file_path?: string | null;
};

type TmdbKeywordResult = {
  name?: string | null;
};

function getEntryMovie(movie: WatchedEntryRow["movies"]) {
  if (Array.isArray(movie)) {
    return movie[0] ?? null;
  }

  return movie;
}

function getDisplayValue(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return String(value);
  }

  return value?.trim() ? value : "null";
}

function getMovieRating(value: string | null): MovieRating {
  return value === "liked" || value === "disliked" || value === "neutral"
    ? value
    : "neutral";
}

const ratingLabels: Record<MovieRating, string> = {
  liked: "Liked",
  neutral: "Okay",
  disliked: "Disliked",
};

function isBearerToken(apiKey: string) {
  return apiKey.split(".").length === 3;
}

function isMissingWordsColumnError(error: { code?: string; message?: string }) {
  return (
    error.code === "42703" &&
    Boolean(
      error.message?.includes("watched_entries.words") ||
        error.message?.includes("words")
    )
  );
}

function getWatchedMetadata({
  watchedDate,
  platform,
  rating,
  words,
}: {
  watchedDate: string | null;
  platform: string | null;
  rating: MovieRating;
  words: string | null;
}) {
  return [
    watchedDate ? { label: "Watched", value: watchedDate } : null,
    platform ? { label: "Where", value: platform } : null,
    { label: "Rating", value: ratingLabels[rating] },
    words ? { label: "Words", value: words } : null,
  ].filter((item): item is MetadataItem => item !== null);
}

async function getHeroImages({
  tmdbId,
  fallbackImage,
  title,
}: {
  tmdbId: number | null | undefined;
  fallbackImage: string | null;
  title: string;
}) {
  const fallbackImages = fallbackImage ? [{ src: fallbackImage, alt: "" }] : [];
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || !tmdbId) {
    return fallbackImages;
  }

  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/images`);
  url.searchParams.set("include_image_language", "en,null");

  const headers = new Headers();

  if (isBearerToken(apiKey)) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  try {
    const response = await fetch(url, { cache: "no-store", headers });

    if (!response.ok) {
      return fallbackImages;
    }

    const data = (await response.json()) as {
      backdrops?: TmdbImageResult[];
    };
    const seenImageUrls = new Set<string>();
    const backdropImages = (data.backdrops ?? [])
      .map((image) => image.file_path?.trim())
      .filter((filePath): filePath is string => Boolean(filePath))
      .map((filePath) => `${TMDB_BACKDROP_BASE_URL}${filePath}`)
      .filter((src) => {
        if (seenImageUrls.has(src)) {
          return false;
        }

        seenImageUrls.add(src);
        return true;
      })
      .map((src) => ({ src, alt: `${title} image` }));

    return backdropImages.length > 0 ? backdropImages : fallbackImages;
  } catch {
    return fallbackImages;
  }
}

async function getMovieKeywords(tmdbId: number | null | undefined) {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey || !tmdbId) {
    return [];
  }

  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/keywords`);
  const headers = new Headers();

  if (isBearerToken(apiKey)) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  try {
    const response = await fetch(url, { cache: "no-store", headers });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      keywords?: TmdbKeywordResult[];
    };
    const keywords = Array.isArray(data.keywords) ? data.keywords : [];
    const seenKeywords = new Set<string>();

    // TODO: Replace these with IMDb plot keywords sorted by helpful ratings if a reliable data source becomes available.
    return keywords
      .map((keyword) => keyword.name?.trim())
      .filter((name): name is string => Boolean(name))
      .filter((name) => {
        const key = name.toLocaleLowerCase();

        if (seenKeywords.has(key)) {
          return false;
        }

        seenKeywords.add(key);
        return true;
      })
      .slice(0, MOVIE_KEYWORD_LIMIT);
  } catch {
    return [];
  }
}

async function getWatchedEntry(id: string) {
  const result = await supabase
    .from("watched_entries")
    .select(WATCHED_ENTRY_SELECT_WITH_WORDS)
    .eq("id", id)
    .maybeSingle<WatchedEntryRow>();

  if (!result.error || !isMissingWordsColumnError(result.error)) {
    return result;
  }

  return supabase
    .from("watched_entries")
    .select(WATCHED_ENTRY_SELECT)
    .eq("id", id)
    .maybeSingle<WatchedEntryRow>();
}

export default async function WatchedEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const { data, error } = await getWatchedEntry(id);

  if (error) {
    console.error("Supabase error fetching watched entry:", error);
    throw new Error("Unable to load watched entry.");
  }

  if (!data) {
    notFound();
  }

  const movie = getEntryMovie(data.movies);
  const title = movie?.title ?? "Untitled";
  const poster = movie?.poster_url?.trim() ? movie.poster_url : null;
  const watchedDate = data.watched_date?.trim() ? data.watched_date : null;
  const platform = data.platform?.trim() ? data.platform : null;
  const rating = getMovieRating(data.rating);
  const words = data.words?.trim() ? data.words : null;
  const watchedMetadata = getWatchedMetadata({
    watchedDate,
    platform,
    rating,
    words,
  });
  const [heroImages, movieKeywords] = await Promise.all([
    getHeroImages({
      tmdbId: movie?.tmdb_id,
      fallbackImage: poster,
      title,
    }),
    getMovieKeywords(movie?.tmdb_id),
  ]);
  const editMovie: WatchedEntryEditMovie = {
    watchedEntryId: data.id,
    title,
    releaseYear: movie?.release_year ?? null,
    poster,
    watchedDate,
    platform,
    rating,
    words,
  };

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] bg-white text-black">
      <section className="grid aspect-video w-full overflow-hidden bg-black text-white">
        <HeroImageSlider images={heroImages} />

        <div className="pointer-events-none col-start-1 row-start-1 z-20 mx-auto flex h-full w-full max-w-[480px] flex-col px-6 pb-8 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Back to history"
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-black/55 backdrop-blur-md"
            >
              <MaterialIcon name="arrow_back" className="h-[18px] w-[18px]" />
            </Link>

            <div className="pointer-events-auto">
              <EditWatchedEntryAction movie={editMovie} />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[480px] px-6 pb-20 pt-12 sm:px-8">
        <h1 className="text-[48px] font-extrabold leading-[52px]">{title}</h1>

        {movieKeywords.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2">
            {movieKeywords.map((keyword) => (
              <li
                key={keyword}
                className="rounded-full bg-wrapper px-3 py-1 text-[13px] font-semibold leading-5 text-black/45"
              >
                {keyword}
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="mt-9 space-y-4 text-[15px] leading-6">
          {watchedMetadata.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-6"
            >
              <dt className="font-normal text-black/30">{item.label}</dt>
              <dd className="min-w-0 whitespace-pre-line text-right font-bold text-black/70">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-14 border-t border-black/[0.06] pt-10">
          <h2 className="text-[18px] font-extrabold leading-6">
            Friends who liked it
          </h2>
          <p className="mt-5 text-[16px] font-normal leading-8 text-black/50">
            Friends will appear here later.
          </p>
        </section>

        <section className="mt-14 border-t border-black/[0.06] pt-10">
          <h2 className="text-[18px] font-extrabold leading-6">
            Movie information
          </h2>
          <dl className="mt-6 space-y-4 text-[15px] leading-6">
            <div className="flex items-center justify-between gap-6">
              <dt className="font-normal text-black/30">Release year</dt>
              <dd className="font-bold text-black/70">
                {getDisplayValue(movie?.release_year)}
              </dd>
            </div>
          </dl>
        </section>
      </section>
    </main>
  );
}
