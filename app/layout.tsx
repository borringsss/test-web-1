import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "L'Union Pizza | Make Your Own Pizza Experience & Artisanal Dining",
  description:
    "Experience authentic Neapolitan artisanal pizza at L'Union Pizza. Make your own pizza, reserve your table at Napoli or Romana, and enjoy crafted moments.",
  keywords: [
    "L'Union Pizza",
    "Make Your Own Pizza",
    "MYO Pizza",
    "Pizza Reservation",
    "Neapolitan Pizza",
    "Artisanal Dining",
  ],
  openGraph: {
    title: "L'Union Pizza | Make Your Own Pizza Experience",
    description:
      "Craft your signature pizza with 2 flavours and reserve your hearthside table at L'Union Pizza.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-cream-50 text-charcoal-900 font-sans antialiased selection:bg-tomato-100 selection:text-tomato-800">
        {children}
      </body>
    </html>
  );
}
