"use client";

import { useState, useEffect } from "react";
import { getProducts, createProduct, updateProduct, deleteProduct, Product, ProductCategory } from "@/services/products";
import { getTradeInRequests, updateTradeInStatus, TradeInRequest } from "@/services/tradeins";
import { Plus, Search, Edit2, Trash2, Save, X, ShoppingBag, Package, DollarSign, Image as ImageIcon, Tag, Check, Ban, Clock, Inbox, LayoutGrid, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from 'next/link';

export default function BuyAdmin() {
    const [products, setProducts] = useState<Product[]>([]);
    const [tradeIns, setTradeIns] = useState<TradeInRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'inventory' | 'submissions'>('inventory');
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Edit/Create State
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});

    // Trade-In Request Processing State
    const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });
    const [isSaving, setIsSaving] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'inventory') {
                const data = await getProducts('trade-in', undefined, true);
                setProducts(data);
            } else {
                const data = await getTradeInRequests();
                setTradeIns(data);
            }
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const handleCreate = () => {
        setCurrentProduct({
            name: "",
            description: "",
            price: 0,
            category: "PS5",
            stock: 1,
            images: [],
            type: 'trade-in',
            status: 'available'
        });
        setIsEditing(true);
    };

    const handleEdit = (product: Product) => {
        setCurrentProduct({ ...product });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
        try {
            await deleteProduct(id);
            await loadData();
        } catch (error) {
            alert("Failed to delete product");
        }
    };

    const handleSave = async () => {
        if (!currentProduct.name || !currentProduct.price) {
            alert("Name and Price are required!");
            return;
        }

        setIsSaving(true);
        try {
            const payload = { ...currentProduct, type: 'trade-in' } as Partial<Product>;

            if (currentProduct.id) {
                await updateProduct(currentProduct.id, payload);
            } else {
                await createProduct(payload as Product);
            }
            await loadData();
            setIsEditing(false);
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save product");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleStatus = async (product: Product) => {
        try {
            const newStatus = product.status === 'hidden' ? 'available' : 'hidden';
            await updateProduct(product.id, { status: newStatus });
            loadData();
        } catch (e) {
            console.error(e);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const handleApproveRequest = async (request: TradeInRequest) => {
        setProcessingRequests(prev => new Set(prev).add(request.id));
        try {
            await updateTradeInStatus(request.id, 'approved', request.offered_credit);
            showToast(`Trade-in approved! ₹${request.offered_credit} credit offered to ${request.user_name}`, 'success');
            await loadData(); // Reload to update UI
        } catch (error: any) {
            console.error('Failed to approve request:', error);
            showToast(`Failed to approve request: ${error?.message || 'Unknown error'}`, 'error');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
            });
        }
    };

    const handleRejectRequest = async (request: TradeInRequest) => {
        if (!confirm(`Are you sure you want to reject the trade-in request for "${request.item_name}"?`)) return;

        setProcessingRequests(prev => new Set(prev).add(request.id));
        try {
            await updateTradeInStatus(request.id, 'rejected');
            showToast(`Trade-in request rejected for ${request.item_name}`, 'success');
            await loadData(); // Reload to update UI
        } catch (error: any) {
            console.error('Failed to reject request:', error);
            showToast(`Failed to reject request: ${error?.message || 'Unknown error'}`, 'error');
        } finally {
            setProcessingRequests(prev => {
                const newSet = new Set(prev);
                newSet.delete(request.id);
                return newSet;
            });
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-black uppercase tracking-widest italic">Loading Trade-In Center...</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#A855F7] selection:text-white">
            {/* Header */}
            <header className="h-20 border-b border-white/10 bg-[#0A0A0A] flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-8">
                    <h1 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-2">
                        TRADE-IN <span className="text-[#06B6D4]">CENTER</span>
                    </h1>

                    {/* Tab Switcher */}
                    <div className="flex items-center bg-white/5 rounded-full p-1.5 border border-white/5">
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-[#06B6D4] text-black shadow-lg shadow-[#06B6D4]/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} /> Inventory
                        </button>
                        <button
                            onClick={() => setActiveTab('submissions')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'submissions' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Inbox size={14} /> Submissions
                            {tradeIns.filter(t => t.status === 'pending').length > 0 && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            )}
                        </button>
                    </div>
                </div>

                {activeTab === 'inventory' && (
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:scale-105 active:scale-95 bg-[#06B6D4] text-black shadow-[#06B6D4]/20"
                    >
                        <Plus size={16} /> New Item
                    </button>
                )}
            </header>

            <div className="w-full max-w-none mx-auto p-8">
                {/* Search Bar */}
                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search items..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 outline-none transition-all focus:border-[#06B6D4]"
                    />
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    {activeTab === 'inventory' ? (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className={`group bg-[#0A0A0A] border ${product.status === 'hidden' ? 'border-red-900/30 opacity-60' : 'border-white/5'} rounded-2xl overflow-hidden transition-all flex flex-col hover:border-opacity-50 hover:border-[#06B6D4]`}>
                                        <div className="relative aspect-square bg-black/50">
                                            <img
                                                src={product.images?.[0] || "/images/products/ps5.png"}
                                                alt={product.name}
                                                className="w-full h-full object-contain p-4 opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(product)}
                                                    className={`p-2 text-white rounded-lg shadow-lg hover:scale-110 transition-transform ${product.status === 'hidden' ? 'bg-green-600' : 'bg-gray-600'}`}
                                                >
                                                    {product.status === 'hidden' ? <Save size={14} /> : <X size={14} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                                                {product.category}
                                            </div>
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-lg font-bold uppercase italic leading-tight mb-1">{product.name}</h3>
                                            <p className="text-gray-500 text-xs line-clamp-2 mb-4 flex-1">{product.description}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                                <span className="text-xl font-black text-[#06B6D4]">₹{product.price.toLocaleString()}</span>
                                                <span className="text-[10px] bg-[#06B6D4]/20 text-[#06B6D4] px-2 py-0.5 rounded uppercase font-bold">Resell Value</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredProducts.length === 0 && (
                                    <div className="col-span-full flex flex-col items-center justify-center p-20 opacity-50">
                                        <Package size={48} className="text-gray-600 mb-4" />
                                        <p className="text-gray-500 font-bold uppercase tracking-widest">No inventory items found</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="submissions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {tradeIns.map(request => (
                                <div key={request.id} className="bg-[#0A0A0A] border border-white/5 rounded-[2.5rem] p-8 grid grid-cols-1 lg:grid-cols-4 gap-10">
                                    <div className="aspect-square bg-black/50 rounded-3xl overflow-hidden border border-white/5 relative group/img">
                                        <img src={request.images[0]} className="w-full h-full object-contain p-6 opacity-60 group-hover/img:opacity-100 transition-opacity" alt="Trade-in" />
                                        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black text-center">
                                            <span className="text-[9px] px-3 py-1 bg-[#8B5CF6] text-white rounded-full font-black uppercase tracking-widest">{request.category}</span>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-1">{request.item_name}</h3>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                                    Submitted by <span className="text-blue-400 font-bold">{request.user_name}</span>
                                                </p>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full border flex items-center gap-2 ${request.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
                                                request.status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
                                                    'bg-white/5 border-white/5'
                                                }`}>
                                                <Clock size={12} className={
                                                    request.status === 'approved' ? 'text-emerald-500' :
                                                        request.status === 'rejected' ? 'text-red-500' :
                                                            'text-[#8B5CF6]'
                                                } />
                                                <span className={`text-[9px] font-black uppercase tracking-widest ${request.status === 'approved' ? 'text-emerald-400' :
                                                    request.status === 'rejected' ? 'text-red-400' :
                                                        'text-gray-400'
                                                    }`}>
                                                    {request.status === 'pending' ? 'Pending Review' : request.status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5">User-Stated Condition</p>
                                                <p className="text-sm font-bold text-blue-400 flex items-center gap-2">
                                                    <Check size={14} /> {request.condition}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                                <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1.5">Algorithmic Quote</p>
                                                <p className="text-lg font-black text-emerald-500">₹{request.offered_credit.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl">
                                            <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-2">User Notes</p>
                                            <p className="text-xs text-gray-400 leading-relaxed italic">"{request.description}"</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center gap-4">
                                        <button
                                            onClick={() => handleApproveRequest(request)}
                                            disabled={processingRequests.has(request.id) || request.status !== 'pending'}
                                            className="w-full py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingRequests.has(request.id) ? (
                                                <>Processing...</>
                                            ) : (
                                                <>
                                                    <Check size={18} /> Approve Release
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleRejectRequest(request)}
                                            disabled={processingRequests.has(request.id) || request.status !== 'pending'}
                                            className="w-full py-4 bg-white/5 hover:bg-red-500/10 hover:text-red-500 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-red-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processingRequests.has(request.id) ? (
                                                <>Processing...</>
                                            ) : (
                                                <>
                                                    <Ban size={18} /> Decline Quote
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {tradeIns.length === 0 && (
                                <div className="text-center py-24 bg-[#0A0A0A] rounded-[3rem] border border-dashed border-white/10">
                                    <Inbox size={48} className="mx-auto text-gray-800 mb-4" />
                                    <p className="text-gray-500 font-black uppercase tracking-widest">No pending submissions</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f]">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                {currentProduct.id ? <Edit2 size={14} className="text-[#06B6D4]" /> : <Plus size={14} className="text-[#06B6D4]" />}
                                {currentProduct.id ? "Edit Shop Item" : "New Shop Item"}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Product Name</label>
                                    <input
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none font-bold"
                                        placeholder="e.g. PS5 Console"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (₹)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                                        <input
                                            type="number"
                                            value={currentProduct.price}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                            className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white focus:border-[#06B6D4] outline-none font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock Level</label>
                                    <input
                                        type="number"
                                        value={currentProduct.stock}
                                        onChange={e => setCurrentProduct({ ...currentProduct, stock: Number(e.target.value) })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none font-mono"
                                    />
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['PS5', 'Xbox', 'Handheld', 'Game', 'Accessory'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCurrentProduct({ ...currentProduct, category: cat as ProductCategory })}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${currentProduct.category === cat
                                                    ? 'bg-[#06B6D4] text-black border-[#06B6D4]'
                                                    : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-4">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Media Assets</label>

                                    {/* Professional Gallery Manager */}
                                    <div className="space-y-4">
                                        <div className="aspect-video bg-black rounded-2xl border border-white/10 relative overflow-hidden group shadow-inner">
                                            {(currentProduct.images || []).length > 0 ? (
                                                <img src={currentProduct.images![0]} className="w-full h-full object-contain p-6 animate-in fade-in zoom-in-95 duration-500" />
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
                                                <Plus size={24} className="text-gray-500 group-hover/add:text-[#06B6D4] group-hover/add:scale-110 transition-all" />
                                                <span className="text-[8px] font-black uppercase text-gray-600 group-hover/add:text-[#06B6D4]">Add Visual</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                        const files = e.target.files;
                                                        if (files && files.length > 0) {
                                                            Array.from(files).forEach(file => {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    if (reader.result) {
                                                                        setCurrentProduct(prev => ({
                                                                            ...prev,
                                                                            images: [...(prev.images || []), reader.result as string]
                                                                        }));
                                                                    }
                                                                };
                                                                reader.readAsDataURL(file);
                                                            });
                                                        }
                                                    }}
                                                />
                                            </label>

                                            {/* Thumbnails with Remove Controls */}
                                            {(currentProduct.images || []).map((img, idx) => (
                                                <div key={idx} className="aspect-square bg-black rounded-xl border border-white/10 relative group/thumb overflow-hidden ring-1 ring-inset ring-transparent hover:ring-[#06B6D4]/50 transition-all">
                                                    <img src={img} className="w-full h-full object-contain p-2 opacity-60 group-hover/thumb:opacity-100 transition-opacity" />

                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setCurrentProduct(prev => ({
                                                                ...prev,
                                                                images: (prev.images || []).filter((_, i) => i !== idx)
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

                                <div className="col-span-2 space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                                    <textarea
                                        rows={4}
                                        value={currentProduct.description}
                                        onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        className="w-full bg-black border border-white/10 rounded-xl p-3 text-white focus:border-[#06B6D4] outline-none resize-none text-sm"
                                        placeholder="Detailed info..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-[#0f0f0f] flex justify-end gap-4">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-8 right-8 z-[200] max-w-md"
                    >
                        <div className={`px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-center gap-3 ${toast.type === 'success'
                            ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100'
                            : 'bg-red-950/90 border-red-500/30 text-red-100'
                            }`}>
                            {toast.type === 'success' ? (
                                <CheckCircle size={20} className="flex-shrink-0" />
                            ) : (
                                <AlertTriangle size={20} className="flex-shrink-0" />
                            )}
                            <p className="text-sm font-medium">{toast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
