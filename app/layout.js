import './globals.css';
import { ClerkProvider } from '@clerk/nextjs'

export const metadata = {
  title: 'Recipe Manager',
  description: 'Manage your favorite recipes',
};

export default function RootLayout({ children }) {
  const darkThemeAppearance = {
    baseTheme: 'dark',
    variables: {
      colorBackground: '#22262E',
      colorPrimary: '#7B68EE',
      //colorPrimary: '#ee0000',
      colorText: '#ffffff',
      colorInputBackground: '#1e1e1e',
      colorInputText: '#ffffff',
      colorCard: '#1e1e1e',
    },
    elements: {
      card: {
        backgroundColor: '#1e1e1e',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.5)',
      },
      navbar: {
        backgroundColor: '#1e1e1e',
      },
    }
  };

  return (
    <html lang="en">
      <body>
        <ClerkProvider appearance={darkThemeAppearance}>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}