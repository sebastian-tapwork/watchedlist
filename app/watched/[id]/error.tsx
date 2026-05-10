"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MaterialIcon } from "@/src/components/material-icon";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-16 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
        <Link
          href="/"
          aria-label="Back to history"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-wrapper text-black/70"
        >
          <MaterialIcon name="arrow_back" className="h-5 w-5" />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="text-[13px] font-extrabold uppercase tracking-[0.12em] text-black/35">
            Could not load
          </p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[42px]">
            The detail page needs another try.
          </h1>
          <p className="mt-5 max-w-[300px] text-[16px] font-medium leading-7 text-black/50">
            The movie entry is still safe. Refresh the detail page or return to
            History.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-[14px] font-extrabold text-white"
              onClick={() => unstable_retry()}
            >
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full bg-wrapper px-5 text-[14px] font-extrabold text-black/60"
            >
              History
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
