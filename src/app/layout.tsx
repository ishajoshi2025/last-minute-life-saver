import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Last-Minute Life Saver",
  description: "AI-powered task prioritizer and productivity agent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="theme-midnight">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800;900&family=DM+Sans:wght@400;500;600;700&family=VT323&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
