import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { BagProvider } from "@/components/bag/BagContext";
import StoreShell from "@/components/layout/StoreShell";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-cormorant",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "BLACKO STORES — Contemporary Nigerian Menswear & Interactive Rail",
  description:
    "Browse men's shirting directly on our diagonal studio rail and pack garments into your custom Blacko Stores weekender bag. Nationwide Nigerian delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cormorant.variable + " " + inter.variable + " " + jetbrains.variable}
    >
      <body className="studio-backdrop font-sans min-h-screen w-full relative">
        <BagProvider>
          <StoreShell>{children}</StoreShell>
        </BagProvider>
      </body>
    </html>
  );
}
