"use client";

import { Heart, Meh, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { useState } from "react";
import {
  getMovieRating,
  movieRatingLabels,
  type MovieRating,
} from "./movie-ratings";

export type { MovieRating };

type RatingOptionId = "crap" | "mediocre" | "great" | "awesome";

type RatingOption = {
  id: RatingOptionId;
  label: string;
  value: MovieRating;
  Icon: LucideIcon;
};

const ratingOptions: RatingOption[] = [
  {
    id: "crap",
    label: movieRatingLabels.crap,
    value: "crap",
    Icon: ThumbsDown,
  },
  {
    id: "mediocre",
    label: movieRatingLabels.mediocre,
    value: "mediocre",
    Icon: Meh,
  },
  {
    id: "great",
    label: movieRatingLabels.great,
    value: "great",
    Icon: ThumbsUp,
  },
  {
    id: "awesome",
    label: movieRatingLabels.awesome,
    value: "awesome",
    Icon: Heart,
  },
];

function getDefaultOptionId(value: MovieRating): RatingOptionId {
  return getMovieRating(value);
}

export function RatingSelector({
  value,
  onChange,
}: {
  value: MovieRating;
  onChange: (value: MovieRating) => void;
}) {
  const [activeOptionId, setActiveOptionId] = useState<RatingOptionId>(
    getDefaultOptionId(value)
  );

  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-extrabold text-black/55">
        Rating
      </legend>
      <div className="grid grid-cols-4 gap-1 rounded-md bg-wrapper p-1">
        {ratingOptions.map(({ id, label, value: optionValue, Icon }) => {
          const isSelected = activeOptionId === id;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isSelected}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-sm text-sm font-semibold leading-none transition-colors ${
                isSelected
                  ? "bg-white text-accent shadow-[0_1px_6px_rgba(0,0,0,0.08)]"
                  : "text-black/35"
              }`}
              onClick={() => {
                setActiveOptionId(id);
                onChange(optionValue);
              }}
            >
              <Icon aria-hidden="true" size={20} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
