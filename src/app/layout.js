// src/app/layout.js
import { Dosis } from '@next/font/google';
import Navbar from "./components/Navbar/Navbar";
import "./globals.css";

const dosis = Dosis({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-dosis',
});

export const metadata = {
  title: "Gestión de Guardias",
  description: "Sistema de gestión de guardias",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={dosis.variable}>
      <body className="bg-custom min-h-screen font-dosis">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}