"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderDetails() {
  const searchParams = useSearchParams();
  const total = searchParams.get('total') || '20';
  const method = searchParams.get('method') || 'UPI';

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between border-b pb-6 mb-6">
        <div>
          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Confirmed</span>
          <h3 className="text-xl font-bold mt-2">Order #ORD-{Math.floor(1000 + Math.random() * 9000)}</h3>
          <p className="text-slate-500 text-sm mt-1">Placed on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-slate-900">₹{total}</p>
          <p className="text-slate-500 text-sm">Paid via {method}</p>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-slate-600">
        <p><strong>Document:</strong> Uploaded Document</p>
        <p><strong>Settings:</strong> Custom Print Settings</p>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="font-semibold mb-4">Live Tracking</h4>
        <div className="flex justify-between items-center relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-0 w-1/3 h-1 bg-green-500 -z-10 -translate-y-1/2"></div>
          
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">✓</div>
            <p className="text-xs font-medium mt-2">Uploaded</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm animate-pulse">⚙</div>
            <p className="text-xs font-medium mt-2 text-blue-600">Printing</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm">3</div>
            <p className="text-xs font-medium mt-2 text-slate-500">Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <header className="w-full py-6 px-8 bg-white shadow-sm flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">PrintEasy</Link>
        <nav className="flex gap-6">
          <Link href="/upload" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">New Print</Link>
          <Link href="/pricing" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Pricing</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-8 mt-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <Suspense fallback={<div>Loading order details...</div>}>
          <OrderDetails />
        </Suspense>
      </main>
    </div>
  );
}
