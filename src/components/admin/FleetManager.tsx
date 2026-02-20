"use client";

import { useState, useEffect, FormEvent } from "react";
import { Monitor, Search, Plus, Filter, HardDrive, User, Calendar, AlertCircle, CheckCircle2, MoreVertical, Settings, ArrowUpRight, X, Activity, ClipboardList, Gamepad2, DollarSign, Tag, Layers, ToggleLeft, ToggleRight, Star, Percent, Save, Trash2, Zap, Shield, TrendingUp, Edit2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DeviceSchema } from "@/lib/schemas";
import { getAllDevices, updateDeviceStatus, getDeviceHistory, createDevice, updateDevice, deleteDevice, duplicateDevice, DeviceHistoryLog } from "@/services/admin";
import { getCatalogSettings, updateCatalogSettings, CatalogSettings, renameCategory } from "@/services/catalog";
import { getAllOffers, updateOffer, createOffer, PromotionalOffer } from "@/services/offers";
import { Rental, Device } from "@/types";
import { QRGenerator } from "./QRGenerator";
import { QuickActionsMenu } from "./QuickActionsMenu";
import { QrCode, HardDrive as ConnectorIcon } from "lucide-react";
import { format } from "date-fns";
import { FleetMergedView } from "./FleetMergedView";
import { LayoutGrid, List, Layers as LayersIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

type EditTab = 'unit' | 'category' | 'pricing' | 'offers' | 'history';
type ViewMode = 'matrix' | 'list' | 'merged';

export function FleetManager({ hideHeader = false }: { hideHeader?: boolean }) {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();

    const { data: devices = [], isLoading: loading } = useQuery<Device[]>({
        queryKey: ['adminDevices'],
        queryFn: getAllDevices
    });

    const { data: categories = [] } = useQuery<CatalogSettings[]>({
        queryKey: ['adminCategories'],
        queryFn: getCatalogSettings
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    // History Modal State
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [unitHistory, setUnitHistory] = useState<DeviceHistoryLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Edit Device State
    const [isEditing, setIsEditing] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [activeEditTab, setActiveEditTab] = useState<EditTab>('unit');
    const [editingCatalog, setEditingCatalog] = useState<CatalogSettings | null>(null);
    const [offers, setOffers] = useState<PromotionalOffer[]>([]);
    const [loadingSettings, setLoadingSettings] = useState(false);

    // Add Device State
    const [isAdding, setIsAdding] = useState(false);
    const [newDevice, setNewDevice] = useState<{
        model: string;
        serialNumber: string;
        category: string;
        health: number;
        notes: string;
        cost: number;
        supplier: string;
        purchaseDate: string;
        warrantyExpiry: string;
        connectors: string;
        asset_records: string;
        controllers: number;
        storage_gb: number;
        firmware_version: string;
        quantity: number;
    }>({
        model: "",
        serialNumber: "",
        category: categories[0]?.device_category || "",
        health: 100,
        notes: "",
        cost: 0,
        supplier: "",
        purchaseDate: "",
        warrantyExpiry: "",
        connectors: "",
        asset_records: "",
        controllers: 1,
        storage_gb: 825,
        firmware_version: "1.0.0",
        quantity: 1
    });

    const PRESETS = [
        { name: 'PS5', model: 'PlayStation 5', category: 'PS5', connectors: 'HDMI 2.1, USB-C, LAN', storage: 825, firmware: '24.0.0', controllers: 1, icon: <Zap size={14} /> },
        { name: 'Xbox Series X', model: 'Xbox Series X', category: 'Xbox', connectors: 'HDMI 2.1, LAN', storage: 1024, firmware: '10.0.0', controllers: 1, icon: <Monitor size={14} /> },
        { name: 'Switch OLED', model: 'Nintendo Switch OLED', category: 'Switch', connectors: 'HDMI, USB-C', storage: 64, firmware: '18.1.0', controllers: 2, icon: <Gamepad2 size={14} /> },
        { name: 'Quest 3', model: 'Meta Quest 3', category: 'VR', connectors: 'USB-C', storage: 128, firmware: '65.0.0', controllers: 2, icon: <Activity size={14} /> },
    ];

    interface DevicePreset {
        name: string;
        model: string;
        category: string;
        connectors: string;
        storage: number;
        firmware: string;
        controllers: number;
        icon: React.ReactNode;
    }

    const applyPreset = (preset: DevicePreset) => {
        setNewDevice(prev => ({
            ...prev,
            model: preset.model,
            category: preset.category,
            connectors: preset.connectors,
            controllers: preset.controllers,
            storage_gb: preset.storage,
            firmware_version: preset.firmware,
            quantity: 1
        }));
    };

    const [newOffer, setNewOffer] = useState<{
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        min_rental_days: number;
    }>({
        code: "",
        discount_type: 'fixed',
        discount_value: 0,
        min_rental_days: 1
    });

    const [qrDevice, setQrDevice] = useState<Device | null>(null);
    const [isShowingQR, setIsShowingQR] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('matrix');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: Device['status'] }) => updateDeviceStatus(id, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDevices'] })
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDevice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
            setIsEditing(false);
            setEditingDevice(null);
        }
    });

    const duplicateMutation = useMutation({
        mutationFn: duplicateDevice,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminDevices'] })
    });

    const createMutation = useMutation({
        mutationFn: createDevice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
            setIsAdding(false);
            setNewDevice({
                model: "",
                serialNumber: "",
                category: categories[0]?.device_category || "",
                health: 100,
                notes: "",
                cost: 0,
                supplier: "",
                purchaseDate: "",
                warrantyExpiry: "",
                connectors: "",
                asset_records: "",
                controllers: 1,
                storage_gb: 825,
                firmware_version: "1.0.0",
                quantity: 1
            });
        },
        onError: (error) => {
            console.error("Device creation failed:", error);
            alert(`Failed to create device: ${error.message}`);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<Device> }) => updateDevice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
            setIsEditing(false);
            setEditingDevice(null);
        }
    });

    const isSubmitting = updateStatusMutation.isPending ||
        deleteMutation.isPending ||
        duplicateMutation.isPending ||
        createMutation.isPending ||
        updateMutation.isPending;

    const [isBulkOnboarding, setIsBulkOnboarding] = useState(false);

    const generateNextSerial = () => {
        if (!devices || devices.length === 0) return 'SN-000001';
        const maxSerial = devices.reduce((max: number, device: Device) => {
            if (!device.serialNumber) return max;
            const match = device.serialNumber.match(/SN-(\d+)/);
            if (match) {
                const num = parseInt(match[1]);
                return num > max ? num : max;
            }
            return max;
        }, 0);
        return `SN-${(maxSerial + 1).toString().padStart(6, '0')}`;
    };

    const handleStartAdd = () => {
        setNewDevice(prev => ({
            ...prev,
            serialNumber: generateNextSerial()
        }));
        setIsAdding(true);
    };

    const handleDeleteDevice = async (id: string) => {
        if (!confirm("Are you SURE you want to retire this unit?")) return;
        deleteMutation.mutate(id);
    };

    const handleDuplicateDevice = async (device: Device) => {
        if (!confirm(`Clone ${device.model}?`)) return;
        duplicateMutation.mutate(device.id);
    };

    const handleQuickStatusChange = async (deviceId: string, newStatus: Device['status']) => {
        updateStatusMutation.mutate({ id: deviceId, status: newStatus });
    };

    const viewHistory = async (device: Device) => {
        setSelectedDevice(device);
        setLoadingHistory(true);
        try {
            const logs = await getDeviceHistory(device.id);
            setUnitHistory(logs);
        } catch (error) {
            console.error("Failed to load history:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const loadSettingsForUnit = async (category: string) => {
        setLoadingSettings(true);
        try {
            const [catSettings, allOffers] = await Promise.all([
                getCatalogSettings(),
                getAllOffers()
            ]);
            const currentCat = catSettings.find(c => c.device_category === category);
            setEditingCatalog(currentCat || null);
            setOffers(allOffers.filter(o => o.applicable_categories?.includes(category)));
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleEditDevice = (device: Device) => {
        setEditingDevice(device);
        setActiveEditTab('unit');
        setIsEditing(true);
        loadSettingsForUnit(device.category);
    };

    const handleEditCategory = async (category: string) => {
        setEditingDevice(null); // No specific unit
        setActiveEditTab('category');
        setIsEditing(true);
        await loadSettingsForUnit(category);
    };

    const [showCopyModal, setShowCopyModal] = useState(false);
    const [copyTargetCategory, setCopyTargetCategory] = useState<string>("");

    const [isRenaming, setIsRenaming] = useState(false);
    const [renamedCategory, setRenamedCategory] = useState("");

    const handleRenameCategory = async () => {
        if (!editingCatalog || !renamedCategory.trim() || renamedCategory === editingCatalog.device_category) {
            setIsRenaming(false);
            return;
        }

        try {
            await renameCategory(editingCatalog.device_category, renamedCategory.trim());
            queryClient.invalidateQueries({ queryKey: ['adminCatalog'] });
            queryClient.invalidateQueries({ queryKey: ['adminDevices'] });

            // Update local state to reflect rename immediately
            setEditingCatalog({ ...editingCatalog, device_category: renamedCategory.trim() });
            setIsRenaming(false);
        } catch (error) {
            console.error("Rename failed:", error);
            alert("Error during identity shift.");
        }
    };

    // Engine Params Tuning State
    const [tuning, setTuning] = useState<{ field: string } | null>(null);
    const [tuningValue, setTuningValue] = useState("");
    const [tuningFeatures, setTuningFeatures] = useState<string[]>([]);

    const handleTuneStart = (field: string, currentValue: any) => {
        setTuning({ field });
        if (field === 'features') {
            setTuningFeatures(Array.isArray(currentValue) ? [...currentValue] : []);
            setTuningValue("");
        } else {
            setTuningValue(currentValue?.toString() || "");
        }
    };

    const handleTuneSave = async () => {
        if (!tuning || !editingCatalog) return;

        try {
            const updates: any = {};
            if (tuning.field === 'features') {
                updates.features = tuningFeatures;
            } else {
                updates[tuning.field] = Number(tuningValue);
            }

            await handleUpdateCatalog(updates);
            setTuning(null);
            queryClient.invalidateQueries({ queryKey: ['adminCatalog'] });
        } catch (error) {
            console.error("Failed to update engine param:", error);
            alert("Error updating parameter");
        }
    };

    const handleAddTuningFeature = () => {
        if (tuningValue.trim()) {
            setTuningFeatures([...tuningFeatures, tuningValue.trim()]);
            setTuningValue("");
        }
    };

    const handleRemoveTuningFeature = (index: number) => {
        setTuningFeatures(tuningFeatures.filter((_, i) => i !== index));
    };

    const handleUpdateCatalog = async (updates: Partial<CatalogSettings>) => {
        if (!editingCatalog) return;
        try {
            await updateCatalogSettings(editingCatalog.device_category, updates);
            await loadSettingsForUnit(editingCatalog.device_category);
            queryClient.invalidateQueries({ queryKey: ['adminCatalog'] });
        } catch (error) {
            console.error("Failed to update catalog:", error);
            alert("Error updating catalog settings");
        }
    };

    const handleCopySettings = async () => {
        if (!editingCatalog || !copyTargetCategory) return;

        try {
            // Copy relevant settings (exclude ID, category name, display order)
            const updates: Partial<CatalogSettings> = {
                is_enabled: editingCatalog.is_enabled,
                is_featured: editingCatalog.is_featured,
                max_controllers: editingCatalog.max_controllers,
                extra_controller_enabled: editingCatalog.extra_controller_enabled,
                daily_rate: editingCatalog.daily_rate,
                weekly_rate: editingCatalog.weekly_rate,
                monthly_rate: editingCatalog.monthly_rate,
                controller_daily_rate: editingCatalog.controller_daily_rate,
                controller_weekly_rate: editingCatalog.controller_weekly_rate,
                controller_monthly_rate: editingCatalog.controller_monthly_rate,
                features: editingCatalog.features
            };

            await updateCatalogSettings(copyTargetCategory, updates);
            alert(`Configuration copied to ${copyTargetCategory}`);
            setShowCopyModal(false);
            setCopyTargetCategory("");
        } catch (error) {
            console.error("Failed to copy settings:", error);
            alert("Error copying settings");
        }
    };

    const toggleOfferStatus = async (id: string, currentStatus: boolean) => {
        try {
            await updateOffer(id, { is_active: !currentStatus });
            if (editingDevice) await loadSettingsForUnit(editingDevice.category);
            else if (editingCatalog) await loadSettingsForUnit(editingCatalog.device_category);
        } catch (error) {
            console.error("Failed to toggle offer:", error);
            alert("Error updating offer status");
        }
    };

    const handleCreateOffer = async (e: FormEvent) => {
        e.preventDefault();
        if (!newOffer.code || (!editingCatalog && !editingDevice)) return;

        const category = editingCatalog ? editingCatalog.device_category : editingDevice?.category;
        if (!category) return;

        try {
            await createOffer({
                ...newOffer,
                title: `${newOffer.code} Special`,
                description: `Special offer for ${category}`,
                max_uses: null,
                valid_from: new Date().toISOString(),
                valid_until: null,
                is_active: true,
                applicable_categories: [category]
            });
            await loadSettingsForUnit(category);
            setNewOffer({
                code: "",
                discount_type: 'fixed',
                discount_value: 0,
                min_rental_days: 1
            });
        } catch (error) {
            console.error("Failed to create offer:", error);
            alert("Error creating offer");
        }
    };

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const handleAddDevice = async (e: FormEvent) => {
        e.preventDefault();
        setValidationErrors({});

        // Exclude quantity from schema validation and payload
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { quantity, ...deviceData } = newDevice;

        const payload = {
            ...deviceData,
            connectors: newDevice.connectors.split(',').map(s => s.trim()).filter(Boolean),
            asset_records: newDevice.asset_records.split(',').map(s => s.trim()).filter(Boolean)
        };

        const result = DeviceSchema.safeParse(payload);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as string] = issue.message;
            });
            setValidationErrors(errors);
            return;
        }

        if (newDevice.quantity > 1) {
            setIsBulkOnboarding(true);
            try {
                const requests = [];
                for (let i = 0; i < newDevice.quantity; i++) {
                    let serial = newDevice.serialNumber;
                    const match = serial.match(/(.*?)(\d+)$/);

                    if (match) {
                        const prefix = match[1];
                        const numStr = match[2];
                        const num = parseInt(numStr);
                        // Increment for each subsequent device (0-indexed i, so i=0 is original)
                        const nextNum = num + i;
                        serial = `${prefix}${(nextNum).toString().padStart(numStr.length, '0')}`;
                    } else {
                        // If no number at end, append counter only for subsequent (or all? let's do all to be safe if strictly 3)
                        // Actually if user says "PS5", quantity 2. -> PS5-1, PS5-2 is better.
                        // If user says "PS5-1", quantity 2. -> PS5-1, PS5-2.
                        if (newDevice.quantity > 1) {
                            serial = `${newDevice.serialNumber}-${i + 1}`;
                        }
                    }

                    // Use the original payload but update serial
                    const itemPayload = { ...payload, serialNumber: serial };
                    requests.push(createDevice(itemPayload));
                }

                await Promise.all(requests);
                queryClient.invalidateQueries({ queryKey: ['adminDevices'] });
                setIsAdding(false);
                setNewDevice({
                    model: "",
                    serialNumber: "",
                    category: categories[0]?.device_category || "",
                    health: 100,
                    notes: "",
                    cost: 0,
                    supplier: "",
                    purchaseDate: "",
                    warrantyExpiry: "",
                    connectors: "",
                    asset_records: "",
                    controllers: 1,
                    storage_gb: 825,
                    firmware_version: "1.0.0",
                    quantity: 1
                });
            } catch (error) {
                console.error("Bulk onboard failed:", error);
                alert("Failed to onboard some units.");
            } finally {
                setIsBulkOnboarding(false);
            }
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleUpdateDevice = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingDevice) return;
        setValidationErrors({});

        const result = DeviceSchema.safeParse(editingDevice);
        if (!result.success) {
            const errors: Record<string, string> = {};
            result.error.issues.forEach(issue => {
                errors[issue.path[0] as string] = issue.message;
            });
            setValidationErrors(errors);
            return;
        }

        updateMutation.mutate({ id: editingDevice.id, data: editingDevice });
    };


    useEffect(() => {


        // Handle URL search params
        const search = searchParams.get('search');
        const category = searchParams.get('category');

        if (search) {
            setSearchTerm(search);
            // Auto switch to list view if searching specific item
            if (search.startsWith('SN-')) setViewMode('list');
        }

        if (category) {
            setActiveCategory(category);
        }
    }, [searchParams]);

    const filteredDevices = devices.filter((d: Device) =>
        d && ((d.serialNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (d.model?.toLowerCase() || "").includes(searchTerm.toLowerCase())) &&
        (filterStatus === "all" || d.status?.toLowerCase() === filterStatus.toLowerCase()) &&
        (activeCategory === 'all' || d.category === activeCategory)
    );

    const getStatusColor = (status: Device['status'] | undefined) => {
        switch (status) {
            case 'Ready': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Rented': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'Maintenance': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'Under-Repair': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const uniqueCategories = ['all', ...Array.from(new Set(devices.map((d: Device) => d.category).filter(Boolean)))];

    if (loading) return <div className="py-20 flex items-center justify-center text-white font-black uppercase tracking-widest italic animate-pulse">Initializing Unit Matrix...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 text-white pb-20">
            {/* Header Controls */}
            {!hideHeader && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">
                                Hardware <span className="text-[#8B5CF6]">Unit Matrix</span>
                            </h1>
                            <p className="text-gray-500 font-mono text-[10px] uppercase tracking-widest mt-1">Real-time Asset Identification & Status</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-white/5 p-1 rounded-xl border border-white/10 flex">
                                <button
                                    onClick={() => setViewMode('matrix')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'matrix' ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <LayoutGrid size={12} /> Matrix
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <List size={12} /> List
                                </button>
                                <button
                                    onClick={() => setViewMode('merged')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'merged' ? 'bg-[#8B5CF6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <LayersIcon size={12} /> Models
                                </button>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Find Serial..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-full py-2 pl-9 pr-4 text-xs text-white focus:border-[#8B5CF6] outline-none transition-all w-48 focus:w-64"
                                />
                            </div>
                            <button
                                onClick={handleStartAdd}
                                className="bg-[#8B5CF6] hover:bg-[#7C3AED] px-5 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                            >
                                <Plus size={14} /> NEW UNIT
                            </button>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-white/5">
                        {uniqueCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-6 py-2 rounded-full whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all border ${activeCategory === category
                                    ? 'bg-[#8B5CF6] text-white border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/10 hover:text-white'
                                    }`}
                            >
                                {category === 'all' ? 'All Units' : category}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Device Views */}
            {viewMode === 'merged' && (
                <FleetMergedView
                    devices={filteredDevices}
                    onSelectModel={(model) => {
                        setSearchTerm(model);
                        setViewMode('list');
                    }}
                    onEditCategory={handleEditCategory}
                />
            )}
            {viewMode === 'list' && (
                <div className="bg-[#0a0a0a]/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
                    <div className="grid grid-cols-1 divide-y divide-white/5">
                        <div className="grid grid-cols-12 gap-4 p-6 bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
                            <div className="col-span-1">Status</div>
                            <div className="col-span-3">Identification</div>
                            <div className="col-span-2 text-center">Protocol</div>
                            <div className="col-span-2 text-center">Integrity</div>
                            <div className="col-span-2">Operator</div>
                            <div className="col-span-2 text-right pr-4">Directives</div>
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredDevices.map((device: Device) => (
                                <motion.div
                                    layout
                                    key={device.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-12 gap-4 p-6 items-center group hover:bg-[#8B5CF6]/5 transition-all relative"
                                >
                                    <div className="col-span-1">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className={`w-2 h-2 rounded-full ${device.status === 'Ready' ? 'bg-emerald-500 animate-pulse' : device.status === 'Rented' ? 'bg-blue-500' : 'bg-red-500'}`} />
                                                <div className={`absolute -inset-1 rounded-full opacity-20 ${device.status === 'Ready' ? 'bg-emerald-500 blur-sm animate-ping' : ''}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-[#8B5CF6] transition-colors">{device.model}</span>
                                            <span className="text-[9px] font-mono text-gray-500 italic uppercase">{device.serialNumber}</span>
                                            {(device.connectors?.length ?? 0) > 0 && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {device.connectors?.map((conn, idx) => (
                                                        <span key={idx} className="text-[7px] bg-white/5 border border-white/10 px-1 py-0.5 rounded text-gray-400 capitalize">{conn}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-span-2 text-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{device.category}</span>
                                    </div>

                                    <div className="col-span-2">
                                        <div className="flex flex-col gap-1.5 px-4">
                                            <div className="flex justify-between text-[7px] font-black uppercase text-gray-600">
                                                <span>{device.health}%</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 ${device.health > 80 ? 'bg-emerald-500' : device.health > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${device.health}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        {device.currentUser ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                    <User size={10} className="text-blue-400" />
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-300 truncate">{device.currentUser}</span>
                                            </div>
                                        ) : (
                                            <span className="text-[8px] font-black text-gray-700 uppercase italic">Awaiting Pilot</span>
                                        )}
                                    </div>

                                    <div className="col-span-2 flex items-center justify-end gap-2 opacity-100 pr-2">
                                        <button onClick={() => { setQrDevice(device); setIsShowingQR(true); }} className="p-2 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 rounded-lg text-[#8B5CF6] transition-all" title="Generate QR / ID"><QrCode size={14} /></button>
                                        <QuickActionsMenu
                                            device={device}
                                            onStatusChange={handleQuickStatusChange}
                                            onEdit={handleEditDevice}
                                            onViewHistory={viewHistory}
                                            onDuplicate={handleDuplicateDevice}
                                            onDelete={handleDeleteDevice}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {viewMode === 'matrix' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredDevices.map((device: Device) => (
                            <motion.div
                                layout
                                key={device.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-5 space-y-5 group hover:border-[#8B5CF6]/30 transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 blur-[60px] -z-10 group-hover:bg-[#8B5CF6]/10 transition-colors"></div>

                                <div className="flex justify-between items-start">
                                    <div className="flex flex-col gap-1">
                                        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-[#8B5CF6]/10 transition-colors border border-white/5 w-fit">
                                            <HardDrive className={`text-gray-400 group-hover:text-[#8B5CF6] transition-colors`} size={18} />
                                        </div>
                                        <span className="text-[7px] font-black uppercase tracking-widest text-[#8B5CF6] px-1">{device.category}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${getStatusColor(device.status)}`}>
                                            {device.status}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-tight text-white mb-0.5">{device.model}</h3>
                                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest italic mb-2">{device.serialNumber}</p>

                                    {(device.connectors?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <ConnectorIcon size={10} className="text-gray-500" />
                                            {device.connectors?.map((conn, idx) => (
                                                <span key={idx} className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter border-b border-white/10">{conn}</span>
                                            ))}
                                        </div>
                                    )}

                                    {(device.asset_records?.length ?? 0) > 0 && (
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <ClipboardList size={10} className="text-gray-500" />
                                            {device.asset_records?.map((ar, idx) => (
                                                <span key={idx} className="text-[8px] font-mono text-[#8B5CF6] uppercase">{ar}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Unit Integrity</span>
                                        <span>{device.health}%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${device.health > 80 ? 'bg-emerald-500' : device.health > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                            style={{ width: `${device.health}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                    {device.currentUser ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                                <User size={10} className="text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300 truncate max-w-[80px]">{device.currentUser}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9px] font-black text-gray-600 uppercase italic">Idle</span>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => {
                                                setQrDevice(device);
                                                setIsShowingQR(true);
                                            }}
                                            className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center gap-1 group/qr"
                                        >
                                            <QrCode size={10} className="group-hover/qr:scale-110 transition-transform" />
                                            QR
                                        </button>
                                        <button
                                            onClick={() => handleEditDevice(device)}
                                            className="text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            EDIT
                                        </button>
                                        <button
                                            onClick={() => viewHistory(device)}
                                            className="text-[9px] font-black uppercase tracking-widest text-[#8B5CF6] hover:text-[#A78BFA] transition-colors flex items-center gap-1 group/btn"
                                        >
                                            LOGS
                                            <ArrowUpRight size={10} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                        </button>
                                        <Link
                                            href={`/admin/maintenance?device=${device.id}`}
                                            className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
                                        >
                                            QC
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* History Modal (Ported) */}
            <AnimatePresence>
                {selectedDevice && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0A0A0A] border border-white/10 w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
                        >
                            <div className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-[#0f0f0f]">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#8B5CF6]/10 rounded-full flex items-center justify-center text-[#8B5CF6]">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black uppercase tracking-widest leading-none mb-1">UNIT LOGS : <span className="text-[#8B5CF6]">{selectedDevice.serialNumber}</span></h2>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase">{selectedDevice.model}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedDevice(null)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
                                {loadingHistory ? (
                                    <div className="py-20 text-center text-xs font-black uppercase tracking-[0.3em] text-gray-600 italic animate-pulse">Scanning historical data...</div>
                                ) : (
                                    <div className="space-y-8 relative">
                                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8B5CF6]/30 via-transparent to-transparent " />

                                        {unitHistory.map((log, i) => (
                                            <div key={i} className="relative pl-12">
                                                <div className="absolute left-[18px] top-1.5 w-3 h-3 bg-[#0A0A0A] border-2 border-[#8B5CF6] rounded-full z-10 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                                                <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl group hover:border-[#8B5CF6]/20 transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">{log.event}</span>
                                                        <span className="text-[9px] font-mono text-gray-600">{log.date}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-300 font-medium mb-2 leading-relaxed">"{log.notes}"</p>
                                                    {log.user && (
                                                        <div className="flex items-center gap-2 mt-3 p-2 bg-black/40 rounded-lg">
                                                            <User size={10} className="text-blue-400" />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter text-gray-500">Related User: <span className="text-white">{log.user}</span></span>
                                                        </div>
                                                    )}
                                                    {log.health_change && (
                                                        <div className={`mt-2 text-[9px] font-black uppercase ${log.health_change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            Health Impact: {log.health_change > 0 ? '+' : ''}{log.health_change}%
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-[#0f0f0f] border-t border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-gray-600 uppercase">Current Health</span>
                                        <span className={`text-xl font-black italic ${selectedDevice.health > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedDevice.health}%</span>
                                    </div>
                                    <div className="w-24 h-1.5 bg-black rounded-full overflow-hidden">
                                        <div className={`h-full bg-${selectedDevice.health > 80 ? 'emerald' : 'amber'}-500`} style={{ width: `${selectedDevice.health}%` }} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] uppercase font-black text-gray-500">
                                    <div className="flex justify-between w-40 border-b border-white/5 pb-1"><span>Purchased:</span> <span className="text-white">{selectedDevice.purchaseDate || 'N/A'}</span></div>
                                    <div className="flex justify-between w-40 border-b border-white/5 pb-1"><span>Warranty:</span> <span className="text-white">{selectedDevice.warrantyExpiry || 'N/A'}</span></div>
                                    <div className="flex justify-between w-40 border-b border-white/5 pb-1"><span>Cost:</span> <span className="text-white">₹{selectedDevice.cost || 0}</span></div>
                                    <div className="flex justify-between w-40 border-b border-white/5 pb-1"><span>Supplier:</span> <span className="text-white">{selectedDevice.supplier || 'N/A'}</span></div>
                                    <div className="flex flex-col gap-1 w-40 mt-2">
                                        <span className="flex items-center gap-1"><ConnectorIcon size={10} /> CONNECTORS:</span>
                                        <span className="text-white truncate">{selectedDevice.connectors?.join(', ') || 'NONE'}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 w-40 mt-2">
                                        <span className="flex items-center gap-1"><ClipboardList size={10} /> ASSETS:</span>
                                        <span className="text-[#8B5CF6] truncate">{selectedDevice.asset_records?.join(', ') || 'NONE'}</span>
                                    </div>
                                </div>
                                <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all">
                                    Download Full Audit
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Device / Master Control Modal */}
            <AnimatePresence>
                {isEditing && (editingDevice || editingCatalog) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="h-24 border-b border-white/10 flex items-center justify-between px-10 bg-[#0f0f0f]">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-gray-400">
                                        {editingDevice ? <Monitor size={24} /> : <Layers size={24} />}
                                    </div>
                                    <div>
                                        {editingDevice ? (
                                            <>
                                                <h2 className="text-sm font-black uppercase tracking-widest leading-none mb-1">UNIT CONFIGURATION : <span className="text-[#8B5CF6]">{editingDevice.serialNumber}</span></h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{editingDevice.model}</p>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="text-sm font-black uppercase tracking-widest leading-none mb-1">MASTER CONTROLS : <span className="text-[#8B5CF6]">{editingCatalog?.device_category || 'LOADING...'}</span></h2>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">Global Category Configuration</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex bg-black p-1 rounded-xl border border-white/10">
                                    {editingDevice && (
                                        <button
                                            onClick={() => setActiveEditTab('unit')}
                                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeEditTab === 'unit' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                                                }`}
                                        >
                                            Unit
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setActiveEditTab('category')}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeEditTab === 'category' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        Category
                                    </button>
                                    <button
                                        onClick={() => setActiveEditTab('pricing')}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeEditTab === 'pricing' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        Pricing
                                    </button>
                                    <button
                                        onClick={() => setActiveEditTab('offers')}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeEditTab === 'offers' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        Offers
                                    </button>
                                    {editingDevice && (
                                        <button
                                            onClick={() => {
                                                setActiveEditTab('history');
                                                viewHistory(editingDevice);
                                            }}
                                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeEditTab === 'history' ? 'bg-[#8B5CF6] text-white shadow-lg' : 'text-gray-500 hover:text-white'
                                                }`}
                                        >
                                            History
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {/* UNIT DETAIL TAB */}
                                    {activeEditTab === 'unit' && editingDevice && (
                                        <motion.div
                                            key="unit"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                {/* LEFT COLUMN: TELEMETRY & STATUS */}
                                                <div className="lg:col-span-1 space-y-6">
                                                    <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden group">
                                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 opacity-20">00</div>

                                                        {/* CIRCULAR TELEMETRY GAUGE */}
                                                        <div className="relative flex items-center justify-center w-40 h-40">
                                                            <svg className="w-full h-full transform -rotate-90">
                                                                <circle
                                                                    cx="80" cy="80" r="70"
                                                                    stroke="currentColor"
                                                                    strokeWidth="8"
                                                                    fill="transparent"
                                                                    className="text-white/5"
                                                                />
                                                                <circle
                                                                    cx="80" cy="80" r="70"
                                                                    stroke={editingDevice.health > 80 ? '#10B981' : editingDevice.health > 50 ? '#F59E0B' : '#EF4444'}
                                                                    strokeWidth="8"
                                                                    strokeDasharray={2 * Math.PI * 70}
                                                                    strokeDashoffset={2 * Math.PI * 70 - ((editingDevice.health || 0) / 100) * (2 * Math.PI * 70)}
                                                                    strokeLinecap="round"
                                                                    fill="transparent"
                                                                    className="transition-all duration-1000 ease-out drop-shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                                                />
                                                            </svg>
                                                            <div className="absolute flex flex-col items-center justify-center">
                                                                <span className="text-4xl font-black text-white">{editingDevice.health}%</span>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Integrity</span>
                                                            </div>
                                                        </div>

                                                        <div className="w-full space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-600 tracking-widest">
                                                                    <span>Manual Calibration</span>
                                                                    <span className="text-[#8B5CF6] font-mono">{editingDevice.health}/100</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    min="0" max="100"
                                                                    value={editingDevice.health}
                                                                    onChange={e => {
                                                                        const newHealth = Number(e.target.value);
                                                                        let newStatus = editingDevice.status;
                                                                        if (newHealth < 60 && editingDevice.status === 'Ready') {
                                                                            newStatus = 'Maintenance';
                                                                        }
                                                                        setEditingDevice({ ...editingDevice, health: newHealth, status: newStatus });
                                                                    }}
                                                                    className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#8B5CF6]"
                                                                />
                                                            </div>

                                                            <div className="pt-4 space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2">
                                                                        <Layers size={10} className="text-gray-400" /> Operational Status
                                                                    </label>
                                                                    <select
                                                                        value={editingDevice.status}
                                                                        onChange={e => setEditingDevice({ ...editingDevice, status: e.target.value as Device['status'] })}
                                                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-bold text-xs appearance-none"
                                                                    >
                                                                        <option value="Ready">Ready</option>
                                                                        <option value="Maintenance">Maintenance</option>
                                                                        <option value="Under-Repair">Hardware Failure</option>
                                                                        <option value="Rented" disabled>Active Rental</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* DECOMMISSION ACTION */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteDevice(editingDevice.id)}
                                                        className="w-full bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-2 transition-all group"
                                                    >
                                                        <Trash2 size={24} className="text-red-500/40 group-hover:text-red-500 transition-colors" />
                                                        <div className="text-[10px] font-black uppercase text-red-500/60 group-hover:text-red-500 tracking-[0.3em]">Decommission Unit</div>
                                                        <div className="text-[8px] text-gray-600 font-bold italic uppercase">Permanent removal from fleet matrix</div>
                                                    </button>
                                                </div>

                                                {/* RIGHT COLUMN: MODULAR FIELDSETS */}
                                                <div className="lg:col-span-2 space-y-6">
                                                    <form onSubmit={handleUpdateDevice} className="space-y-8">
                                                        <div className="grid grid-cols-2 gap-6">
                                                            {/* MODULE 01: CORE PROTOCOL */}
                                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                                                <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-blue-500/5 transition-colors">01</div>
                                                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                                                    <Zap size={12} className="text-blue-400" /> Core Protocol
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">Device Designation</label>
                                                                        <input
                                                                            required
                                                                            value={editingDevice.model}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, model: e.target.value })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold text-xs"
                                                                            placeholder="e.g. PlayStation 5 Pro"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">Serial Protocol</label>
                                                                        <input
                                                                            required
                                                                            value={editingDevice.serialNumber}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, serialNumber: e.target.value })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-mono text-xs"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">Deployment Category (Manual)</label>
                                                                        <input
                                                                            list="category-suggestions"
                                                                            value={editingDevice.category}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, category: e.target.value })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold text-xs"
                                                                            placeholder="Type or select category..."
                                                                        />
                                                                        <datalist id="category-suggestions">
                                                                            {categories.map(c => (
                                                                                <option key={c.id} value={c.device_category} />
                                                                            ))}
                                                                        </datalist>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* MODULE 02: INTERFACE SPEC */}
                                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                                                <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-amber-500/5 transition-colors">02</div>
                                                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                                                    <Monitor size={12} className="text-amber-500" /> Interface Spec
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black text-gray-600 uppercase">Capacity (GB)</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingDevice.storage_gb || 0}
                                                                                onChange={e => setEditingDevice({ ...editingDevice, storage_gb: Number(e.target.value) })}
                                                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black text-gray-600 uppercase">Included Controllers</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingDevice.controllers || 0}
                                                                                onChange={e => setEditingDevice({ ...editingDevice, controllers: Number(e.target.value) })}
                                                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">Internal OS/Firmware</label>
                                                                        <input
                                                                            value={editingDevice.firmware_version || ""}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, firmware_version: e.target.value })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                                            placeholder="v1.0.0-final"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">I/O Ports</label>
                                                                        <input
                                                                            value={editingDevice.connectors?.join(', ') || ""}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, connectors: e.target.value.split(',').map(s => s.trim()) })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-bold text-xs"
                                                                            placeholder="HDMI, USB-C..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* MODULE 03: SUPPLY TRACE */}
                                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                                                <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-emerald-500/5 transition-colors">03</div>
                                                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                                                    <TrendingUp size={12} className="text-emerald-400" /> Supply Trace
                                                                </h4>
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black text-gray-600 uppercase">Net Cost</label>
                                                                            <input
                                                                                type="number"
                                                                                value={editingDevice.cost || 0}
                                                                                onChange={e => setEditingDevice({ ...editingDevice, cost: Number(e.target.value) })}
                                                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-mono text-xs"
                                                                            />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <label className="text-[9px] font-black text-gray-600 uppercase">Vendor/Supply</label>
                                                                            <input
                                                                                value={editingDevice.supplier || ""}
                                                                                onChange={e => setEditingDevice({ ...editingDevice, supplier: e.target.value })}
                                                                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-bold text-xs"
                                                                                placeholder="Supplier X"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <label className="text-[9px] font-black text-gray-600 uppercase">Asset Record (Internal)</label>
                                                                        <input
                                                                            value={editingDevice.asset_records?.join(', ') || ""}
                                                                            onChange={e => setEditingDevice({ ...editingDevice, asset_records: e.target.value.split(',').map(s => s.trim()) })}
                                                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-mono text-xs"
                                                                            placeholder="AR-900X, INV-001..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* MODULE 04: DIAGNOSTIC CONSOLE */}
                                                            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group transition-all hover:border-[#8B5CF6]/30">
                                                                <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-[#8B5CF6]/5 transition-colors">04</div>
                                                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                                                    <Activity size={12} className="text-[#8B5CF6]" /> Diagnostic Console
                                                                </h4>
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    <button
                                                                        type="button"
                                                                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between group/tool transition-all"
                                                                        onClick={() => {
                                                                            const btn = document.activeElement as HTMLButtonElement;
                                                                            btn.innerHTML = 'SYNCING...';
                                                                            setTimeout(() => btn.innerHTML = 'NETWORK SYNCED', 1000);
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <RefreshCw size={14} className="text-[#8B5CF6] animate-spin-slow group-hover/tool:animate-spin" />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Network Sync</span>
                                                                        </div>
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-between group/tool transition-all"
                                                                        onClick={() => {
                                                                            const btn = document.activeElement as HTMLButtonElement;
                                                                            btn.innerHTML = 'CHECKING...';
                                                                            setTimeout(() => btn.innerHTML = 'FIRMWARE UP TO DATE', 1000);
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <Zap size={14} className="text-amber-500" />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Firmware Check</span>
                                                                        </div>
                                                                        <div className="text-[8px] font-mono text-gray-600 font-black italic">{editingDevice.firmware_version}</div>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        className="w-full p-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl flex items-center justify-between group/tool transition-all"
                                                                        onClick={() => {
                                                                            if (confirm("Reset machine state? Current cycles will be logged.")) {
                                                                                setEditingDevice({ ...editingDevice, health: 100 });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center gap-3">
                                                                            <Settings size={14} className="text-red-500" />
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-red-500/80">System Hard Reset</span>
                                                                        </div>
                                                                        <AlertCircle size={12} className="text-red-500/30" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* INITIALIZATION PROTOCOL (SAVE) */}
                                                        <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-[2rem] p-8 flex items-center justify-between gap-6 relative overflow-hidden group">
                                                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-3xl -mr-16 -mb-16" />
                                                            <div className="flex-1 space-y-1">
                                                                <div className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-2">
                                                                    <RefreshCw size={10} className="animate-spin-slow" /> Synchronization protocol
                                                                </div>
                                                                <div className="text-[9px] text-gray-600 font-medium italic uppercase">Apply parameters and finalize unit modification.</div>
                                                            </div>
                                                            <button
                                                                type="submit"
                                                                disabled={isSubmitting}
                                                                className="px-12 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_4px_30px_rgba(139,92,246,0.25)] flex items-center gap-2"
                                                            >
                                                                {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                                                {isSubmitting ? "SYNCING..." : "COMMIT CHANGES"}
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}



                                    {/* CATEGORY TAB */}
                                    {activeEditTab === 'category' && editingCatalog && (
                                        <motion.div
                                            key="category"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-8"
                                        >
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* STRATEGY CONSOLE */}
                                                <div className="bg-black/50 border border-white/5 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] flex items-center gap-2 group/title">
                                                        {isRenaming ? (
                                                            <div className="flex items-center gap-2 flex-1">
                                                                <input
                                                                    autoFocus
                                                                    value={renamedCategory}
                                                                    onChange={(e) => setRenamedCategory(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameCategory()}
                                                                    className="bg-black/50 border border-[#8B5CF6]/50 rounded-lg px-2 py-1 text-[10px] text-white outline-none w-full font-black uppercase"
                                                                />
                                                                <button onClick={handleRenameCategory} className="p-1 hover:text-emerald-500 transition-colors">
                                                                    <CheckCircle2 size={12} />
                                                                </button>
                                                                <button onClick={() => setIsRenaming(false)} className="p-1 hover:text-red-500 transition-colors">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Activity size={14} className="text-[#8B5CF6]" />
                                                                <span className="truncate max-w-[150px]">{editingCatalog.device_category} Strategy Module</span>
                                                                <button
                                                                    onClick={() => {
                                                                        setRenamedCategory(editingCatalog.device_category);
                                                                        setIsRenaming(true);
                                                                    }}
                                                                    className="opacity-0 group-hover/title:opacity-100 transition-opacity hover:text-[#8B5CF6]"
                                                                >
                                                                    <Edit2 size={10} />
                                                                </button>
                                                            </>
                                                        )}
                                                        {!isRenaming && (
                                                            <button
                                                                onClick={() => setShowCopyModal(true)}
                                                                className="ml-auto px-3 py-1.5 bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 rounded-lg flex items-center gap-1.5 text-[#8B5CF6] transition-all"
                                                                title="Replicate configuration to peer categories"
                                                            >
                                                                <Layers size={10} />
                                                                <span className="text-[8px] font-black uppercase">Sync Peer</span>
                                                            </button>
                                                        )}
                                                    </h4>

                                                    <div className="space-y-6">
                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group/toggle hover:border-emerald-500/20 transition-colors">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-bold text-white uppercase tracking-wider">Catalog Visibility</div>
                                                                <div className="text-[9px] text-gray-600 uppercase font-black">Enable unit discovery for customers</div>
                                                            </div>
                                                            <button onClick={() => handleUpdateCatalog({ is_enabled: !editingCatalog.is_enabled })} className="hover:scale-110 transition-transform">
                                                                {editingCatalog.is_enabled ? <ToggleRight size={40} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" /> : <ToggleLeft size={40} className="text-gray-700" />}
                                                            </button>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group/toggle hover:border-[#8B5CF6]/20 transition-colors">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-bold text-white uppercase tracking-wider">Campaign Spotlight</div>
                                                                <div className="text-[9px] text-gray-600 uppercase font-black">Feature at top of store landing</div>
                                                            </div>
                                                            <button onClick={() => handleUpdateCatalog({ is_featured: !editingCatalog.is_featured })} className="hover:scale-110 transition-transform">
                                                                {editingCatalog.is_featured ? <ToggleRight size={40} className="text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(139,92,246,0.3)]" /> : <ToggleLeft size={40} className="text-gray-700" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* HARDWARE POLICY MODULE */}
                                                <div className="bg-black/50 border border-white/5 rounded-[2.5rem] p-10 space-y-8 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                                                    <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em] flex items-center gap-2">
                                                        <Gamepad2 size={14} className="text-amber-500" /> Interface Limits
                                                    </h4>

                                                    <div className="space-y-6">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                                Max Peripheral Count
                                                                <span className="text-white font-mono">{editingCatalog.max_controllers}x</span>
                                                            </div>
                                                            <input
                                                                type="range"
                                                                min="1" max="4"
                                                                value={editingCatalog.max_controllers}
                                                                onChange={(e) => handleUpdateCatalog({ max_controllers: Number(e.target.value) })}
                                                                className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
                                                            />
                                                            <div className="flex justify-between text-[8px] font-black text-gray-700">
                                                                <span>1 UNIT</span>
                                                                <span>4 UNITS</span>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group/toggle hover:border-amber-500/20 transition-colors">
                                                            <div className="space-y-1">
                                                                <div className="text-xs font-bold text-white uppercase tracking-wider">Addon Permitting</div>
                                                                <div className="text-[9px] text-gray-600 uppercase font-black">Allow extra hardware rentals</div>
                                                            </div>
                                                            <button onClick={() => handleUpdateCatalog({ extra_controller_enabled: !editingCatalog.extra_controller_enabled })} className="hover:scale-110 transition-transform">
                                                                {editingCatalog.extra_controller_enabled ? <ToggleRight size={40} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" /> : <ToggleLeft size={40} className="text-gray-700" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CATEGORY INTEL */}
                                            <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 grid grid-cols-4 gap-4">
                                                <div className="space-y-1 border-r border-white/5 p-4 group">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Avg Health</div>
                                                    <div className="text-2xl font-black text-white">92.4%</div>
                                                </div>
                                                <div className="space-y-1 border-r border-white/5 p-4 group">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-[#8B5CF6] transition-colors">Utilization</div>
                                                    <div className="text-2xl font-black text-white">78%</div>
                                                </div>
                                                <div className="space-y-1 border-r border-white/5 p-4 group">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-amber-500 transition-colors">Live Units</div>
                                                    <div className="text-2xl font-black text-white">{devices.filter(d => d.category === editingCatalog.device_category).length}</div>
                                                </div>
                                                <div className="space-y-1 p-4 group">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Yield (Mo)</div>
                                                    <div className="text-2xl font-black text-white">₹42.5k</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* PRICING TAB - ENGINE PARAMS INTEGRATION */}
                                    {activeEditTab === 'pricing' && editingCatalog && (
                                        <motion.div
                                            key="pricing"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-8"
                                        >
                                            {/* Parameter Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {/* DAILY RATE CARD */}
                                                <div className="relative group overflow-hidden bg-black border border-white/5 rounded-[2rem] p-8 hover:border-[#8B5CF6]/30 transition-all hover:translate-y-[-4px]">
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Daily Rate</span>
                                                            <Zap size={14} className="text-[#8B5CF6]" />
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xs font-bold text-gray-500">₹</span>
                                                                <span className="text-3xl font-black text-white">{editingCatalog.daily_rate}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTuneStart('daily_rate', editingCatalog.daily_rate)}
                                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all shadow-inner"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 pt-4 border-t border-white/5 relative">
                                                            <button
                                                                onClick={() => handleTuneStart('features', editingCatalog.features || [])}
                                                                className="absolute -top-3 right-0 p-1.5 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-lg hover:bg-[#8B5CF6]/20 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Edit Features"
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                            {(editingCatalog.features || ["Premium Experience", "Latest Titles", "24/7 Support", "Clean & Sanitized"]).map((feat, i) => (
                                                                <div key={i} className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                    <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                    {feat}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* WEEKLY RATE CARD */}
                                                <div className="relative group overflow-hidden bg-black border border-white/5 rounded-[2rem] p-8 hover:border-[#8B5CF6]/30 transition-all hover:translate-y-[-4px]">
                                                    <div className="absolute top-1/4 right-0 w-1 h-1/2 bg-[#8B5CF6] transition-all group-hover:h-full group-hover:top-0" />
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Weekly Rate</span>
                                                            <Shield size={14} className="text-[#8B5CF6]" />
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xs font-bold text-gray-500">₹</span>
                                                                <span className="text-3xl font-black text-white">{editingCatalog.weekly_rate}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTuneStart('weekly_rate', editingCatalog.weekly_rate)}
                                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 pt-4 border-t border-white/5">
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                7 Days Extension
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                Priority Maintenance
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                Free Swap if faulty
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MONTHLY RATE CARD */}
                                                <div className="relative group overflow-hidden bg-black border border-white/5 rounded-[2rem] p-8 hover:border-[#8B5CF6]/30 transition-all hover:translate-y-[-4px]">
                                                    <div className="absolute top-0 right-0 w-1 h-full bg-[#8B5CF6] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Monthly Rate</span>
                                                            <TrendingUp size={14} className="text-[#8B5CF6]" />
                                                        </div>
                                                        <div className="flex items-baseline justify-between">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-xs font-bold text-gray-500">₹</span>
                                                                <span className="text-3xl font-black text-white">{editingCatalog.monthly_rate}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTuneStart('monthly_rate', editingCatalog.monthly_rate)}
                                                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2 pt-4 border-t border-white/5">
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                Highest Priority Access
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                Free Home Delivery
                                                            </div>
                                                            <div className="text-[10px] text-gray-500 font-medium flex items-center gap-2">
                                                                <div className="w-1 h-1 bg-gray-700 rounded-full" />
                                                                Unlimited Swaps
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CONTROLLER PARAMETERS */}
                                            <div className="space-y-6 pt-4 border-t border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <Gamepad2 size={14} className="text-gray-500" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Addon Controller Modules</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* CONTROLLER DAILY */}
                                                    <div className="bg-black border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-[#8B5CF6]/30 transition-all">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                            Extra Daily
                                                            <button
                                                                onClick={() => handleTuneStart('controller_daily_rate', editingCatalog.controller_daily_rate)}
                                                                className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                                            >
                                                                <Edit2 size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-gray-600">₹</span>
                                                            <span className="text-xl font-black text-white">{editingCatalog.controller_daily_rate}</span>
                                                        </div>
                                                    </div>

                                                    {/* CONTROLLER WEEKLY */}
                                                    <div className="bg-black border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-[#8B5CF6]/30 transition-all">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                            Extra Weekly
                                                            <button
                                                                onClick={() => handleTuneStart('controller_weekly_rate', editingCatalog.controller_weekly_rate)}
                                                                className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                                            >
                                                                <Edit2 size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-gray-600">₹</span>
                                                            <span className="text-xl font-black text-white">{editingCatalog.controller_weekly_rate}</span>
                                                        </div>
                                                    </div>

                                                    {/* CONTROLLER MONTHLY */}
                                                    <div className="bg-black border border-white/5 rounded-[1.5rem] p-6 space-y-4 hover:border-[#8B5CF6]/30 transition-all">
                                                        <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                            Extra Monthly
                                                            <button
                                                                onClick={() => handleTuneStart('controller_monthly_rate', editingCatalog.controller_monthly_rate)}
                                                                className="text-[#8B5CF6] hover:scale-110 transition-transform"
                                                            >
                                                                <Edit2 size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-[10px] font-bold text-gray-600">₹</span>
                                                            <span className="text-xl font-black text-white">{editingCatalog.controller_monthly_rate}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* OFFERS TAB */}
                                    {activeEditTab === 'offers' && (
                                        <motion.div
                                            key="offers"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-6"
                                        >
                                            <form onSubmit={handleCreateOffer} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                                                <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                                    <Plus size={12} /> Create New Offer
                                                </h4>
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase">Code</label>
                                                        <input
                                                            value={newOffer.code}
                                                            onChange={e => setNewOffer({ ...newOffer, code: e.target.value.toUpperCase() })}
                                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-black text-white focus:border-[#8B5CF6] outline-none uppercase"
                                                            placeholder="SUMMER25"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase">Type</label>
                                                        <select
                                                            value={newOffer.discount_type}
                                                            onChange={e => setNewOffer({ ...newOffer, discount_type: e.target.value as 'percentage' | 'fixed' })}
                                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-bold text-white focus:border-[#8B5CF6] outline-none"
                                                        >
                                                            <option value="fixed">Fixed Amount (₹)</option>
                                                            <option value="percentage">Percentage (%)</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase">Value</label>
                                                        <input
                                                            type="number"
                                                            value={newOffer.discount_value}
                                                            onChange={e => setNewOffer({ ...newOffer, discount_value: Number(e.target.value) })}
                                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-black text-white focus:border-[#8B5CF6] outline-none"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase">Min Days</label>
                                                        <input
                                                            type="number"
                                                            value={newOffer.min_rental_days}
                                                            onChange={e => setNewOffer({ ...newOffer, min_rental_days: Number(e.target.value) })}
                                                            className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm font-black text-white focus:border-[#8B5CF6] outline-none"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                                <button type="submit" className="w-full bg-[#8B5CF6]/10 hover:bg-[#8B5CF6]/20 text-[#8B5CF6] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                                    Create Offer
                                                </button>
                                            </form>
                                            {offers.length === 0 ? (
                                                <div className="py-20 text-center space-y-4 bg-white/5 rounded-[2rem] border border-white/5">
                                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-600">
                                                        <Tag size={32} />
                                                    </div>
                                                    <p className="text-xs font-black uppercase text-gray-500 tracking-widest italic">No active offers for this category</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-4">
                                                    {offers.map(offer => (
                                                        <div key={offer.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <div className="text-lg font-black text-white mb-1 uppercase tracking-tight">{offer.code}</div>
                                                                    <div className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest">{offer.title}</div>
                                                                </div>
                                                                <button onClick={() => toggleOfferStatus(offer.id, offer.is_active)}>
                                                                    {offer.is_active ? <ToggleRight size={28} className="text-emerald-500" /> : <ToggleLeft size={28} className="text-gray-600" />}
                                                                </button>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <div className="flex-1 bg-black p-3 rounded-xl border border-white/5">
                                                                    <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Discount</div>
                                                                    <div className="text-sm font-black text-white">{offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`}</div>
                                                                </div>
                                                                <div className="flex-1 bg-black p-3 rounded-xl border border-white/5">
                                                                    <div className="text-[8px] font-black text-gray-600 uppercase mb-1">Min Days</div>
                                                                    <div className="text-sm font-black text-white">{offer.min_rental_days}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest text-center italic">Offers are managed globally. Visit the Marketing Hub for more controls.</p>
                                        </motion.div>
                                    )}

                                    {/* HISTORY TAB */}
                                    {activeEditTab === 'history' && (
                                        <motion.div
                                            key="history"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            className="space-y-8"
                                        >
                                            <div className="bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                                                <div className="flex items-center justify-between mb-10">
                                                    <div className="space-y-1">
                                                        <h4 className="text-[10px] font-black uppercase text-[#8B5CF6] tracking-[0.4em]">Unit Lifecycle Log</h4>
                                                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Event <span className="text-[#8B5CF6]">Horizon</span></h2>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex flex-col items-end">
                                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Tracking Active</span>
                                                            <span className="text-[10px] font-mono text-emerald-500">24/7 TELEMETRY</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {loadingHistory ? (
                                                    <div className="py-20 flex flex-col items-center justify-center gap-4">
                                                        <RefreshCw size={40} className="text-[#8B5CF6] animate-spin" />
                                                        <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] animate-pulse">Syncing Lifecycle Data...</div>
                                                    </div>
                                                ) : unitHistory.length === 0 ? (
                                                    <div className="py-20 text-center space-y-4">
                                                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-700">
                                                            <ClipboardList size={32} />
                                                        </div>
                                                        <p className="text-xs font-black uppercase text-gray-500 tracking-widest italic">No historical data available for this unit</p>
                                                    </div>
                                                ) : (
                                                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                                                        {unitHistory.map((log) => (
                                                            <div key={log.id} className="relative flex items-center gap-8 group">
                                                                <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center relative z-10 transition-transform group-hover:scale-110 ${(log.event || "").includes('Rental') ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' :
                                                                    (log.event || "").includes('Maintenance') ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' :
                                                                        'bg-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                                                    }`}>
                                                                    {(log.event || "").includes('Rental') ? <HardDrive size={16} /> :
                                                                        (log.event || "").includes('Maintenance') ? <Settings size={16} /> :
                                                                            <Zap size={16} />}
                                                                </div>

                                                                <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 group-hover:border-white/20 transition-all">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-xs font-black text-white uppercase tracking-wider">{log.event}</span>
                                                                            {log.health_change !== undefined && (
                                                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${log.health_change > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                                    {log.health_change > 0 ? '+' : ''}{log.health_change}% INTEGRITY
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[9px] font-mono text-gray-500">{log.date}</span>
                                                                    </div>
                                                                    {log.notes && <p className="text-[10px] text-gray-400 font-medium leading-relaxed">{log.notes}</p>}
                                                                    {log.user && (
                                                                        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                                                                            <div className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 flex items-center justify-center">
                                                                                <User size={10} className="text-[#8B5CF6]" />
                                                                            </div>
                                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Operator: <span className="text-white">{log.user}</span></span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-1">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Uptime</div>
                                                    <div className="text-xl font-black text-white italic">1,402 HRS</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-1">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Rental Cycles</div>
                                                    <div className="text-xl font-black text-white italic">48 SESSIONS</div>
                                                </div>
                                                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-1">
                                                    <div className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em]">Avg Cycle</div>
                                                    <div className="text-xl font-black text-white italic">2.4 DAYS</div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Device Modal (Ported) */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
                        >
                            <div className="h-20 border-b border-white/10 flex items-center justify-between px-10 bg-[#0f0f0f]">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Plus size={20} className="text-[#8B5CF6]" />
                                    Onboard New Asset
                                </h2>
                                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleAddDevice} className="p-10 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                {/* HARDWARE PRESETS */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Layers size={12} className="text-[#8B5CF6]" /> Onboarding Archetypes
                                    </label>
                                    <div className="grid grid-cols-4 gap-4">
                                        {PRESETS.map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => applyPreset(preset)}
                                                className="bg-white/5 border border-white/5 hover:border-[#8B5CF6]/50 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-1 group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-gray-500 group-hover:text-[#8B5CF6] transition-colors">
                                                    {preset.icon}
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-gray-400 group-hover:text-white">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* MODULE 01: CORE IDENTITY */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-[#8B5CF6]/5 transition-colors">01</div>
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                            <Activity size={12} className="text-[#8B5CF6]" /> Core Protocol
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Device Designation</label>
                                                <input
                                                    required
                                                    value={newDevice.model}
                                                    onChange={e => setNewDevice({ ...newDevice, model: e.target.value })}
                                                    className={`w-full bg-black/50 border ${validationErrors.model ? 'border-red-500' : 'border-white/10'} rounded-xl p-4 text-white focus:border-[#8B5CF6] outline-none font-bold text-xs`}
                                                    placeholder="PlayStation 5 Slim..."
                                                />
                                                {validationErrors.model && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1">{validationErrors.model}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Serial Matrix</label>
                                                <input
                                                    required
                                                    value={newDevice.serialNumber}
                                                    onChange={e => setNewDevice({ ...newDevice, serialNumber: e.target.value })}
                                                    className={`w-full bg-black/50 border ${validationErrors.serialNumber ? 'border-red-500' : 'border-white/10'} rounded-xl p-4 text-white focus:border-[#8B5CF6] outline-none font-mono text-xs`}
                                                />
                                                {validationErrors.serialNumber && <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mt-1">{validationErrors.serialNumber}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Fleet Category (Manual)</label>
                                                <input
                                                    list="new-asset-category-suggestions"
                                                    value={newDevice.category}
                                                    onChange={e => setNewDevice({ ...newDevice, category: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-[#8B5CF6] outline-none font-bold text-xs"
                                                    placeholder="Type or select category..."
                                                />
                                                <datalist id="new-asset-category-suggestions">
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.device_category} />
                                                    ))}
                                                </datalist>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Onboard Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={newDevice.quantity}
                                                    onChange={e => setNewDevice({ ...newDevice, quantity: Number(e.target.value) })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-[#8B5CF6] outline-none font-mono text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MODULE 02: TECHNICAL SPEC */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-amber-500/5 transition-colors">02</div>
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                            <Monitor size={12} className="text-amber-500" /> Interface Spec
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase">Capacity (GB)</label>
                                                    <input
                                                        type="number"
                                                        value={newDevice.storage_gb}
                                                        onChange={e => setNewDevice({ ...newDevice, storage_gb: Number(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase">Included Controllers</label>
                                                    <input
                                                        type="number"
                                                        value={newDevice.controllers}
                                                        onChange={e => setNewDevice({ ...newDevice, controllers: Number(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Internal OS/Firmware</label>
                                                <input
                                                    value={newDevice.firmware_version}
                                                    onChange={e => setNewDevice({ ...newDevice, firmware_version: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-mono text-xs"
                                                    placeholder="v1.0.0-final"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">I/O Ports</label>
                                                <input
                                                    value={newDevice.connectors}
                                                    onChange={e => setNewDevice({ ...newDevice, connectors: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-amber-500 outline-none font-bold text-xs"
                                                    placeholder="HDMI, USB-C..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MODULE 03: LOGISTICS */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-emerald-500/5 transition-colors">03</div>
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                            <ClipboardList size={12} className="text-emerald-500" /> Supply Trace
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase">Unit Cost (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={newDevice.cost}
                                                        onChange={e => setNewDevice({ ...newDevice, cost: Number(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase">Initial Health</label>
                                                    <input
                                                        type="number"
                                                        value={newDevice.health}
                                                        onChange={e => setNewDevice({ ...newDevice, health: Number(e.target.value) })}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-mono text-xs"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Supplier Node</label>
                                                <input
                                                    value={newDevice.supplier}
                                                    onChange={e => setNewDevice({ ...newDevice, supplier: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-bold text-xs"
                                                    placeholder="Vendor..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Asset Record (AR)</label>
                                                <input
                                                    value={newDevice.asset_records}
                                                    onChange={e => setNewDevice({ ...newDevice, asset_records: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none font-bold text-xs"
                                                    placeholder="AR-XXX"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* MODULE 04: LIFECYCLE */}
                                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-4 right-8 text-[40px] font-black italic text-white/5 group-hover:text-blue-500/5 transition-colors">04</div>
                                        <h4 className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">
                                            <Calendar size={12} className="text-blue-500" /> Time Horizon
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Commission Date</label>
                                                <input
                                                    type="date"
                                                    value={newDevice.purchaseDate}
                                                    onChange={e => setNewDevice({ ...newDevice, purchaseDate: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-mono text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Warranty Expiration</label>
                                                <input
                                                    type="date"
                                                    value={newDevice.warrantyExpiry}
                                                    onChange={e => setNewDevice({ ...newDevice, warrantyExpiry: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-mono text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-600 uppercase">Internal Log Notes</label>
                                                <textarea
                                                    value={newDevice.notes}
                                                    onChange={e => setNewDevice({ ...newDevice, notes: e.target.value })}
                                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none font-bold text-xs h-24 resize-none"
                                                    placeholder="Initial condition..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/20 rounded-[2rem] p-8 flex items-center justify-between gap-6 relative overflow-hidden group">
                                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#8B5CF6]/5 rounded-full blur-3xl -mr-16 -mb-16" />
                                    <div className="flex-1 space-y-1">
                                        <div className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-2">
                                            <RefreshCw size={10} className="animate-spin-slow" /> Initialization Protocol
                                        </div>
                                        <div className="text-[9px] text-gray-600 font-medium italic">All parameters verified. Proceed with unit commission into fleet matrix.</div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-12 py-4 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_4px_30px_rgba(139,92,246,0.25)] flex items-center gap-2"
                                    >
                                        {isSubmitting || isBulkOnboarding ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                        {isSubmitting || isBulkOnboarding ? "COMMITTING..." : "FINALIZE ONBOARDING"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Copy Configuration Modal */}
            <AnimatePresence>
                {showCopyModal && editingCatalog && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCopyModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
                        >
                            <div className="p-8 space-y-6">
                                <div>
                                    <h3 className="text-lg font-black uppercase text-white tracking-widest mb-2">Copy Configuration</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                        Copy settings from <span className="text-[#8B5CF6] font-bold">{editingCatalog.device_category}</span> to another category.
                                        This will overwrite target&apos;s pricing and limits.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Target Category</label>
                                    <select
                                        value={copyTargetCategory}
                                        onChange={(e) => setCopyTargetCategory(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl p-4 text-white focus:border-[#8B5CF6] outline-none font-bold"
                                    >
                                        <option value="">Select a category...</option>
                                        {categories
                                            .filter(c => c.device_category !== editingCatalog.device_category)
                                            .map(c => (
                                                <option key={c.id} value={c.device_category}>
                                                    {c.device_category}
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowCopyModal(false)}
                                        className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCopySettings}
                                        disabled={!copyTargetCategory}
                                        className="flex-1 bg-[#8B5CF6] hover:bg-[#7C3AED] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-[0_4px_20px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Confirm Copy
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* QR Generator Modal */}
            <AnimatePresence>
                {isShowingQR && qrDevice && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsShowingQR(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-md"
                        >
                            <QRGenerator
                                value={qrDevice.serialNumber}
                                title={qrDevice.model}
                                subtitle={`${qrDevice.category} Identification`}
                                onClose={() => setIsShowingQR(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Tuning Overlay */}
            <AnimatePresence>
                {tuning && editingCatalog && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTuning(null)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative z-10 w-full max-w-sm bg-[#0D0D0D] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#8B5CF6] to-amber-500" />
                            <div className="space-y-8 text-center">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white underline decoration-[#8B5CF6] underline-offset-8">
                                        Tune Param
                                    </h3>
                                    <p className="mt-4 text-[10px] font-black uppercase text-gray-500 tracking-widest leading-relaxed">
                                        Adjusting <span className="text-white">{tuning.field.replace('_', ' ')}</span> for <span className="text-[#8B5CF6]">{editingCatalog.device_category}</span>
                                    </p>
                                </div>

                                {tuning.field === 'features' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2 max-h-48 overflow-y-auto px-2 custom-scrollbar">
                                            {tuningFeatures.map((feat, i) => (
                                                <div key={i} className="flex items-center justify-between gap-3 bg-white/5 p-3 rounded-xl border border-white/10 transition-all hover:bg-white/10">
                                                    <span className="text-xs text-gray-300 font-bold truncate">{feat}</span>
                                                    <button
                                                        onClick={() => handleRemoveTuningFeature(i)}
                                                        className="p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-500 rounded-lg transition-all"
                                                    >
                                                        <Plus size={14} className="rotate-45" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative group flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="New feature..."
                                                value={tuningValue}
                                                onChange={(e) => setTuningValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTuningFeature()}
                                                className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                                            />
                                            <button
                                                onClick={handleAddTuningFeature}
                                                className="p-4 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-xl hover:bg-[#8B5CF6]/30 transition-all border border-[#8B5CF6]/30"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6]/50 to-amber-500/50 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition-all" />
                                        <input
                                            type="number"
                                            value={tuningValue}
                                            onChange={(e) => setTuningValue(e.target.value)}
                                            className="relative w-full bg-black border border-white/10 rounded-xl p-5 text-2xl font-black text-center text-white focus:outline-none focus:border-[#8B5CF6]/50 transition-colors"
                                            autoFocus
                                        />
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                                    </div>
                                )}

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => setTuning(null)}
                                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleTuneSave}
                                        className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[#8B5CF6] hover:bg-[#7C3AED] transition-all rounded-xl shadow-[0_4px_20px_rgba(139,92,246,0.3)]"
                                    >
                                        Execute update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
}
