// ... existing code ...

export default function NotFound() {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="mb-4">Sorry, the page you are looking for does not exist.</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }