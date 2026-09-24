import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unidad Educativa Libertad En Las Americas Don Bosco - Sistema Educativo",
  description: "Sistema Educativo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={esES}
      appearance={{
        variables: {
          colorPrimary: "#070db8",
        },
        elements: {
          card: "bg-white border-t-8 border-t-[#F2D707] shadow-2xl rounded-2xl p-4",
          formButtonPrimary: "bg-[#0A10CC] hover:bg-blue-900 text-white font-bold transition-colors py-2.5",
          footerActionLink: "text-[#0A10CC] hover:text-[#F2D707] font-bold transition-colors",
        },
      }}
    >
      <html lang="es">
        <body className="min-h-screen bg-gray-50 text-gray-800 antialiased">
            {children}
        </body>
      </html>
    </ClerkProvider>
  );
}