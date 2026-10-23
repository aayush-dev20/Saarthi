import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  KeyRound,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function StudentCanteen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'orders'
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]); // { item, quantity }
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [vegOnly, setVegOnly] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState('Main Canteen Counter');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      if (vegOnly) params.append('vegOnly', 'true');

      const res = await api.getCanteenItems(params.toString());
      if (res.data) setMenuItems(res.data);
    } catch (err) {
      console.warn('Failed to fetch canteen menu:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.getMyCanteenOrders();
      if (res.data) setOrders(res.data);
    } catch (err) {
      console.warn('Failed to fetch user orders:', err.message);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [category, vegOnly]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Polling for order status updates
    return () => clearInterval(interval);
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((entry) => entry.item._id === item._id);
      if (existing) {
        return prev.map((entry) =>
          entry.item._id === item._id ? { ...entry, quantity: entry.quantity + 1 } : entry
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((entry) => {
          if (entry.item._id === itemId) {
            const newQty = entry.quantity + delta;
            return newQty > 0 ? { ...entry, quantity: newQty } : null;
          }
          return entry;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((entry) => entry.item._id !== itemId));
  };

  const cartTotal = cart.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      setPlacingOrder(true);
      const payload = {
        items: cart.map((entry) => ({
          itemId: entry.item._id,
          quantity: entry.quantity,
        })),
        deliveryLocation,
        notes,
      };

      const res = await api.placeCanteenOrder(payload);
      if (res.success) {
        setNotification({
          type: 'success',
          text: `Order #${res.data?.orderNumber} placed! Pickup OTP: ${res.data?.pickupOtp}. Estimated ready in ${res.data?.estimatedReadyMinutes || 15} mins.`,
        });
        setCart([]);
        setNotes('');
        setActiveTab('orders');
        await fetchOrders();
        await fetchMenu(); // stock decreased
      }
    } catch (err) {
      setNotification({
        type: 'error',
        text: err.message || 'Failed to place order. Check stock availability.',
      });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this pending canteen order?')) return;
    try {
      await api.cancelCanteenOrder(orderId);
      setNotification({ type: 'success', text: 'Order cancelled and stock restored.' });
      await fetchOrders();
      await fetchMenu();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to cancel order' });
    }
  };

  const getOrderStatusBadge = (status) => {
    switch (status) {
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Placed
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Sparkles className="w-3 h-3" /> In Kitchen
          </span>
        );
      case 'READY_FOR_PICKUP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3 h-3" /> Ready for Pickup
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Collected
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-medium">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Campus Canteen & Kitchen Ordering</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Campus Dining & Live Food Counter
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Skip long dining hall queues. Order meals, snacks, and beverages with server-verified real-time stock and collect using a unique 4-digit pickup OTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'menu'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Dining Menu
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>My Orders ({orders.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'menu' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Catalog (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, snacks, beverages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchMenu()}
                  className="bg-transparent border-none outline-none text-xs text-slate-800 w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="MEALS">Meals & Combos</option>
                  <option value="SNACKS">Snacks & Quick Bites</option>
                  <option value="BEVERAGES">Beverages & Juices</option>
                  <option value="DESSERTS">Desserts</option>
                </select>

                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer select-none px-2 py-1 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="checkbox"
                    checked={vegOnly}
                    onChange={(e) => setVegOnly(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Pure Veg</span>
                </label>
              </div>
            </div>

            {/* Dishes Grid */}
            {loading ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading live canteen menu...</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
                <UtensilsCrossed className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No menu items match your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {menuItems.map((item) => {
                  const inCart = cart.find((entry) => entry.item._id === item._id);
                  const isAvailable = item.isAvailable && item.stockQuantity > 0;
                  return (
                    <div
                      key={item._id}
                      className={`bg-white p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isAvailable
                          ? 'border-slate-200/80 shadow-xs hover:border-emerald-300'
                          : 'border-slate-100 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-3 h-3 rounded-xs border flex items-center justify-center shrink-0 ${
                                  item.isVeg ? 'border-emerald-600' : 'border-rose-600'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.isVeg ? 'bg-emerald-600' : 'bg-rose-600'
                                  }`}
                                />
                              </span>
                              <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold mt-0.5">
                              {item.category}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">₹{item.price}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>~{item.preparationTimeMinutes || 10} mins</span>
                          <span className="mx-1">•</span>
                          <span>Stock: {item.stockQuantity}</span>
                        </div>

                        {isAvailable ? (
                          inCart ? (
                            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="text-emerald-700 hover:text-emerald-900 p-0.5"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold text-xs text-emerald-900">
                                {inCart.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                disabled={inCart.quantity >= item.stockQuantity}
                                className="text-emerald-700 hover:text-emerald-900 p-0.5 disabled:opacity-30"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-500">Out of Stock</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart & Checkout Panel (1 col) */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Your Dining Tray</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  {cart.reduce((s, e) => s + e.quantity, 0)} items
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">Your tray is empty.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Select dishes from the menu to prepare your order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pr-1">
                    {cart.map((entry) => (
                      <div key={entry.item._id} className="py-2.5 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate">
                            {entry.item.name}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            ₹{entry.item.price} &times; {entry.quantity}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-1.5 py-0.5">
                            <button
                              onClick={() => updateQuantity(entry.item._id, -1)}
                              className="text-slate-600 hover:text-slate-900 p-0.5"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="text-xs font-bold text-slate-800">{entry.quantity}</span>
                            <button
                              onClick={() => updateQuantity(entry.item._id, 1)}
                              disabled={entry.quantity >= entry.item.stockQuantity}
                              className="text-slate-600 hover:text-slate-900 p-0.5 disabled:opacity-30"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          <span className="text-xs font-bold text-slate-900 w-12 text-right">
                            ₹{entry.item.price * entry.quantity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Dietary Notes (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Less spicy, extra napkins..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Total Payable:</span>
                      <span className="text-base font-bold text-slate-900">₹{cartTotal}</span>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={placingOrder}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                    >
                      {placingOrder ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          Place Order (Pay at Counter / Campus ID)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* My Orders View */
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Active or Past Orders</h3>
              <p className="text-xs text-slate-400 mt-1">
                You haven't placed any canteen orders yet. Switch to Dining Menu to order.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{o.orderNumber}</span>
                        {getOrderStatusBadge(o.status)}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(o.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Pickup OTP Banner */}
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-indigo-500">
                        Pickup OTP
                      </div>
                      <div className="font-mono font-extrabold text-base text-indigo-700">
                        {o.pickupOtp}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-1.5">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="text-slate-600">
                          {item.name} &times; <strong>{item.quantity}</strong>
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹{item.priceAtOrder * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Location</span>
                      <span className="text-slate-700 font-medium">{o.deliveryLocation}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Total Paid</span>
                      <span className="text-sm font-bold text-slate-900">₹{o.totalAmount}</span>
                    </div>
                  </div>

                  {o.status === 'PLACED' && (
                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleCancelOrder(o._id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 py-1 px-2 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
