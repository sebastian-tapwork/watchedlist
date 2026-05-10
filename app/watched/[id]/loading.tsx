export default function Loading() {
  return (
    <main className="min-h-dvh bg-white text-black">
      <section className="relative h-[42dvh] min-h-[300px] w-full overflow-hidden bg-black text-white">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.52)_55%,rgba(0,0,0,0.86))]" />

        <div className="relative mx-auto flex h-full w-full max-w-[480px] flex-col justify-between px-6 pb-8 pt-[max(18px,env(safe-area-inset-top))] sm:px-8">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-full bg-white/20" />
            <div className="h-9 w-16 rounded-full bg-white/20" />
          </div>

          <div>
            <div className="h-16 w-16 rounded-full border border-white/15 bg-white/10" />
            <div className="mt-4 h-4 w-48 rounded-full bg-white/15" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[480px] px-6 pb-16 pt-10 sm:px-8">
        <div className="h-12 w-3/4 rounded-md bg-wrapper" />
        <div className="mt-5 h-5 w-40 rounded-full bg-wrapper" />
        <div className="mt-9 h-10 w-44 rounded-full bg-wrapper" />

        <div className="mt-14 border-t border-black/[0.06] pt-8">
          <div className="h-6 w-36 rounded-full bg-wrapper" />
          <div className="mt-4 h-5 w-28 rounded-full bg-wrapper" />
        </div>
      </section>
    </main>
  );
}
