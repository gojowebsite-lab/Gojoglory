import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FFGlory Panel",
  description: "Advanced gaming panel for FFGlory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased overflow-x-hidden">
        <div className="ng-bg-gradient"></div>
        <div className="ng-aurora-waves"></div>
        <div className="ng-floating-orbs">
          <div className="ng-orb ng-orb-1"></div>
          <div className="ng-orb ng-orb-2"></div>
          <div className="ng-orb ng-orb-3"></div>
        </div>
        <div className="ng-grid-pattern"></div>
        <div className="ng-noise-overlay"></div>
        <div className="ng-vignette"></div>
        <div className="ng-top-accent"></div>
        {children}
      </body>
    </html>
  );
}
