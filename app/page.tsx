import Image from "next/image";
import Link from "next/link";
import { supabase } from "../src/lib/supabase";

const materialIconPaths = {
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  groups:
    "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3Zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z",
  history:
    "M13 3c-4.97 0-9 4.03-9 9H1l4 4.01L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.78-4.95-2.05l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9Zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8h-1.5Z",
  sentiment_neutral:
    "M9 14h6v1.5H9V14Zm-1.5-3C8.33 11 9 10.33 9 9.5S8.33 8 7.5 8 6 8.67 6 9.5 6.67 11 7.5 11Zm9 0c.83 0 1.5-.67 1.5-1.5S17.33 8 16.5 8 15 8.67 15 9.5s.67 1.5 1.5 1.5ZM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8Z",
  thumb_down:
    "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.58-6.59c.37-.36.59-.86.59-1.41V5c0-1.1-.9-2-2-2Zm4 0v12h4V3h-4Z",
  thumb_up:
    "M1 21h4V9H1v12Zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2Z",
} as const;

type MaterialIconName = keyof typeof materialIconPaths;
type MovieRating = "liked" | "okay" | "disliked";

function MaterialIcon({
  name,
  className,
}: {
  name: MaterialIconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d={materialIconPaths[name]} fill="currentColor" />
    </svg>
  );
}

export default async function Home() {
  const { data, error } = await supabase
    .from("movies")
    .select("title, poster_url")
    .order("id", { ascending: false });

  if (error) {
    console.error("Supabase error fetching movies:", error);
  }

  const movies = (data ?? []).map((row: any) => ({
    title: row.title ?? "",
    date: "",
    platform: "",
    rating: "okay" as MovieRating,
    poster: row.poster_url ?? "",
  }));

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
                    key={`${movie.title}-${movie.date}-${index}`}
                    className="grid grid-cols-[60px_minmax(0,1fr)] items-center gap-4"
                  >
                    <div className="relative h-[90px] w-[60px] overflow-hidden rounded-sm bg-wrapper">
                      <Image
                        src={movie.poster}
                        alt={`${movie.title} poster`}
                        fill
                        sizes="60px"
                        loading={index < 3 ? "eager" : "lazy"}
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <div className="min-w-0">
                      <h2 className="min-w-0 text-[20px] font-extrabold leading-[26px]">
                        {movie.title}
                      </h2>

                      <div className="mt-3 flex items-center justify-between gap-4">
                        <dl className="flex min-w-0 flex-wrap gap-x-2 gap-y-1 text-[14px] font-medium leading-5 text-black/55">
                          <dt className="sr-only">Watched on</dt>
                          <dd>{movie.date}</dd>
                          <dt className="sr-only">Platform</dt>
                          <dd aria-hidden="true">/</dd>
                          <dd>{movie.platform}</dd>
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

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto w-full max-w-[480px] px-6 sm:px-8">
        <button
          type="button"
          aria-label="Add movie"
          className="pointer-events-auto ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
        >
          <MaterialIcon name="add" className="h-9 w-9" />
        </button>
      </div>

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
