import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-black select-text">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center font-black text-white text-base shadow-sm">
          <span className="text-white font-bold">SO</span>
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-black">Storefront Ops</span>
          <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-black text-white">404</span>
        </div>
      </div>

      {/* Main 404 Card */}
      <div className="max-w-md w-full bg-white border border-black/10 rounded-2xl p-8 shadow-sm text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-black text-white font-mono font-black text-2xl mb-5 shadow-sm">
          404
        </div>
        <h1 className="text-2xl font-extrabold text-black mb-2 tracking-tight">
          Page or Route Not Found
        </h1>
        <p className="text-black/60 text-sm leading-relaxed mb-8">
          The operational workspace, order record, or tenant endpoint you requested does not exist or may have been relocated.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/acme-commerce"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-black text-white font-semibold text-sm hover:bg-black/90 transition-all shadow-sm active:scale-[0.98]"
          >
            <span className="text-white font-semibold">Open Dashboard</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white text-black border border-black/20 font-semibold text-sm hover:bg-black/5 transition-all active:scale-[0.98]"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>

      {/* Platform Status Footer */}
      <div className="mt-8 flex items-center gap-2 text-xs text-black/50">
        <span className="w-2 h-2 rounded-full bg-[#16a34a] inline-block animate-pulse"></span>
        <span>Storefront Ops Platform — All Systems Operational</span>
      </div>
    </div>
  );
}
