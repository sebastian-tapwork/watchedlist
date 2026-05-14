"use client";

import { useState } from "react";
import Image from "next/image";

type HeroImage = {
  src: string;
  alt: string;
};

export function HeroImageSlider({ images }: { images: HeroImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function updateActiveImage(element: HTMLDivElement) {
    const slideWidth = element.clientWidth;

    if (slideWidth === 0) {
      return;
    }

    setActiveIndex(
      Math.min(images.length - 1, Math.round(element.scrollLeft / slideWidth))
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
        onScroll={(event) => updateActiveImage(event.currentTarget)}
      >
        {images.map((image, index) => (
          <div
            key={image.src}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="scale-105 object-cover opacity-35"
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <div className="absolute bottom-5 right-5 z-20 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold leading-5 text-white/80 backdrop-blur-md">
          {activeIndex + 1} / {images.length}
        </div>
      ) : null}
    </>
  );
}
