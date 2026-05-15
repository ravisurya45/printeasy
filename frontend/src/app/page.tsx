import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-900">
      <main className="flex flex-col items-center justify-center flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-blue-600 tracking-tight mb-4">
          Welcome to <span className="text-slate-900">PrintEasy</span>
        </h1>
        
        <p className="mt-4 text-xl sm:text-2xl text-slate-600 max-w-2xl">
          Upload your documents, choose your print settings, and get them delivered to your doorstep.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
          <Link 
            href="/upload"
            className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
          >
            Start Printing
          </Link>
          <Link 
            href="/pricing"
            className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white border-2 border-blue-600 rounded-full hover:bg-blue-50 transition-all"
          >
            View Pricing
          </Link>
        </div>

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl w-full text-left">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-2">1. Upload Files</h3>
            <p className="text-slate-600">Securely upload PDFs, Word documents, or images. We automatically detect page counts and sizes.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-2">2. Choose Settings</h3>
            <p className="text-slate-600">Select color, paper size, binding, and lamination options. See price updates in real-time.</p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="text-xl font-bold mb-2">3. Relax & Receive</h3>
            <p className="text-slate-600">Pay securely online and track your order. Pick up at the shop or get fast home delivery.</p>
          </div>
        </div>
      </main>

      <footer className="w-full py-8 text-center text-slate-500 mt-auto border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} PrintEasy. All rights reserved.</p>
      </footer>
    </div>
  );
}
