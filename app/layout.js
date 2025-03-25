import './globals.css';

export const metadata = {
  title: 'Recipe Manager',
  description: 'Manage your favorite recipes',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}