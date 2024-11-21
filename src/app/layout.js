// src/app/layout.js
import { Dosis } from 'next/font/google'; // Cambiar la importación
import Navbar from "./components/Navbar/Navbar";
import "./globals.css";

const dosis = Dosis({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dosis',
  display: 'swap',
});

export const metadata = {
  title: "Gestión Corporate",
  description: "Sistema de gestión",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${dosis.variable}`}>
      <body className={`bg-custom min-h-screen font-dosis ${dosis.className}`}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}