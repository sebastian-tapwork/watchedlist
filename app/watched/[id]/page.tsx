import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MaterialIcon,
  type MaterialIconName,
} from "@/src/components/material-icon";
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
const HERO_IMAGE_LIMIT = 5;

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
  movies: MovieRow | MovieRow[] | null;
};

type TmdbImageResult = {
  file_path?: string | null;
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

function getWatchedMetadata({
  watchedDate,
  platform,
}: {
  watchedDate: string | null;
  platform: string | null;
}) {
  const metadata = [
    watchedDate ? { label: "Watched", value: watchedDate } : null,
    platform ? { label: "Where", value: platform } : null,
  ].filter((item): item is MetadataItem => item !== null);

  return metadata.length > 0 ? metadata : [{ label: "Metadata", value: "null" }];
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

const ratingIcons: Record<MovieRating, MaterialIconName> = {
  liked: "thumb_up",
  neutral: "sentiment_neutral",
  disliked: "thumb_down",
};

function isBearerToken(apiKey: string) {
  return apiKey.split(".").length === 3;
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
      .slice(0, HERO_IMAGE_LIMIT)
      .map((src) => ({ src, alt: `${title} image` }));

    return backdropImages.length > 0 ? backdropImages : fallbackImages;
  } catch {
    return fallbackImages;
  }
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

  const { data, error } = await supabase
    .from("watched_entries")
    .select(
      "id, watched_date, platform, rating, movies(id, tmdb_id, title, poster_url, release_year)"
    )
    .eq("id", id)
    .maybeSingle<WatchedEntryRow>();

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
  const watchedMetadata = getWatchedMetadata({ watchedDate, platform });
  const heroImages = await getHeroImages({
    tmdbId: movie?.tmdb_id,
    fallbackImage: poster,
    title,
  });
  const editMovie: WatchedEntryEditMovie = {
    watchedEntryId: data.id,
    title,
    releaseYear: movie?.release_year ?? null,
    poster,
    watchedDate,
    platform,
    rating,
  };

  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="relative h-[42dvh] min-h-[300px] w-full overflow-hidden bg-black text-white">
        <HeroImageSlider images={heroImages} />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.52)_55%,rgba(0,0,0,0.86))]" />

        <div className="relative z-20 mx-auto flex h-full w-full max-w-[480px] flex-col px-6 pb-8 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Back to history"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-black/55 backdrop-blur-md"
            >
              <MaterialIcon name="arrow_back" className="h-[18px] w-[18px]" />
            </Link>

            <EditWatchedEntryAction movie={editMovie} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[480px] px-6 pb-20 pt-12 sm:px-8">
        <h1 className="text-[48px] font-extrabold leading-[52px]">{title}</h1>

        <dl className="mt-9 space-y-4 text-[15px] leading-6">
          {watchedMetadata.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-6"
            >
              <dt className="font-normal text-black/30">{item.label}</dt>
              <dd className="font-bold text-black/70">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex items-center gap-3 text-black/55">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-wrapper text-accent/80"
            aria-hidden="true"
          >
            <MaterialIcon
              name={ratingIcons[rating]}
              className="h-[18px] w-[18px]"
            />
          </span>
          <div>
            <p className="text-[12px] font-normal uppercase tracking-[0.12em] text-black/35">
              Personal rating
            </p>
            <p className="mt-1 text-[16px] font-semibold text-black/70">
              {ratingLabels[rating]}
            </p>
          </div>
        </div>

        <section className="mt-16 border-t border-black/[0.06] pt-10">
          <h2 className="text-[18px] font-extrabold leading-6">
            Personal note
          </h2>
          <p className="mt-5 text-[16px] font-normal leading-8 text-black/50">
            No note yet.
          </p>
        </section>

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
