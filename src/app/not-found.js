import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-6 text-center">
      <p className="font-creato text-sm uppercase tracking-[0.2em] text-primary">
        Error 404
      </p>
      <h1 className="mt-4 font-creato text-[44px] font-bold leading-none tracking-tight text-black md:text-[72px]">
        Out of nothing,
        <br />
        something.
      </h1>
      <p className="mt-6 max-w-md text-[15px] text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist — but there are plenty of
        stories that do.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-black px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
      >
        Back to home
      </Link>
    </div>
  );
}
