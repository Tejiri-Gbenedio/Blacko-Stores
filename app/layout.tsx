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
  metadataBase: new URL("https://blacko-stores.vercel.app"),
  title: "BLACKO STORES — Contemporary Nigerian Menswear & Interactive Rail",
  description:
    "Browse men's shirting directly on our diagonal studio rail and pack garments into your custom Blacko Stores weekender bag. Handcrafted in Lagos, Nigeria.",
  openGraph: {
    title: "BLACKO STORES — Contemporary Nigerian Menswear & Interactive Rail",
    description:
      "Handcrafted shirting engineered in Lagos, Nigeria. Small-batch tailoring woven from heritage African jacquard, hand-resist adire, and breathable raw cotton.",
    url: "https://blacko-stores.vercel.app",
    siteName: "BLACKO STORES",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "/assets/shirts/sky-floral-camp/front.webp",
        width: 1200,
        height: 630,
        alt: "Blacko Stores — Sky Floral Camp Shirt",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BLACKO STORES — Contemporary Nigerian Menswear & Interactive Rail",
    description:
      "Browse men's shirting directly on our diagonal studio rail and pack garments into your custom Blacko Stores weekender bag. Lagos, Nigeria.",
    images: ["/assets/shirts/sky-floral-camp/front.webp"],
  },
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
      <head>
        <link
          rel="preload"
          as="image"
          href="/assets/shirts/sky-floral-camp/front.webp"
          // @ts-ignore
          fetchPriority="high"
        />
      </head>
      <body className="studio-backdrop font-sans min-h-screen w-full relative">
        <BagProvider>
          <StoreShell>{children}</StoreShell>
        </BagProvider>
      </body>
    </html>
  );
}
