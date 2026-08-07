import "./globals.css";
import CapacitorBackButton from "./components/CapacitorBackButton";

export const metadata = {
  metadataBase: new URL("https://www.getdaytips.com"),
  title: "DayTips — Daily Football Predictions, Analysis & Confidence Ratings",
  description:
    "Daily football predictions with confidence ratings and full analysis, across leagues worldwide. Free daily coins, flexible Pro subscriptions, and payment support across Nigeria, Ghana, Kenya, and more.",
  keywords: [
    "football predictions",
    "football tips",
    "daily football predictions",
    "football prediction app",
    "soccer predictions",
    "football analysis",
    "confidence rated football tips",
    "football tips Nigeria",
    "football tips Kenya",
    "football tips Ghana",
  ],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "DayTips — Daily Football Predictions & Analysis",
    description:
      "Every fixture analysed, rated, and stamped before kickoff. Daily predictions with confidence ratings across leagues worldwide.",
    url: "https://www.getdaytips.com",
    siteName: "DayTips",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "DayTips — Daily Football Predictions",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DayTips — Daily Football Predictions & Analysis",
    description: "Every fixture analysed, rated, and stamped before kickoff.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  themeColor: "#0E1912",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "DayTips",
  url: "https://www.getdaytips.com",
  description:
    "Daily football predictions with confidence ratings and full analysis across leagues worldwide.",
  publisher: {
    "@type": "Organization",
    name: "DayTips",
    logo: "https://www.getdaytips.com/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <CapacitorBackButton />
        {children}
      </body>
    </html>
  );
}