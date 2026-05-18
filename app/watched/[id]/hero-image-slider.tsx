"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import Image from "next/image";

type HeroImage = {
  src: string;
  alt: string;
};

type SwipeGesture = "pending" | "horizontal" | "vertical";

export function HeroImageSlider({ images }: { images: HeroImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const gestureRef = useRef<SwipeGesture | null>(null);

  useEffect(() => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    function updateSlideWidth() {
      setSlideWidth(slider?.clientWidth ?? 0);
    }

    updateSlideWidth();

    const resizeObserver = new ResizeObserver(updateSlideWidth);
    resizeObserver.observe(slider);

    return () => resizeObserver.disconnect();
  }, []);

  const goToImage = useCallback(
    (index: number) => {
      const nextIndex = Math.min(images.length - 1, Math.max(0, index));

      setActiveIndex(nextIndex);
      setDragOffset(0);
    },
    [images.length]
  );

  function getConstrainedDragOffset(deltaX: number) {
    const isPullingBeforeFirst = activeIndex === 0 && deltaX > 0;
    const isPullingPastLast = activeIndex === images.length - 1 && deltaX < 0;

    return isPullingBeforeFirst || isPullingPastLast ? deltaX * 0.35 : deltaX;
  }

  function finishDrag(deltaX: number) {
    const threshold = Math.min(80, Math.max(36, slideWidth * 0.2));

    setIsDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
    gestureRef.current = null;

    if (deltaX <= -threshold) {
      goToImage(activeIndex + 1);
      return;
    }

    if (deltaX >= threshold) {
      goToImage(activeIndex - 1);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || images.length < 2) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    gestureRef.current = "pending";
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    setIsDragging(false);
    setDragOffset(0);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId || !gestureRef.current) {
      return;
    }

    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (gestureRef.current === "pending") {
      if (absX < 8 && absY < 8) {
        return;
      }

      if (absY > absX) {
        gestureRef.current = "vertical";
        setIsDragging(false);
        setDragOffset(0);
        return;
      }

      if (absX < 10 || absX < absY * 1.35) {
        return;
      }

      gestureRef.current = "horizontal";
      setIsDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (gestureRef.current !== "horizontal") {
      return;
    }

    event.preventDefault();
    setDragOffset(getConstrainedDragOffset(deltaX));
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    if (gestureRef.current === "horizontal") {
      event.preventDefault();
      finishDrag(event.clientX - startXRef.current);
      return;
    }

    setIsDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
    gestureRef.current = null;
  }

  function handlePointerCancel() {
    setIsDragging(false);
    setDragOffset(0);
    pointerIdRef.current = null;
    gestureRef.current = null;
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

  const trackOffset = dragOffset - activeIndex * slideWidth;

  return (
    <div className="relative col-start-1 row-start-1 h-full w-full max-w-full min-w-0 overflow-hidden">
      <div
        ref={sliderRef}
        aria-label="Movie images"
        aria-roledescription="carousel"
        className="h-full w-full max-w-full min-w-0 touch-pan-y overflow-hidden"
        onKeyDown={handleKeyDown}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="region"
        tabIndex={images.length > 1 ? 0 : -1}
      >
        <div
          className="flex h-full will-change-transform"
          style={{
            transform: `translate3d(${trackOffset}px, 0, 0)`,
            transition: isDragging
              ? "none"
              : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.src}
              className="relative h-full w-full shrink-0"
              style={{ width: slideWidth || "100%" }}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                preload={index === 0}
                sizes="(max-width: 480px) 100vw, 480px"
                draggable={false}
                className="pointer-events-none select-none scale-105 object-cover"
              />
            </div>
          ))}
        </div>
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
