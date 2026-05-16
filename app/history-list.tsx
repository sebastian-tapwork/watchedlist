import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Meh, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";

type MovieRating = "liked" | "neutral" | "disliked";
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

const ratingIcons: Record<MovieRating, LucideIcon> = {
  liked: ThumbsUp,
  neutral: Meh,
  disliked: ThumbsDown,
};

const ratingLabels: Record<MovieRating, string> = {
  liked: "Great",
  neutral: "Mediocre",
  disliked: "Crap",
};

function MovieListItem({
  movie,
  index,
}: {
  movie: HistoryMovie;
  index: number;
}) {
  const RatingIcon = ratingIcons[movie.rating];
  const content = (
    <>
      <div className="relative h-24 w-16 overflow-hidden rounded-sm bg-wrapper">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={`${movie.title} poster`}
            fill
            sizes="64px"
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
            className="flex h-6 w-6 shrink-0 items-center justify-center text-black/55"
            role="img"
          >
            <RatingIcon aria-hidden="true" size={20} strokeWidth={2} />
          </span>
        </div>
      </div>
    </>
  );

  return (
    <article>
      {movie.watchedEntryId ? (
        <Link
          className="grid touch-manipulation grid-cols-[64px_minmax(0,1fr)] items-center gap-4 text-left"
          href={`/watched/${movie.watchedEntryId}`}
        >
          {content}
        </Link>
      ) : (
        <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4">
          {content}
        </div>
      )}
    </article>
  );
}

export function HistoryList({ movies }: { movies: HistoryMovie[] }) {
  return (
    <div className="space-y-8">
      {movies.length === 0 ? (
        <div className="py-12 text-center text-[16px] text-black/55">
          No movies yet
        </div>
      ) : (
        movies.map((movie, index) => (
          <MovieListItem key={movie.id} movie={movie} index={index} />
        ))
      )}
    </div>
  );
}
