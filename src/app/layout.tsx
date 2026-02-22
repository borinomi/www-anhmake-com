import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "anhmake.com",
  description: "Dashboard and tools platform",
  other: {
    "facebook-domain-verification": "9jk15ybily7yzv3lwi9p0gq4gcioy3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
