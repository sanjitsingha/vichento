export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-10">
      <div className="max-w-[680px] space-y-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-3 w-32 rounded shimmer" />
              <div className="h-6 w-4/5 rounded shimmer" />
              <div className="h-4 w-full rounded shimmer" />
              <div className="h-4 w-2/3 rounded shimmer" />
            </div>
            <div className="hidden h-[106px] w-[160px] rounded shimmer sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
