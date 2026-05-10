"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MaterialIcon } from "@/src/components/material-icon";

type MovieTrailer = {
  key: string;
  name: string;
  thumbnail_url: string;
};

export function TrailerSection({ tmdbId }: { tmdbId: number | null }) {
  const [trailer, setTrailer] = useState<MovieTrailer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (tmdbId === null) {
      return;
    }

    const controller = new AbortController();

    async function loadTrailer() {
      try {
        const response = await fetch(`/api/movie-trailer?tmdb_id=${tmdbId}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          trailer?: MovieTrailer | null;
        };

        setTrailer(data.trailer ?? null);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    loadTrailer();

    return () => controller.abort();
  }, [tmdbId]);

  if (!trailer) {
    return null;
  }

  const embedUrl = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(
    trailer.key
  )}?rel=0`;

  return (
    <section className="mt-14 border-t border-black/[0.06] pt-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h2 className="text-[18px] font-extrabold leading-6">Trailer</h2>
          <p className="mt-2 text-[14px] font-medium leading-5 text-black/45">
            A small preview.
          </p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md bg-black">
        {isPlaying ? (
          <iframe
            title={trailer.name}
            src={embedUrl}
            className="aspect-video w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            aria-label={`Play ${trailer.name}`}
            className="group relative block aspect-video w-full overflow-hidden bg-black text-white"
            onClick={() => setIsPlaying(true)}
          >
            <Image
              src={trailer.thumbnail_url}
              alt=""
              fill
              sizes="(max-width: 480px) 100vw, 480px"
              className="object-cover opacity-80 transition-opacity group-hover:opacity-90"
            />
            <span className="absolute inset-0 bg-black/25" />
            <span className="absolute inset-x-4 bottom-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black/80">
                <MaterialIcon name="play_arrow" className="h-6 w-6" />
              </span>
              <span className="text-left text-[14px] font-extrabold leading-5 text-white">
                Watch trailer
              </span>
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
