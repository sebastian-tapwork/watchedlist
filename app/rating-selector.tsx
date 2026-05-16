"use client";

import { Heart, Meh, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { useState } from "react";

export type MovieRating = "liked" | "neutral" | "disliked";

type RatingOptionId = "crap" | "mediocre" | "great" | "awesome";

type RatingOption = {
  id: RatingOptionId;
  label: string;
  value: MovieRating;
  Icon: LucideIcon;
};

const ratingOptions: RatingOption[] = [
  { id: "crap", label: "Crap", value: "disliked", Icon: ThumbsDown },
  { id: "mediocre", label: "Mediocre", value: "neutral", Icon: Meh },
  { id: "great", label: "Great", value: "liked", Icon: ThumbsUp },
  { id: "awesome", label: "Awesome", value: "liked", Icon: Heart },
];

function getDefaultOptionId(value: MovieRating): RatingOptionId {
  if (value === "disliked") {
    return "crap";
  }

  if (value === "neutral") {
    return "mediocre";
  }

  return "great";
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
