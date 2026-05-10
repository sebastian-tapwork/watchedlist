type TmdbVideoResult = {
  key?: string;
  name?: string;
  official?: boolean;
  published_at?: string;
  site?: string;
  type?: string;
};

type MovieTrailer = {
  key: string;
  name: string;
  thumbnail_url: string;
  url: string;
};

function isBearerToken(apiKey: string) {
  return apiKey.split(".").length === 3;
}

function getPublishedTime(video: TmdbVideoResult) {
  const time = video.published_at ? Date.parse(video.published_at) : 0;

  return Number.isFinite(time) ? time : 0;
}

function getTrailerScore(video: TmdbVideoResult) {
  let score = 0;
  const name = video.name?.toLowerCase() ?? "";

  if (video.official) {
    score += 40;
  }

  if (video.type === "Trailer") {
    score += 30;
  } else if (video.type === "Teaser") {
    score += 10;
  }

  if (name.includes("trailer")) {
    score += 5;
  }

  return score;
}

function getBestTrailer(videos: TmdbVideoResult[]): MovieTrailer | null {
  const trailer = videos
    .filter(
      (video) =>
        video.site === "YouTube" &&
        typeof video.key === "string" &&
        video.key.trim()
    )
    .map((video, index) => ({ index, video }))
    .sort((a, b) => {
      const scoreDifference =
        getTrailerScore(b.video) - getTrailerScore(a.video);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const timeDifference =
        getPublishedTime(b.video) - getPublishedTime(a.video);

      return timeDifference || a.index - b.index;
    })[0]?.video;

  const key = trailer?.key?.trim();

  if (!key) {
    return null;
  }

  return {
    key,
    name: trailer.name?.trim() || "Trailer",
    thumbnail_url: `https://i.ytimg.com/vi/${key}/hqdefault.jpg`,
    url: `https://www.youtube.com/watch?v=${key}`,
  };
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  const { searchParams } = new URL(request.url);
  const tmdbId = Number(searchParams.get("tmdb_id"));

  if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
    return Response.json(
      { error: "A valid tmdb_id is required." },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return Response.json(
      { error: "TMDB_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}/videos`);
  url.searchParams.set("language", "en-US");

  const headers = new Headers();

  if (isBearerToken(apiKey)) {
    headers.set("Authorization", `Bearer ${apiKey}`);
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store", headers });
  } catch {
    return Response.json(
      { error: "Unable to load trailer." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    return Response.json(
      { error: "Unable to load trailer." },
      { status: response.status }
    );
  }

  const data = (await response.json()) as { results?: TmdbVideoResult[] };

  return Response.json({ trailer: getBestTrailer(data.results ?? []) });
}
