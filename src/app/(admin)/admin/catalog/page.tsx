"use client";

import { useState, useEffect } from "react";
import { Settings, DollarSign, ToggleLeft, ToggleRight, Gamepad2, Star, Save, RefreshCw, Plus, Edit, Trash2, Search, X, Image as ImageIcon, Filter, Tag, Box, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCatalogSettings, updateCatalogSettings, CatalogSettings } from "@/services/catalog";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/services/products";
import { Product, ProductCategory, ProductType, ProductStatus } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function CatalogPage() {
    const [activeTab, setActiveTab] = useState<'products' | 'settings'>('products');

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-10 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                        Catalog <span className="text-[#8B5CF6]">Manager</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-xs uppercase tracking-widest mt-2">
                        Manage Store Listings & Configuration
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex self-start md:self-auto">
                    <button
                        onClick={() => setActiveTab('products')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Tag size={14} /> Products
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <Settings size={14} /> Settings
                    </button>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {activeTab === 'products' ? (
                    <ProductManager key="products" />
                ) : (
                    <CatalogSettingsPanel key="settings" />
                )}
            </AnimatePresence>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'rent' | 'buy'>('all');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "PS5" as ProductCategory,
        type: "rent" as ProductType,
        price: 0,
        stock: 1,
        stock_warning_level: 2,
        images: [] as string[],
        status: "available" as ProductStatus,
        description: "",
        features: [] as string[]
    });
    const [newFeature, setNewFeature] = useState("");

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts(undefined, undefined, true); // Include hidden
            setProducts(data || []);
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) return alert("Product Name is required");

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData);
            }
            await loadProducts();
            setIsModalOpen(false);
            // Reset form
            setEditingProduct(null);
        } catch (e) {
            console.error(e);
            alert("Failed to save product");
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(id);
                loadProducts();
            } catch (e) { console.error(e) }
        }
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                category: product.category,
                type: product.type,
                price: product.price,
                stock: product.stock,
                stock_warning_level: product.stock_warning_level || 2,
                images: product.images || (product.image ? [product.image] : []) || [],
                status: product.status,
                description: product.description || "",
                features: product.features || []
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                category: "PS5",
                type: "rent",
                price: 0,
                stock: 1,
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

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || p.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#0a0a0a] border border-white/10 p-4 rounded-2xl">
                <div className="flex gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search catalog..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-[#8B5CF6] outline-none"
                        />
                    </div>
                    <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                        {(['all', 'rent', 'buy'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-[#8B5CF6] text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#8B5CF6] hover:bg-[#7c3aed] text-white rounded-xl transition-all font-bold text-sm shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]"
                >
                    <Plus size={18} />
                    <span className="uppercase tracking-wide text-xs font-black">Add Product</span>
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500 animate-pulse">Loading Catalog...</div>
            ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-[#0a0a0a] border border-white/5 rounded-3xl border-dashed">
                    <Tag size={48} className="mx-auto text-gray-700 mb-4" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No products found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="group bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all flex flex-col">
                            <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
                                <img
                                    src={product.images?.[0] || product.image || "https://images.unsplash.com/photo-1550745165-9bc0b252726f"}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-3 left-3 flex gap-2">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${product.type === 'rent' ? 'bg-[#8B5CF6] text-white' : 'bg-emerald-500 text-white'}`}>
                                        {product.type}
                                    </span>
                                    {product.stock <= 0 && (
                                        <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest bg-red-500 text-white">Out of Stock</span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => openModal(product)}
                                        className="p-3 bg-[#8B5CF6] rounded-full text-white hover:scale-110 transition-transform"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        className="p-3 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-white font-bold mb-1 line-clamp-1">{product.name}</h3>
                                <p className="text-gray-500 text-xs mb-4">{product.category}</p>
                                <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                                    <span className="text-[#8B5CF6] font-mono font-bold">₹{product.price}</span>
                                    <span className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
                                        Stock: {product.stock}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                        {editingProduct ? 'Edit Product' : 'New Product'}
                                    </h2>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="bg-white/10 p-2 rounded-lg hover:bg-white/20 text-white"><X size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        {/* Professional Gallery Manager */}
                                        <div className="space-y-4">
                                            <div className="aspect-video bg-black rounded-2xl border border-white/10 relative overflow-hidden group shadow-inner">
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
                                                <label className="aspect-square bg-white/5 border border-dashed border-white/20 rounded-xl flex flex-col gap-2 items-center justify-center cursor-pointer hover:bg-white/10 hover:border-[#8B5CF6]/50 transition-all group/add">
                                                    <Plus size={24} className="text-gray-500 group-hover/add:text-[#8B5CF6] group-hover/add:scale-110 transition-all" />
                                                    <span className="text-[8px] font-black uppercase text-gray-600 group-hover/add:text-[#8B5CF6]">Add Visual</span>
                                                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                                                </label>

                                                {/* Thumbnails with Remove Controls */}
                                                {formData.images.map((img, idx) => (
                                                    <div key={idx} className="aspect-square bg-black rounded-xl border border-white/10 relative group/thumb overflow-hidden ring-1 ring-inset ring-transparent hover:ring-[#8B5CF6]/50 transition-all">
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
                                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#8B5CF6] text-white text-[7px] font-black uppercase rounded-md shadow-lg">
                                                                Primary
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Category</label>
                                                <select
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#8B5CF6]"
                                                >
                                                    {["PS5", "PS4", "Xbox", "VR", "Handheld", "Accessory", "Game"].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Type</label>
                                                <select
                                                    value={formData.type}
                                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-[#8B5CF6]"
                                                >
                                                    <option value="rent">Rental</option>
                                                    <option value="buy">Sale</option>
                                                    <option value="trade-in">Trade-In Item</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Status</label>
                                            <div className="bg-black border border-white/10 rounded-xl p-1 flex">
                                                {(['available', 'rented', 'maintenance', 'hidden'] as const).map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => setFormData({ ...formData, status: s })}
                                                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-[#8B5CF6] text-white' : 'text-gray-500 hover:text-white'}`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Product Name</label>
                                            <input
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white font-bold outline-none focus:border-[#8B5CF6]"
                                                placeholder="e.g. PlayStation 5 Slim"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Price (₹)</label>
                                                <input
                                                    type="number"
                                                    value={formData.price}
                                                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono font-bold outline-none focus:border-[#8B5CF6]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Stock Qty</label>
                                                <input
                                                    type="number"
                                                    value={formData.stock}
                                                    onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                                                    className="w-full bg-black border border-white/10 rounded-xl p-3 text-white font-mono font-bold outline-none focus:border-[#8B5CF6]"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Description</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                rows={4}
                                                className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-gray-300 resize-none outline-none focus:border-[#8B5CF6]"
                                                placeholder="Product description..."
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-gray-500 uppercase mb-2 block">Features (Optional)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    value={newFeature}
                                                    onChange={e => setNewFeature(e.target.value)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' && newFeature) {
                                                            setFormData(p => ({ ...p, features: [...p.features, newFeature] }));
                                                            setNewFeature('');
                                                        }
                                                    }}
                                                    className="flex-1 bg-black border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#8B5CF6]"
                                                    placeholder="Add feature and press Enter"
                                                />
                                                <button
                                                    onClick={() => {
                                                        if (newFeature) {
                                                            setFormData(p => ({ ...p, features: [...p.features, newFeature] }));
                                                            setNewFeature('');
                                                        }
                                                    }}
                                                    className="px-4 bg-white/10 rounded-xl text-white font-bold"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {formData.features.map((f, i) => (
                                                    <span key={i} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-gray-300 flex items-center gap-1">
                                                        {f}
                                                        <button onClick={() => setFormData(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}><X size={10} /></button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3">
                                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Cancel</button>
                                <button onClick={handleSave} className="px-8 py-3 rounded-xl bg-[#8B5CF6] text-white text-xs font-black uppercase tracking-widest hover:bg-[#7c3aed] transition-all flex items-center gap-2">
                                    <Save size={16} /> Save Product
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function CatalogSettingsPanel() {
    const [settings, setSettings] = useState<CatalogSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getCatalogSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load catalog settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (category: string, updates: Partial<CatalogSettings>) => {
        setSaving(category);
        try {
            await updateCatalogSettings(category, updates);
            await loadSettings();
        } catch (error) {
            console.error("Failed to update settings:", error);
            alert("Error updating settings");
        } finally {
            setSaving(null);
        }
    };

    const toggleField = (category: string, field: keyof CatalogSettings) => {
        const setting = settings.find(s => s.device_category === category);
        if (setting) {
            handleUpdate(category, { [field]: !setting[field] });
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-500">Loading Configuration...</div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {settings.map((setting) => (
                <div
                    key={setting.id}
                    className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 space-y-6 relative overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 blur-[60px] -z-10"></div>

                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-wide text-white">
                                {setting.device_category}
                            </h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Display Order: {setting.display_order}
                            </p>
                        </div>
                        {setting.is_featured && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <Star size={12} className="text-amber-500" fill="currentColor" />
                                <span className="text-[9px] font-black uppercase text-amber-500">Featured</span>
                            </div>
                        )}
                    </div>

                    {/* Availability Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Settings size={16} className="text-gray-400" />
                            <span className="text-sm font-bold text-white">Available for Rent</span>
                        </div>
                        <button
                            onClick={() => toggleField(setting.device_category, 'is_enabled')}
                            disabled={saving === setting.device_category}
                            className="transition-transform hover:scale-110"
                        >
                            {setting.is_enabled ? (
                                <ToggleRight size={32} className="text-emerald-500" />
                            ) : (
                                <ToggleLeft size={32} className="text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Featured Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Star size={16} className="text-gray-400" />
                            <span className="text-sm font-bold text-white">Featured Device</span>
                        </div>
                        <button
                            onClick={() => toggleField(setting.device_category, 'is_featured')}
                            disabled={saving === setting.device_category}
                            className="transition-transform hover:scale-110"
                        >
                            {setting.is_featured ? (
                                <ToggleRight size={32} className="text-amber-500" />
                            ) : (
                                <ToggleLeft size={32} className="text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Controller Settings */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
                            <Gamepad2 size={14} />
                            <span>Controller Settings</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-white/5 rounded-lg">
                                <label className="text-[9px] font-black uppercase text-gray-500 block mb-2">
                                    Max Controllers
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="4"
                                    value={setting.max_controllers}
                                    onChange={(e) => handleUpdate(setting.device_category, { max_controllers: Number(e.target.value) })}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold focus:outline-none focus:border-[#8B5CF6]/50"
                                />
                            </div>

                            <div className="p-3 bg-white/5 rounded-lg flex flex-col justify-between">
                                <label className="text-[9px] font-black uppercase text-gray-500 block mb-2">
                                    Extra Controllers
                                </label>
                                <button
                                    onClick={() => toggleField(setting.device_category, 'extra_controller_enabled')}
                                    disabled={saving === setting.device_category}
                                    className="self-start"
                                >
                                    {setting.extra_controller_enabled ? (
                                        <ToggleRight size={24} className="text-emerald-500" />
                                    ) : (
                                        <ToggleLeft size={24} className="text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500">
                            <DollarSign size={14} />
                            <span>Rental Rates</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-white/5 rounded-lg">
                                <label className="text-[8px] font-black uppercase text-gray-500 block mb-1">Daily</label>
                                <div className="text-sm font-bold text-white">₹{setting.daily_rate}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <label className="text-[8px] font-black uppercase text-gray-500 block mb-1">Weekly</label>
                                <div className="text-sm font-bold text-white">₹{setting.weekly_rate}</div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg">
                                <label className="text-[8px] font-black uppercase text-gray-500 block mb-1">Monthly</label>
                                <div className="text-sm font-bold text-white">₹{setting.monthly_rate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Saving Indicator */}
                    {saving === setting.device_category && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                            <div className="flex items-center gap-2 text-white">
                                <RefreshCw size={16} className="animate-spin" />
                                <span className="text-sm font-bold">Saving...</span>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </motion.div>
    );
}

