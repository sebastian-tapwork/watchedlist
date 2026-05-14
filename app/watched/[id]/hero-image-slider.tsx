"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";

type HeroImage = {
  src: string;
  alt: string;
};

export function HeroImageSlider({ images }: { images: HeroImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const getSlideIndex = useCallback(
    (element: HTMLDivElement) => {
      const slideWidth = element.clientWidth;

      if (slideWidth === 0) {
        return activeIndex;
      }

      return Math.min(
        images.length - 1,
        Math.max(0, Math.round(element.scrollLeft / slideWidth))
      );
    },
    [activeIndex, images.length]
  );

  const goToImage = useCallback(
    (index: number) => {
      const nextIndex = Math.min(images.length - 1, Math.max(0, index));
      const slider = sliderRef.current;

      setActiveIndex(nextIndex);

      if (!slider) {
        return;
      }

      slider.scrollTo({
        left: slider.clientWidth * nextIndex,
        behavior: "smooth",
      });
    },
    [images.length]
  );

  function updateActiveImage(element: HTMLDivElement) {
    setActiveIndex(getSlideIndex(element));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToImage(activeIndex - 1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToImage(activeIndex + 1);
    }
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="relative col-start-1 row-start-1 h-full w-full min-w-0 overflow-hidden">
      <div
        ref={sliderRef}
        aria-label="Movie images"
        aria-roledescription="carousel"
        className="flex h-full w-full min-w-0 touch-pan-x snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(event) => updateActiveImage(event.currentTarget)}
        onKeyDown={handleKeyDown}
        role="region"
        tabIndex={images.length > 1 ? 0 : -1}
      >
        {images.map((image, index) => (
          <div
            key={image.src}
            className="relative h-full min-w-0 basis-full shrink-0 snap-center snap-always"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={index === 0}
              sizes="100vw"
              draggable={false}
              className="pointer-events-none scale-105 object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 ? (
        <div
          aria-live="polite"
          className="absolute bottom-5 right-5 z-20 rounded-full bg-black/35 px-3 py-1 text-[12px] font-semibold leading-5 text-white/80 backdrop-blur-md"
        >
          {activeIndex + 1} / {images.length}
        </div>
      ) : null}
    </div>
  );
}
