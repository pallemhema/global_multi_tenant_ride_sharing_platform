export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
        </div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
