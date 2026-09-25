import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import Navbar from "./components/Navbar";
import ThemeProvider from "@/lib/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Vichento - Read. Write. Think deeper",
    template: "%s | Vichento",
  },
  description:
    "Vichento is a home for thoughtful reading and meaningful writing. Discover stories and ideas from independent writers, or share your own.",
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <Navbar />
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <script defer src="https://cloud.umami.is/script.js" data-website-id="33d6e7f4-19cf-43b9-89d7-77bdb3f20200"></script>
      </body>
    </html>
  );
}
