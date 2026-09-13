import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Mona_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const sans = Mona_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: false,
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false,
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Signal Console",
  description: "Control panel for embeddable company chat agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#14161b",
              border: "1px solid #2c3038",
              color: "#f4f1ea",
              borderRadius: 4,
              fontFamily: "var(--font-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
