"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) setIsAuthenticated(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setLoginError('');
      } else {
        setLoginError('Invalid password');
      }
    } catch (err) {
      setLoginError('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };
  
  // Price Settings State
  const [prices, setPrices] = useState({
    bwSingle: 2,
    bwDouble: 3,
    colorSingle: 10,
    colorDouble: 18,
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
      const res = await fetch(`${apiUrl}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
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
    if (activeTab === 'orders' && isAuthenticated) {
      fetchOrders();
    } else if (activeTab === 'settings' && isAuthenticated) {
      fetchPrices();
    }
  }, [activeTab, isAuthenticated]);

  const handleSave = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/settings`, {
        method: 'POST',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders(),
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-900">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight mb-2">PrintEasy Admin</h1>
            <p className="text-slate-500 font-medium bg-slate-100 inline-block px-4 py-1 rounded-full text-sm">Secure Portal Login</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Admin Password</label>
              <input
                type="password"
                placeholder="Enter password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-4 border-2 rounded-xl outline-none transition-colors text-lg ${loginError ? 'border-red-300 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}`}
                autoFocus
              />
              {loginError && <p className="text-red-500 text-sm mt-2 font-bold">{loginError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-black hover:shadow-lg transition-all text-lg flex justify-center items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Login to Portal
            </button>
          </form>
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
             <Link href="/" className="text-slate-500 hover:text-blue-600 hover:underline text-sm font-bold transition-colors">← Return to Public Site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      <header className="w-full py-4 px-8 bg-slate-900 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-extrabold tracking-tight hover:text-blue-400">PrintEasy</Link>
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">Admin Portal</span>
        </div>
        <button onClick={handleLogout} className="text-slate-300 hover:text-white font-medium text-sm px-4 py-2 rounded hover:bg-slate-800 transition-colors">Logout</button>
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
                    <label className="block text-sm font-bold text-slate-700 mb-2">B&W Single Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.bwSingle} 
                      onChange={(e) => setPrices({...prices, bwSingle: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">B&W Double Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.bwDouble} 
                      onChange={(e) => setPrices({...prices, bwDouble: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Color Single Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.colorSingle} 
                      onChange={(e) => setPrices({...prices, colorSingle: parseFloat(e.target.value) || 0})}
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Color Double Side (₹)</label>
                    <input 
                      type="number" 
                      value={prices.colorDouble} 
                      onChange={(e) => setPrices({...prices, colorDouble: parseFloat(e.target.value) || 0})}
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
