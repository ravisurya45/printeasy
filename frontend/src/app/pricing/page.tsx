import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Simple Header */}
      <header className="w-full py-6 px-8 bg-white shadow-sm flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">
          PrintEasy
        </Link>
        <nav className="flex gap-6">
          <Link href="/upload" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Start Printing</Link>
          <Link href="/orders" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">My Orders</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 mt-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold mb-4 text-slate-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">No hidden fees. You only pay for exactly what you print. Live cost calculation is available during upload.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Black & White Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
            <h3 className="text-2xl font-bold mb-2">Black & White</h3>
            <p className="text-slate-500 mb-6">Perfect for notes, drafts, and text-heavy documents.</p>
            <div className="text-5xl font-extrabold text-slate-900 mb-6">
              ₹2<span className="text-xl text-slate-500 font-medium">/page</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-slate-600">
                <span className="text-green-500 mr-2">✓</span> A4 Size Standard
              </li>
              <li className="flex items-center text-slate-600">
                <span className="text-green-500 mr-2">✓</span> Double-sided available
              </li>
              <li className="flex items-center text-slate-600">
                <span className="text-green-500 mr-2">✓</span> High-speed printing
              </li>
            </ul>
            <Link href="/upload" className="block w-full py-4 text-center font-semibold text-slate-700 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
              Print B&W
            </Link>
          </div>

          {/* Color Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-blue-500 hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>
            <div className="absolute top-6 right-6 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Popular</div>
            <h3 className="text-2xl font-bold mb-2">Full Color</h3>
            <p className="text-slate-500 mb-6">Vibrant colors for presentations, photos, and posters.</p>
            <div className="text-5xl font-extrabold text-blue-600 mb-6">
              ₹10<span className="text-xl text-slate-500 font-medium">/page</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-slate-600">
                <span className="text-blue-500 mr-2">✓</span> High Quality Inkjet
              </li>
              <li className="flex items-center text-slate-600">
                <span className="text-blue-500 mr-2">✓</span> A4, A3, Letter supported
              </li>
              <li className="flex items-center text-slate-600">
                <span className="text-blue-500 mr-2">✓</span> Glossy paper options
              </li>
            </ul>
            <Link href="/upload" className="block w-full py-4 text-center font-semibold text-white bg-blue-600 rounded-full hover:bg-blue-700 shadow-md transition-all">
              Print Color
            </Link>
          </div>
        </div>

        {/* Add-ons */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold mb-6 border-b pb-4">Add-ons & Finishing</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-1">Spiral Binding</h4>
              <p className="text-slate-500 mb-2">Durable and flexible.</p>
              <span className="text-xl font-bold">₹40 <span className="text-sm font-normal text-slate-500">per book</span></span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Hard Binding</h4>
              <p className="text-slate-500 mb-2">Premium thesis binding.</p>
              <span className="text-xl font-bold">₹150 <span className="text-sm font-normal text-slate-500">per book</span></span>
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Home Delivery</h4>
              <p className="text-slate-500 mb-2">Get it at your doorstep.</p>
              <span className="text-xl font-bold">₹50 <span className="text-sm font-normal text-slate-500">flat rate</span></span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
