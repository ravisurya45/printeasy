"use client";

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PDFDocument } from 'pdf-lib';
import Script from 'next/script';
import { QRCodeSVG } from 'qrcode.react';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Print Settings State
  const [printType, setPrintType] = useState('bw');
  const [sides, setSides] = useState('single');
  const [paperSize, setPaperSize] = useState('A4');
  const [copies, setCopies] = useState(1);
  const [binding, setBinding] = useState('none');
  
  // Customer Details State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Payment State
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'direct_upi'>('razorpay');
  const [showDirectUPI, setShowDirectUPI] = useState(false);
  
  // Pricing State
  const [prices, setPrices] = useState({
    bwSingle: 2,
    bwDouble: 3,
    colorSingle: 10,
    colorDouble: 18,
    binding: {
      none: 0,
      soft: 20,
      spiral: 40,
      hard: 150
    }
  });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
        const res = await fetch(`${apiUrl}/api/settings`);
        const data = await res.json();
        if (data.success && data.settings?.prices) {
          const fetchedPrices = data.settings.prices;
          setPrices({
            bwSingle: fetchedPrices.bwSingle || 2,
            bwDouble: fetchedPrices.bwDouble || 3,
            colorSingle: fetchedPrices.colorSingle || 10,
            colorDouble: fetchedPrices.colorDouble || 18,
            binding: {
              none: 0,
              soft: fetchedPrices.soft || 20,
              spiral: fetchedPrices.spiral || 40,
              hard: fetchedPrices.hard || 150
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch prices", err);
      }
    };
    fetchPrices();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setIsCalculating(true);
      
      try {
        if (file.type === 'application/pdf') {
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer);
          setPageCount(pdfDoc.getPageCount());
        } else if (file.type.startsWith('image/')) {
          setPageCount(1);
        } else {
          setPageCount(1); 
        }
      } catch (err) {
        console.error("Error reading file", err);
        setPageCount(1);
      } finally {
        setIsCalculating(false);
      }
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const calculateTotal = () => {
    let costPerUnit = 0;
    if (printType === 'bw') {
      costPerUnit = sides === 'single' ? prices.bwSingle : prices.bwDouble;
    } else {
      costPerUnit = sides === 'single' ? prices.colorSingle : prices.colorDouble;
    }
    
    let units = pageCount || 1;
    if (sides === 'double') {
      units = Math.ceil(units / 2);
    }

    const bindingCost = prices.binding[binding as keyof typeof prices.binding];
    return (costPerUnit * units * copies) + bindingCost;
  };

  const handlePayment = async () => {
    if (paymentMethod === 'direct_upi') {
      setShowDirectUPI(true);
      return;
    }

    setIsProcessing(true);
    const amount = calculateTotal();

    try {
      // 1. Create order on backend
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount,
          printSettings: { printType, sides, paperSize, copies, binding, pageCount },
          customer: { name: customerName, email: customerEmail, phone: customerPhone }
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        alert(`Failed to create order: ${data.error || 'Unknown error'}`);
        setIsProcessing(false);
        return;
      }

      // 2. Open Razorpay Checkout Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key_id', // Fallback for testing
        amount: data.order.amount,
        currency: "INR",
        name: "PrintEasy",
        description: `Printing ${pageCount} pages (${copies} copy)`,
        image: "https://example.com/your_logo",
        order_id: data.order.id, // This is the order ID created in the backend
        handler: async function (response: any) {
          // 3. Verify Payment on Backend
          try {
            const verifyRes = await fetch(`${apiUrl}/api/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }),
            });
            const verifyData = await verifyRes.json();
            
            if (verifyData.success) {
              // Payment verified successfully!
              router.push(`/orders?method=Razorpay&total=${amount}`);
            } else {
              alert("Payment verification failed!");
            }
          } catch (err) {
            console.error(err);
            alert("Error verifying payment");
          }
        },
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerPhone
        },
        theme: {
          color: "#2563EB"
        }
      };

      // @ts-ignore
      const rzp = new window.Razorpay(options);
      
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Error initiating payment");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Load Razorpay SDK */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <header className="w-full py-6 px-8 bg-white shadow-sm flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold text-blue-600 tracking-tight">PrintEasy</Link>
        <nav className="flex gap-6">
          <Link href="/pricing" className="text-slate-600 hover:text-blue-600 font-medium">Pricing</Link>
          <Link href="/admin" className="text-slate-600 hover:text-blue-600 font-medium">Admin</Link>
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-8 mt-8 grid grid-cols-1 lg:grid-cols-2 gap-12 relative">
        {/* Upload Section */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Upload Document</h1>
          
          <div 
            className="border-4 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center bg-white hover:bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer group"
            onClick={handleBrowseClick}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.png"
            />
            <div className="w-16 h-16 mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-center">Click to Browse Files</h3>
            <p className="text-slate-500 text-sm">PDF, DOCX, PPTX, JPG</p>
          </div>

          {selectedFile && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-900">{selectedFile.name}</p>
                <p className="text-sm text-blue-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • 
                  {isCalculating ? ' Calculating pages...' : ` ${pageCount} Pages`}
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedFile(null);
                  setPageCount(0);
                }}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Print Settings Section */}
        <div className={`transition-opacity duration-500 ${selectedFile ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-3xl font-bold mb-6">Print Settings</h2>
          
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Print Type</label>
              <div className="flex gap-4">
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold ${printType === 'bw' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setPrintType('bw')}
                >
                  Black & White
                </button>
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold ${printType === 'color' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setPrintType('color')}
                >
                  Color
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Sides</label>
              <div className="flex gap-4">
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold ${sides === 'single' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setSides('single')}
                >
                  Single Side (₹{printType === 'bw' ? prices.bwSingle : prices.colorSingle}/pg)
                </button>
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold ${sides === 'double' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setSides('double')}
                >
                  Double Side (₹{printType === 'bw' ? prices.bwDouble : prices.colorDouble}/sheet)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Paper Size</label>
                <select 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                >
                  <option value="A4">A4 (Standard)</option>
                  <option value="A3">A3 (Large)</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Copies</label>
                <input 
                  type="number" 
                  min="1" 
                  value={copies} 
                  onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
                  className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Binding</label>
              <select 
                className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                value={binding}
                onChange={(e) => setBinding(e.target.value)}
              >
                <option value="none">No Binding</option>
                <option value="soft">Soft Binding (+₹{prices.binding.soft})</option>
                <option value="spiral">Spiral Binding (+₹{prices.binding.spiral})</option>
                <option value="hard">Hard Binding (+₹{prices.binding.hard})</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Your Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                    <input 
                      type="email" 
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Phone</label>
                    <input 
                      type="tel" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="9999999999"
                      className="w-full p-3 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2">Payment Method</label>
              <div className="flex gap-4">
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${paymentMethod === 'razorpay' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  Razorpay
                </button>
                <button 
                  className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-colors ${paymentMethod === 'direct_upi' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  onClick={() => setPaymentMethod('direct_upi')}
                >
                  Direct UPI QR
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Estimated Total</p>
                <p className="text-3xl font-extrabold text-slate-900">₹{calculateTotal()}</p>
              </div>
              <button 
                onClick={handlePayment}
                disabled={isCalculating || pageCount === 0 || isProcessing || !customerName.trim() || !customerEmail.trim() || !customerPhone.trim()}
                className="px-8 py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0"
              >
                {isProcessing ? 'Processing...' : (paymentMethod === 'direct_upi' ? 'Show QR Code' : 'Pay with Razorpay')}
              </button>
            </div>
            <p className="text-xs text-center text-slate-400 font-medium">Includes automated UPI, Card, and Net Banking options</p>
          </div>
        </div>
      </main>

      {/* Direct UPI Modal */}
      {showDirectUPI && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl transform transition-all">
            <h3 className="text-2xl font-bold mb-2">Scan to Pay</h3>
            <p className="text-slate-500 mb-6 font-medium">₹{calculateTotal()} via any UPI app</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl inline-block mb-2 border-2 border-slate-100">
              <img 
                src="/scanner.jpg" 
                alt="My UPI Scanner"
                style={{ width: 220, height: 220, objectFit: 'contain' }}
              />
            </div>
            
            <p className="text-sm text-slate-500 mb-8 mt-2">Scan with GPay, PhonePe, or Paytm</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowDirectUPI(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    // Create an unverified order in backend
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
                    await fetch(`${apiUrl}/api/create-order`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: calculateTotal() }),
                    });
                  } catch (e) {
                    console.error("Could not save order", e);
                  }
                  
                  // Optimistically assume they paid and route to orders
                  router.push(`/orders?method=DirectUPI&total=${calculateTotal()}`);
                }}
                className="flex-1 py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold transition-colors shadow-md shadow-green-200"
              >
                I've Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
