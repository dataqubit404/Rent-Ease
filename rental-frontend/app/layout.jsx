import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export const metadata = {
  title: 'RentEase — Find Your Perfect Home',
  description: 'Discover and book premium rental properties. Modern platform for tenants and property owners.',
  keywords: 'property rental, rent house, apartment rental, find home',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              color: '#0f0f1a',
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#6172f0', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
