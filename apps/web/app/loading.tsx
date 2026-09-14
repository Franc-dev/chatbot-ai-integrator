import { LoaderPane } from "@signal/ui";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <LoaderPane label="loading…" />
    </main>
  );
}
