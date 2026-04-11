export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 text-center lg:px-8">
      <h1 className="text-3xl font-bold text-white">404 — Not Found</h1>
      <p className="mt-4 text-zinc-400">The page you are looking for does not exist.</p>
      <a href="/" className="mt-8 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
        Home
      </a>
    </div>
  );
}
