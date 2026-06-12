"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Price Settings State
  const [prices, setPrices] = useState({
    bw: 2,
    color: 10,
    singleSide: 0,
    doubleSide: 0,
    soft: 20,
    spiral: 40,
    hard: 150,
    delivery: 50
  });

  const [saved, setSaved] = useState(false);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/orders`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error("Failed to fetch orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/settings`);
      const data = await res.json();
      if (data.success && data.settings?.prices) {
        setPrices(data.settings.prices);
      }
    } catch (err) {
      console.error("Failed to fetch prices", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'settings') {
      fetchPrices();
    }
  }, [activeTab]);

  const handleSave = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prices })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save prices", err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // Mock Customers Data
  const mockCustomers = [
    { name: 'John Doe', email: 'john@example.com', ordersCount: 5 },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <header className="w-full py-4 px-8 bg-slate-900 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-extrabold tracking-tight hover:text-blue-400">PrintEasy</Link>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Admin Portal</span>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden md:block">
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab('orders')}
              className={`w-full text-left block p-3 rounded-lg font-medium transition-colors ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Orders Queue
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full text-left block p-3 rounded-lg font-medium transition-colors ${activeTab === 'settings' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Price Settings
            </button>
            <button 
              onClick={() => setActiveTab('customers')}
              className={`w-full text-left block p-3 rounded-lg font-medium transition-colors ${activeTab === 'customers' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              Customers
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 max-w-5xl">
          
          {/* Orders Queue Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Live Orders Queue</h1>
                <button onClick={fetchOrders} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium text-sm transition-colors">
                  Refresh
                </button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-x-auto min-h-[400px]">
                {loadingOrders ? (
                  <div className="flex justify-center items-center h-40">
                    <p className="text-slate-500 font-medium animate-pulse">Loading Live Orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-500 text-lg">No orders yet.</p>
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Order / RZP ID</th>
                        <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Date</th>
                        <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Details</th>
                        <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Total</th>
                        <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, i) => (
                        <tr key={order._id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4">
                            <p className="font-semibold text-slate-900 text-sm">{order._id}</p>
                            <p className="text-xs text-slate-500">{order.razorpayOrderId}</p>
                          </td>
                          <td className="py-4 text-sm text-slate-700">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                          <td className="py-4 text-sm text-slate-700">
                            <p><strong>Type:</strong> {order.printSettings?.printType} / {order.printSettings?.paperSize}</p>
                            <p><strong>Pages:</strong> {order.printSettings?.pageCount} (x{order.printSettings?.copies})</p>
                            <p><strong>Binding:</strong> {order.printSettings?.binding}</p>
                          </td>
                          <td className="py-4 font-bold">₹{order.amount / 100}</td>
                          <td className="py-4">
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                              className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wide border-2 outline-none cursor-pointer
                                ${order.status === 'Payment Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                                : order.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200'
                                : order.status === 'Printing' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : order.status === 'Ready' ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                            >
                              <option value="Payment Pending">Payment Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Printing">Printing</option>
                              <option value="Ready">Ready</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Price Configuration</h1>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-semibold mb-6 border-b pb-4">Per Page Costs</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Black & White (₹)</label>
                    <input 
                      type="number" 
                      value={prices.bw} 
                      onChange={(e) => setPrices({...prices, bw: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Color (₹)</label>
                    <input 
                      type="number" 
                      value={prices.color} 
                      onChange={(e) => setPrices({...prices, color: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Single Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.singleSide} 
                      onChange={(e) => setPrices({...prices, singleSide: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Double Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.doubleSide} 
                      onChange={(e) => setPrices({...prices, doubleSide: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <h2 className="text-xl font-semibold mb-6 border-b pb-4">Binding & Add-ons Costs</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Soft Binding (₹)</label>
                    <input 
                      type="number" 
                      value={prices.soft} 
                      onChange={(e) => setPrices({...prices, soft: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Spiral Binding (₹)</label>
                    <input 
                      type="number" 
                      value={prices.spiral} 
                      onChange={(e) => setPrices({...prices, spiral: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Hard Binding (₹)</label>
                    <input 
                      type="number" 
                      value={prices.hard} 
                      onChange={(e) => setPrices({...prices, hard: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Delivery Fee (₹)</label>
                    <input 
                      type="number" 
                      value={prices.delivery} 
                      onChange={(e) => setPrices({...prices, delivery: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSave}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all"
                  >
                    Save Changes
                  </button>
                  {saved && <span className="text-green-600 font-medium">Prices updated successfully!</span>}
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div>
              <h1 className="text-3xl font-bold mb-8">Customers Directory</h1>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Name</th>
                      <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Email</th>
                      <th className="pb-4 font-bold text-slate-500 uppercase text-sm">Total Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCustomers.map((customer, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 font-semibold text-slate-900">{customer.name}</td>
                        <td className="py-4 text-slate-600">{customer.email}</td>
                        <td className="py-4 font-medium text-slate-700">{customer.ordersCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
