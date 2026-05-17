export const movieRatingValues = [
  "crap",
  "mediocre",
  "great",
  "awesome",
] as const;

export type MovieRating = (typeof movieRatingValues)[number];

export const DEFAULT_MOVIE_RATING: MovieRating = "great";

export const movieRatingLabels: Record<MovieRating, string> = {
  crap: "Crap",
  mediocre: "Mediocre",
  great: "Great",
  awesome: "Awesome",
};

export function isMovieRating(value: unknown): value is MovieRating {
  return (
    typeof value === "string" &&
    movieRatingValues.includes(value as MovieRating)
  );
}

export function getMovieRating(value: unknown): MovieRating {
  return isMovieRating(value) ? value : DEFAULT_MOVIE_RATING;
}
