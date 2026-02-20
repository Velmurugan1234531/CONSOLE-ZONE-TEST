"use client";

import { Plus, Edit, Trash2, CheckCircle, Search, X, Filter, Download, Printer, ChevronDown, AlertTriangle, PenTool, ChevronUp, Upload, Zap, ShoppingCart, CreditCard, Banknote, History, Minus, Save, Image as ImageIcon, Box, Tag, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getProducts, createProduct, updateProduct, deleteProduct, updateProductStock } from "@/services/products";
import { recordSale } from "@/services/sales";
import { getProfiles } from "@/services/admin";
import { Product, ProductCategory, ProductType, ProductStatus, Profile } from "@/types";
import { SalesHistory } from "@/components/admin/SalesHistory";
import { getAllOrders, Order } from "@/services/orders";

interface CartItem {
    product: Product;
    quantity: number;
}

export default function SellingPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [currentView, setCurrentView] = useState<'terminal' | 'history' | 'orders'>('terminal');
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Master Control Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "PS5" as ProductCategory,
        type: "buy" as ProductType,
        price: 0,
        stock: 0,
        stock_warning_level: 2,
        images: [] as string[],
        status: "available" as ProductStatus,
        description: "",
        features: [] as string[]
    });
    const [newFeature, setNewFeature] = useState("");


    useEffect(() => {
        loadProducts();
        loadProfiles();
    }, []);

    useEffect(() => {
        if (currentView === 'orders') {
            loadOrders();
        }
    }, [currentView]);

    const loadOrders = async () => {
        setOrdersLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    const loadProfiles = async () => {
        try {
            const data = await getProfiles();
            setProfiles(data || []);
        } catch (error) {
            console.error("Failed to fetch profiles", error);
        }
    };

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data || []);
        } catch (error) {
            console.error("Failed to fetch inventory", error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ["All", "PS5", "PS4", "Xbox", "VR", "Handheld", "Accessory", "Game"];

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return alert("Out of stock!");

        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    alert("Max stock reached!");
                    return prev;
                }
                return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty <= 0) return item;
                if (newQty > (item.product.stock)) {
                    alert("Max stock reached!");
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const finalTotal = cartTotal;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setIsCheckoutModalOpen(true);
    };

    const completeSale = async () => {
        try {
            for (const item of cart) {
                const newStock = item.product.stock - item.quantity;
                await updateProductStock(item.product.id, newStock);
            }

            // Record Sale
            const saleItems = cart.map(item => ({
                product_id: item.product.id,
                product_name: item.product.name,
                quantity: item.quantity,
                price: item.product.price,
                total: item.product.price * item.quantity
            }));

            await recordSale({
                user_id: selectedUserId || undefined,
                items: saleItems,
                total_amount: finalTotal,
                payment_method: paymentMethod,
                status: 'completed'
            });

            alert(`Sale Completed! Payment via ${paymentMethod.toUpperCase()}`);
            setCart([]);
            setIsCheckoutModalOpen(false);
            loadProducts();
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Checkout failed. Please try again.");
        }
    };

    const filteredProducts = products.filter(p =>
        p.type !== 'trade-in' &&
        (filterCategory === "All" || p.category === filterCategory) &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- Master Control Modal Logic ---
    const openModal = (product: any = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                type: product.type || 'buy',
                price: product.price,
                stock: product.stock,
                stock_warning_level: product.stock_warning_level || 2,
                images: product.images || (product.image ? [product.image] : []),
                status: product.status,
                description: product.description || "",
                features: product.features || []
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                category: "PS5",
                type: "buy",
                price: 0,
                stock: 0,
                stock_warning_level: 2,
                images: [],
                status: "available",
                description: "",
                features: []
            });
        }
        setIsModalOpen(true);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleAddFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] }));
            setNewFeature("");
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Product Name is required");
        setLoading(true);
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData);
            }
            await loadProducts();
            setIsModalOpen(false);
            alert("Product Saved Successfully!");
        } catch (e) {
            console.error(e);
            alert("Failed to save product");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(id);
                loadProducts();
            } catch (e) { console.error(e) }
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#050505]">

            {/* LEFT SIDE - Product Grid / History (65%) */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/10">

                {/* Header */}
                <div className="p-6 border-b border-white/10 bg-[#0a0a0a]">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Sales & Inventory</h1>
                            <p className="text-gray-500 text-xs font-mono">Master Control Terminal</p>
                        </div>
                        <div className="flex gap-4">
                            {/* View Switcher */}
                            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                                <button
                                    onClick={() => setCurrentView('terminal')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'terminal' ? 'bg-[#06B6D4] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <Zap size={16} /> POS Terminal
                                </button>
                                <button
                                    onClick={() => setCurrentView('orders')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'orders' ? 'bg-[#06B6D4] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <ShoppingCart size={16} /> Orders
                                </button>
                                <button
                                    onClick={() => setCurrentView('history')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${currentView === 'history' ? 'bg-[#06B6D4] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <History size={16} /> History
                                </button>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 bg-[#06B6D4] text-black font-bold px-4 py-2 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all text-sm uppercase tracking-wide"
                            >
                                <Plus size={18} /> New Product
                            </button>
                        </div>
                    </div>

                    {currentView === 'terminal' && (
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search inventory..."
                                    className="w-full bg-white/5 border border-white/10 focus:border-[#06B6D4] rounded-xl py-3 pl-10 pr-4 text-white outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                {['All', 'PS5', 'Xbox', 'Game'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filterCategory === cat ? 'bg-[#06B6D4] text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    {currentView === 'terminal' ? (
                        <div className="absolute inset-0 overflow-y-auto p-6 bg-[#050505]">
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredProducts.map((product) => (
                                    <div key={product.id} className="relative group">
                                        <motion.button
                                            layout
                                            onClick={() => addToCart(product)}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden hover:border-[#06B6D4]/50 transition-all text-left flex flex-col h-full"
                                        >
                                            <div className="aspect-square bg-white/5 relative">
                                                <img
                                                    src={product.image || product.images?.[0] || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200"}
                                                    className="w-full h-full object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity"
                                                />
                                                {product.stock <= 0 && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                        <span className="text-red-500 font-black uppercase text-xs border border-red-500 px-2 py-1 rounded">Out of Stock</span>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">
                                                    Stock: {product.stock}
                                                </div>
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col">
                                                <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{product.name}</h3>
                                                <p className="text-gray-500 text-xs mb-3">{product.category}</p>
                                                <div className="mt-auto flex justify-between items-end">
                                                    <span className="text-[#06B6D4] font-mono font-bold text-lg">₹{product.price}</span>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#06B6D4] group-hover:text-black transition-colors">
                                                        <Plus size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.button>
                                        {/* Edit Overlay Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openModal(product); }}
                                            className="absolute top-2 left-2 p-2 bg-black/50 backdrop-blur rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#06B6D4] hover:text-black z-10"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : currentView === 'orders' ? (
                        <div className="absolute inset-0 overflow-y-auto p-6 bg-[#050505]">
                            {ordersLoading ? (
                                <div className="flex items-center justify-center py-20 text-gray-500 font-mono animate-pulse">
                                    Loading orders...
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-gray-600">
                                    <ShoppingCart size={48} className="mb-4 opacity-50" />
                                    <p className="font-bold uppercase tracking-wider">No orders found</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 hover:border-[#06B6D4]/30 transition-all">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-white font-black uppercase tracking-tight text-lg">Order #{order.id.slice(0, 8)}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30' :
                                                            order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30' :
                                                                'bg-red-500/10 text-red-500 border border-red-500/30'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                                        <User size={12} />
                                                        <span className="font-semibold">{order.customer_name}</span>
                                                        <span>•</span>
                                                        <span className="font-mono">{new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[#06B6D4] font-black text-2xl font-mono">₹{order.total_amount.toLocaleString()}</p>
                                                    <div className="flex items-center gap-2 justify-end mt-1">
                                                        {order.payment_method === 'cash' && <Banknote size={14} className="text-gray-500" />}
                                                        {order.payment_method === 'card' && <CreditCard size={14} className="text-gray-500" />}
                                                        {order.payment_method === 'upi' && <CreditCard size={14} className="text-gray-500" />}
                                                        <span className="text-gray-500 text-xs uppercase font-bold">{order.payment_method}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t border-white/5 pt-4 space-y-2">
                                                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Items ({order.items.length})</p>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-300">{item.quantity}x {item.product_name}</span>
                                                        <span className="text-gray-500 font-mono">₹{item.subtotal.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                                {order.notes && (
                                                    <div className="mt-3 pt-3 border-t border-white/5">
                                                        <p className="text-gray-600 text-xs italic">"{order.notes}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="absolute inset-0 p-6 overflow-hidden">
                            <SalesHistory />
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDE - Cart (35%) */}
            <div className="w-[400px] bg-[#0a0a0a] flex flex-col h-full border-l border-white/10 shadow-2xl z-20">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <ShoppingCart className="text-[#06B6D4]" /> Current Order
                    </h2>
                    <span className="bg-white/5 text-gray-400 text-xs font-mono px-2 py-1 rounded">{cart.length} Items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-4">
                            <ShoppingCart size={48} opacity={0.2} />
                            <p className="text-sm">Cart is empty</p>
                            <p className="text-xs text-center max-w-[200px]">Select items from the inventory to start a sale</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.product.id} className="bg-[#050505] border border-white/10 rounded-xl p-3 flex gap-4 group">
                                <div className="w-16 h-16 bg-white/5 rounded-lg overflow-hidden shrink-0">
                                    <img src={item.product.images?.[0]} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-white font-bold text-sm truncate">{item.product.name}</h4>
                                        <button onClick={() => removeFromCart(item.product.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="text-[#06B6D4] text-xs font-mono mb-2">₹{item.product.price} <span className="text-gray-600">x {item.quantity}</span></p>

                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                            <Minus size={12} />
                                        </button>
                                        <span className="text-white font-mono text-sm w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                            <Plus size={12} />
                                        </button>
                                        <div className="ml-auto text-white font-bold text-sm">
                                            ₹{item.product.price * item.quantity}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-[#050505] border-t border-white/10 space-y-4">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{cartTotal}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                            <span>Tax (Included)</span>
                            <span>₹0</span>
                        </div>
                        <div className="flex justify-between text-white font-black text-xl pt-4 border-t border-white/10">
                            <span>Total</span>
                            <span className="text-[#06B6D4]">₹{finalTotal}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-[#06B6D4] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase py-4 rounded-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        <Zap size={20} /> Checkout
                    </button>
                </div>
            </div>

            {/* MASTER CONTROL MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        {editingProduct ? <Edit size={24} className="text-[#06B6D4]" /> : <Plus size={24} className="text-[#06B6D4]" />}
                                        {editingProduct ? 'Edit Master Record' : 'Create Master Record'}
                                    </h2>
                                    <p className="text-gray-500 text-xs font-mono mt-1">Full control access level • ID: {editingProduct?.id || 'NEW_ASSET'}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {editingProduct && (
                                        <button onClick={() => handleDelete(editingProduct.id)} className="text-red-500 hover:text-red-400 font-bold text-sm uppercase flex items-center gap-2">
                                            <Trash2 size={16} /> Delete Asset
                                        </button>
                                    )}
                                    <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20 text-white"><X size={20} /></button>
                                </div>
                            </div>

                            {/* Modal Body - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-12 gap-8">

                                    {/* Left Column - Images & Status (4 cols) */}
                                    <div className="col-span-12 md:col-span-4 space-y-6">
                                        {/* Status Card */}
                                        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Asset Status</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                                                className={`w-full p-3 rounded-lg font-bold border outline-none appearance-none ${formData.status === 'available' ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30' :
                                                    formData.status === 'rented' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                                                        'bg-red-500/20 text-red-500 border-red-500/30'
                                                    }`}
                                            >
                                                <option value="available">🟢 Available</option>
                                                <option value="rented">🔵 Rented</option>
                                                <option value="maintenance">🟠 Maintenance</option>
                                                <option value="sold">🔴 Sold</option>
                                                <option value="hidden">⚫ Hidden</option>
                                            </select>
                                        </div>

                                        {/* Standardized Professional Gallery */}
                                        <div className="space-y-4">
                                            <div className="aspect-video bg-black rounded-xl border border-white/10 relative overflow-hidden group shadow-inner">
                                                {formData.images.length > 0 ? (
                                                    <img src={formData.images[0]} className="w-full h-full object-contain p-6 animate-in fade-in zoom-in-95 duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-white/[0.02]">
                                                        <ImageIcon size={64} strokeWidth={1} />
                                                        <span className="text-[10px] uppercase font-black tracking-widest mt-4 opacity-50">Depot Empty</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                                    <span className="text-[10px] font-black text-white/50 uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">Main Optic Preview</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 gap-3">
                                                {/* Add Image Slot */}
                                                <label className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-white/10 hover:border-[#06B6D4]/50 transition-all group/add">
                                                    <Upload size={24} className="text-gray-500 group-hover/add:text-[#06B6D4] group-hover/add:scale-110 transition-all" />
                                                    <span className="text-[8px] font-black uppercase text-gray-600 group-hover/add:text-[#06B6D4]">Add Visual</span>
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                </label>

                                                {/* Thumbnails with Remove Controls */}
                                                {formData.images.map((img, idx) => (
                                                    <div key={idx} className="aspect-square bg-black rounded-xl border border-white/10 relative group/thumb overflow-hidden ring-1 ring-inset ring-transparent hover:ring-[#06B6D4]/50 transition-all">
                                                        <img src={img} className="w-full h-full object-cover opacity-60 group-hover/thumb:opacity-100 transition-opacity" />

                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    images: prev.images.filter((_, i) => i !== idx)
                                                                }));
                                                            }}
                                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover/thumb:opacity-100 transition-all scale-75 group-hover/thumb:scale-100 shadow-lg backdrop-blur-sm"
                                                            title="Purge Image"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>

                                                        {idx === 0 && (
                                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#06B6D4] text-black text-[7px] font-black uppercase rounded-md shadow-lg">
                                                                Primary
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Details (8 cols) */}
                                    <div className="col-span-12 md:col-span-8 space-y-6">

                                        {/* Core Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Product Name</label>
                                                <input
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-4 text-lg font-bold text-white focus:border-[#06B6D4] outline-none placeholder-gray-700"
                                                    placeholder="e.g. PlayStation 5 Digital Edition"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2"><Tag size={12} /> Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none"
                                                >
                                                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Type</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none"
                                                >
                                                    <option value="buy">For Sale</option>
                                                    <option value="rent">For Rent</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Pricing & Stock */}
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-6 grid grid-cols-3 gap-6">
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Price (₹)</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                                                    <input
                                                        type="number"
                                                        value={formData.price}
                                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                                        className="w-full bg-black border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white font-mono font-bold focus:border-[#06B6D4] outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Current Stock</label>
                                                <input
                                                    type="number"
                                                    value={formData.stock}
                                                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono font-bold focus:border-[#06B6D4] outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1"><AlertTriangle size={12} /> Low Warning</label>
                                                <input
                                                    type="number"
                                                    value={formData.stock_warning_level}
                                                    onChange={e => setFormData({ ...formData, stock_warning_level: Number(e.target.value) })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-gray-400 font-mono focus:border-[#06B6D4] outline-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Detailed Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-gray-300 h-32 resize-none focus:border-[#06B6D4] outline-none leading-relaxed"
                                                placeholder="Write a comprehensive description of the product, including condition, history, or specific notes..."
                                            />
                                        </div>

                                        {/* Features List */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2"><Box size={14} /> Key Features / Specs</label>
                                            <div className="flex gap-2 mb-3">
                                                <input
                                                    value={newFeature}
                                                    onChange={e => setNewFeature(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddFeature()}
                                                    placeholder="Add a feature (e.g. 825GB SSD) and press Enter"
                                                    className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm text-white focus:border-[#06B6D4] outline-none"
                                                />
                                                <button onClick={handleAddFeature} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl font-bold"><Plus size={18} /></button>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.features.map((feat, i) => (
                                                    <span key={i} className="bg-[#06B6D4]/10 border border-[#06B6D4]/20 text-[#06B6D4] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                                                        {feat}
                                                        <button onClick={() => removeFeature(i)} className="hover:text-white"><X size={12} /></button>
                                                    </span>
                                                ))}
                                                {formData.features.length === 0 && <span className="text-gray-600 text-xs italic">No features added yet.</span>}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-gray-400 font-bold hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                                <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-[#06B6D4] text-black font-black uppercase tracking-wide hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center gap-2">
                                    <Save size={18} /> Save Master Record
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Keeping Checkout Modal Logic */}
            <AnimatePresence>
                {isCheckoutModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h3 className="text-xl font-black text-white uppercase">Confirm Payment</h3>
                                <button onClick={() => setIsCheckoutModalOpen(false)}><X className="text-gray-400 hover:text-white" /></button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* User Selection */}
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <User size={14} /> Associate Customer (Optional)
                                    </p>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none"
                                    >
                                        <option value="">Guest Checkout</option>
                                        {profiles.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="text-center py-4 border-t border-white/5">
                                    <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Total Amount</p>
                                    <h1 className="text-5xl font-black text-white">₹{finalTotal}</h1>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Payment Method</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            onClick={() => setPaymentMethod('cash')}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <Banknote size={24} />
                                            <span className="text-xs font-bold">Cash</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('card')}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <CreditCard size={24} />
                                            <span className="text-xs font-bold">Card</span>
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('upi')}
                                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'upi' ? 'bg-[#06B6D4]/20 border-[#06B6D4] text-[#06B6D4]' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                                        >
                                            <Zap size={24} />
                                            <span className="text-xs font-bold">UPI</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10">
                                <button onClick={completeSale} className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-black uppercase py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
                                    Complete Sale
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
