import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "tp-inge3 — TeamPay mini",
  description: "TP de Ingeniería de Software III — gestión de cuotas y gastos de un equipo de fútbol amateur",
};

const NAV_LINKS = [
  { href: "/jugadoras", label: "Jugadoras" },
  { href: "/eventos", label: "Eventos" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
            <span className="font-semibold">tp-inge3</span>
            <nav className="flex gap-4 text-sm">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="text-zinc-600 hover:text-zinc-900">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
