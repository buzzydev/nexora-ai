import "./globals.css";
export const metadata = { title: "NEXORA AI", description: "Ask anything. Discover everything." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body>{children}</body></html>);
}
