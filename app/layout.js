import { Open_Sans } from "next/font/google";
import "./globals.css";

const inter = Open_Sans({ 
  weight: ['400'], 
  subsets: ["latin"] 
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
