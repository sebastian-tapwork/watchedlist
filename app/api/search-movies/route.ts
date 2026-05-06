type TmdbMovieResult = {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  poster_path?: string | null;
};

const TMDB_POSTER_BASE_URL = "https://image.tmdb.org/t/p/w500";

function isBearerToken(apiKey: string) {
  return apiKey.split(".").length === 3;
}

function getReleaseYear(releaseDate: string | undefined) {
  if (!releaseDate) {
    return null;
  }

  const year = Number(releaseDate.slice(0, 4));

  return Number.isInteger(year) ? year : null;
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return Response.json({ results: [] });
  }

  if (!apiKey) {
    return Response.json(
      { error: "TMDB_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const headers = new Headers();

  if (isBearerToken(apiKey)) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  const response = await fetch(url, { cache: "no-store", headers });

  if (!response.ok) {
    return Response.json(
      { error: "Unable to search movies." },
      { status: response.status }
    );
  }

  const data = (await response.json()) as { results?: TmdbMovieResult[] };
  const results = (data.results ?? []).map((movie) => ({
    tmdb_id: movie.id,
    title: movie.title ?? movie.name ?? "Untitled",
    release_year: getReleaseYear(movie.release_date),
    poster_url: movie.poster_path
      ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}`
      : null,
  }));

  return Response.json({ results });
}
