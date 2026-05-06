import { supabase } from "@/src/lib/supabase";

type MovieRating = "liked" | "okay" | "disliked";

type SaveWatchedEntryRequest = {
  tmdb_id?: unknown;
  title?: unknown;
  release_year?: unknown;
  poster_url?: unknown;
  watched_date?: unknown;
  platform?: unknown;
  rating?: unknown;
};

type MovieRecord = {
  id: string;
};

const validRatings = new Set<MovieRating>(["liked", "okay", "disliked"]);

function getOptionalText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
}

function getMovieRating(value: unknown): MovieRating {
  return typeof value === "string" && validRatings.has(value as MovieRating)
    ? (value as MovieRating)
    : "okay";
}

function getReleaseYear(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

async function findMovieByTmdbId(tmdbId: number) {
  return supabase
    .from("movies")
    .select("id")
    .eq("tmdb_id", tmdbId)
    .maybeSingle<MovieRecord>();
}

async function getOrCreateMovie(body: SaveWatchedEntryRequest) {
  if (typeof body.tmdb_id !== "number" || !Number.isInteger(body.tmdb_id)) {
    return { error: "A valid tmdb_id is required." };
  }

  const title = getOptionalText(body.title);

  if (!title) {
    return { error: "A title is required." };
  }

  const existingMovie = await findMovieByTmdbId(body.tmdb_id);

  if (existingMovie.error) {
    return { error: existingMovie.error.message };
  }

  if (existingMovie.data) {
    return { movieId: existingMovie.data.id };
  }

  const insertedMovie = await supabase
    .from("movies")
    .insert({
      tmdb_id: body.tmdb_id,
      title,
      release_year: getReleaseYear(body.release_year),
      poster_url: getOptionalText(body.poster_url),
    })
    .select("id")
    .single<MovieRecord>();

  if (!insertedMovie.error && insertedMovie.data) {
    return { movieId: insertedMovie.data.id };
  }

  const retryMovie = await findMovieByTmdbId(body.tmdb_id);

  if (retryMovie.error || !retryMovie.data) {
    return {
      error: insertedMovie.error?.message ?? "Unable to create movie.",
    };
  }

  return { movieId: retryMovie.data.id };
}

export async function POST(request: Request) {
  const body = (await request.json()) as SaveWatchedEntryRequest;
  const movie = await getOrCreateMovie(body);

  if ("error" in movie) {
    return Response.json({ error: movie.error }, { status: 400 });
  }

  const insertedEntry = await supabase
    .from("watched_entries")
    .insert({
      movie_id: movie.movieId,
      watched_date: getOptionalText(body.watched_date),
      platform: getOptionalText(body.platform),
      rating: getMovieRating(body.rating),
    })
    .select("id")
    .single<{ id: string }>();

  if (insertedEntry.error) {
    return Response.json(
      { error: insertedEntry.error.message },
      { status: 400 }
    );
  }

  return Response.json({ id: insertedEntry.data.id }, { status: 201 });
}
