import Link from "next/link";
import { MaterialIcon } from "@/src/components/material-icon";

export default function NotFound() {
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
            Watched entry
          </p>
          <h1 className="mt-4 text-[36px] font-extrabold leading-[42px]">
            This entry is no longer here.
          </h1>
          <p className="mt-5 max-w-[300px] text-[16px] font-medium leading-7 text-black/50">
            It may have been deleted, or the link may not match a saved movie.
          </p>

          <Link
            href="/"
            className="mt-10 inline-flex h-11 w-fit items-center justify-center rounded-full bg-accent px-5 text-[14px] font-extrabold text-white"
          >
            Back to History
          </Link>
        </div>
      </section>
    </main>
  );
}
