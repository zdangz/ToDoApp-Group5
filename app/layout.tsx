import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Todo App - Modern Task Management',
  description: 'Feature-rich todo application with WebAuthn authentication',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
