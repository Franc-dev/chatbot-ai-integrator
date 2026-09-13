import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen px-6 py-10 md:px-14">
      <header className="flex items-center justify-between">
        <p className="display text-3xl italic">Signal</p>
        <nav className="flex gap-3">
          <Link href="/login" className="pressable rounded-sm border border-[var(--line)] px-4 py-2 text-[14px]">
            Sign in
          </Link>
          <Link href="/signup" className="pressable rounded-sm bg-[var(--accent)] px-4 py-2 text-[14px] text-white">
            Create a workspace
          </Link>
        </nav>
      </header>
      <section className="mx-auto mt-24 max-w-3xl">
        <h1 className="display text-5xl italic leading-tight md:text-7xl">
          A control panel for company chat agents.
        </h1>
        <p className="mt-6 max-w-xl text-[18px] leading-8 text-[var(--mute)]">
          Add your own API keys, teach the bot from your docs, and drop a small widget on
          Next.js, Nuxt, Vue, or React.
        </p>
        <Link
          href="/signup"
          className="pressable mt-8 inline-flex h-11 items-center rounded-sm bg-[var(--accent)] px-5 text-[15px] text-white"
        >
          Get started
        </Link>
      </section>
    </main>
  );
}
