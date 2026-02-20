"use client";

import { useState, useEffect } from 'react';
import {
    Trash2, Plus, ImageIcon, RotateCcw, Gamepad2, Sun,
    Layout, Type, FileText, Settings, Palette, Save,
    Monitor, Smartphone, Globe, Check, ExternalLink,
    ChevronRight, Info, MousePointer2, Move, ZoomIn,
    Layers, Grid3X3, Eye, EyeOff, Laptop, Tablet, Box,
    ChevronLeft, Minus, BoxSelect, Maximize2, Minimize2, ChevronDown,
    AlignLeft, AlignCenter, AlignRight, MoreHorizontal,
    Grid, Columns, Square, Image as ImageIconLucide, Video, Sliders,
    Copy, Scissors, Clipboard, Layers as LayersIcon, Download, AlertTriangle,
    RotateCcw as UndoIcon, RotateCw as RedoIcon, Sparkles, Wind, Timer, ShoppingBag
} from 'lucide-react';
import { VisualsService, VisualSettings, VisualElement, PageLayout } from '@/services/visuals';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { BuilderRenderer } from '@/components/Builder/BuilderRenderer';

export default function AppearancePage() {
    const [settings, setSettings] = useState<VisualSettings | null>(null);
    const [originalSettings, setOriginalSettings] = useState<VisualSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Builder Specific State
    const [activePage, setActivePage] = useState<string>('home');
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(false);
    const [hidePanels, setHidePanels] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'animation' | 'advanced'>('content');
    const [copiedStyles, setCopiedStyles] = useState<any | null>(null);

    // New Integrated UI State
    const [sideTab, setSideTab] = useState<'layers' | 'design' | 'gallery' | 'backgrounds' | 'content'>('layers');

    // History State
    const [history, setHistory] = useState<VisualSettings[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // --- DRAG LOGIC ---
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });

    useEffect(() => {
        const init = async () => {
            const current = await VisualsService.getSettings();
            setSettings(current);
            setOriginalSettings(JSON.parse(JSON.stringify(current)));
            // Initialize history
            setHistory([JSON.parse(JSON.stringify(current))]);
            setHistoryIndex(0);
        };
        init();
    }, []);

    const pushToHistory = (newSettings: VisualSettings) => {
        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(JSON.parse(JSON.stringify(newSettings)));
            // Limit history to 50 steps
            if (next.length > 50) next.shift();
            return next;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    const saveHistoryStep = () => {
        if (settings) pushToHistory(settings);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setSettings(JSON.parse(JSON.stringify(prev)));
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setSettings(JSON.parse(JSON.stringify(next)));
            setHistoryIndex(historyIndex + 1);
        }
    };

    if (!settings) return null;

    const currentLayout = settings.layouts?.[activePage] || { pageId: activePage, layers: [] };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            VisualsService.saveSettings(settings);
            setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        } finally {
            setIsSaving(false);
        }
    };

    const addElement = (type: VisualElement['type']) => {
        const newEl: VisualElement = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: `New ${type}`,
            props: type === 'text' ? { content: 'Double click to edit', tag: 'h2' } : {},
            styles: {
                desktop: {
                    position: 'absolute',
                    top: '100px',
                    left: '100px',
                    padding: '20px',
                    color: '#ffffff',
                    fontSize: type === 'text' ? '40px' : undefined,
                    fontWeight: 'bold',
                    textAlign: 'center'
                }
            }
        };

        const nextSettings = JSON.parse(JSON.stringify(settings));
        if (!nextSettings.layouts) nextSettings.layouts = {};
        if (!nextSettings.layouts[activePage]) {
            nextSettings.layouts[activePage] = { pageId: activePage, layers: [] };
        }
        nextSettings.layouts[activePage].layers.push(newEl);
        setSettings(nextSettings);
        pushToHistory(nextSettings);
        setSelectedElementId(newEl.id);
    };

    const deleteElement = (id: string) => {
        if (!settings) return;
        const nextSettings = JSON.parse(JSON.stringify(settings));
        if (nextSettings.layouts?.[activePage]) {
            nextSettings.layouts[activePage].layers = nextSettings.layouts[activePage].layers.filter((l: any) => l.id !== id);
        }
        setSettings(nextSettings);
        setSelectedElementId(null);
    };

    const selectedElement = currentLayout.layers.find(l => l.id === selectedElementId);

    const updateElementStyle = (key: string, value: any) => {
        if (!selectedElementId || !settings) return;

        // Use functional update with deep clone for safety
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
            if (el) {
                // Determine which style block to update
                const styleKey = viewport || 'desktop';
                if (!el.styles[styleKey]) el.styles[styleKey] = { ...el.styles.desktop };
                el.styles[styleKey] = { ...el.styles[styleKey], [key]: value };
            }
            return next;
        });
    };

    const duplicateElement = (id: string) => {
        if (!settings) return;
        const nextSettings = JSON.parse(JSON.stringify(settings));
        const el = nextSettings.layouts[activePage].layers.find((l: any) => l.id === id);
        if (el) {
            const newEl = JSON.parse(JSON.stringify(el));
            newEl.id = Math.random().toString(36).substr(2, 9);
            newEl.label = `${el.label} (Copy)`;
            // Offset slightly so it's visible
            if (newEl.styles.desktop.position === 'absolute') {
                newEl.styles.desktop.top = `${parseInt(newEl.styles.desktop.top) + 20}px`;
                newEl.styles.desktop.left = `${parseInt(newEl.styles.desktop.left) + 20}px`;
            }
            nextSettings.layouts[activePage].layers.push(newEl);
            setSettings(nextSettings);
            pushToHistory(nextSettings);
            setSelectedElementId(newEl.id);
        }
    };

    const copyStyles = (element: VisualElement) => {
        setCopiedStyles(JSON.parse(JSON.stringify(element.styles)));
    };

    const pasteStyles = (id: string) => {
        if (!copiedStyles || !settings) return;
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
            if (el) {
                el.styles = JSON.parse(JSON.stringify(copiedStyles));
            }
            return next;
        });
        saveHistoryStep();
    };

    const toggleVisibility = (id: string) => {
        if (!settings) return;
        setSettings(prev => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
            if (el) el.hidden = !el.hidden;
            return next;
        });
    };

    const importFromTemplate = () => {
        if (!settings) return;
        if (settings.layouts[activePage].layers.length > 0) {
            if (!confirm("This will overwrite your current layers for this page. Continue?")) return;
        }

        const nextSettings = JSON.parse(JSON.stringify(settings));
        const layers: VisualElement[] = [];
        const pageTitle = settings.pageContent[`${activePage}_title`] || activePage.toUpperCase();
        const pageSubtitle = settings.pageContent[`${activePage}_subtitle`] || "";

        if (activePage === 'home') {
            const titleParts = pageTitle.split(' ');
            const mainPart = titleParts.slice(0, -2).join(' ') || "LEVEL UP";
            const accentPart = titleParts.slice(-2).join(' ') || "YOUR GAMING";

            layers.push({
                id: 'hero-section',
                type: 'section',
                label: 'Hero Section',
                props: {},
                styles: {
                    desktop: {
                        minHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '100px 20px',
                        background: 'transparent'
                    }
                },
                children: [
                    {
                        id: 'hero-title',
                        type: 'text',
                        label: 'Main Title',
                        props: { content: `${mainPart}\n${accentPart}`, tag: 'h1' },
                        styles: {
                            desktop: {
                                fontSize: '120px',
                                fontWeight: '900',
                                color: '#ffffff',
                                textAlign: 'center',
                                fontStyle: 'italic',
                                textTransform: 'uppercase',
                                lineHeight: '0.8',
                                letterSpacing: '-0.05em',
                                marginBottom: '40px'
                            }
                        }
                    },
                    {
                        id: 'hero-subtitle',
                        type: 'text',
                        label: 'Subtitle',
                        props: { content: pageSubtitle, tag: 'p' },
                        styles: {
                            desktop: {
                                fontSize: '20px',
                                color: '#94a3b8',
                                textAlign: 'center',
                                letterSpacing: '0.3em',
                                textTransform: 'uppercase',
                                marginBottom: '60px',
                                maxWidth: '800px'
                            }
                        }
                    },
                    {
                        id: 'cta-container',
                        type: 'container',
                        label: 'CTA Buttons',
                        props: {},
                        styles: {
                            desktop: {
                                display: 'flex',
                                gap: '20px',
                                justifyContent: 'center'
                            }
                        },
                        children: [
                            {
                                id: 'cta-primary',
                                type: 'button',
                                label: 'Primary CTA',
                                props: { label: 'RENTAL PLANS' },
                                styles: {
                                    desktop: {
                                        background: '#A855F7',
                                        color: '#ffffff',
                                        padding: '20px 40px',
                                        borderRadius: '0px',
                                        fontWeight: '900',
                                        fontSize: '14px',
                                        letterSpacing: '0.2em'
                                    }
                                }
                            },
                            {
                                id: 'cta-secondary',
                                type: 'button',
                                label: 'Secondary CTA',
                                props: { label: 'MARKETPLACE' },
                                styles: {
                                    desktop: {
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#ffffff',
                                        padding: '20px 40px',
                                        borderRadius: '0px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '900',
                                        fontSize: '14px',
                                        letterSpacing: '0.2em'
                                    }
                                }
                            }
                        ]
                    }
                ]
            });
        } else {
            // Standard Page Header
            layers.push({
                id: 'page-header',
                type: 'section',
                label: 'Page Header',
                props: {},
                styles: {
                    desktop: {
                        padding: '120px 20px 60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center'
                    }
                },
                children: [
                    {
                        id: 'page-title',
                        type: 'text',
                        label: 'Page Title',
                        props: { content: pageTitle, tag: 'h1' },
                        styles: {
                            desktop: {
                                fontSize: '80px',
                                fontWeight: '900',
                                color: '#ffffff',
                                fontStyle: 'italic',
                                textTransform: 'uppercase',
                                letterSpacing: '-0.02em',
                                marginBottom: '20px'
                            }
                        }
                    },
                    {
                        id: 'page-subtitle',
                        type: 'text',
                        label: 'Page Subtitle',
                        props: { content: pageSubtitle, tag: 'p' },
                        styles: {
                            desktop: {
                                fontSize: '14px',
                                color: '#64748b',
                                letterSpacing: '0.4em',
                                textTransform: 'uppercase',
                                maxWidth: '600px'
                            }
                        }
                    }
                ]
            });
        }

        nextSettings.layouts[activePage].layers = layers;
        setSettings(nextSettings);
        setSelectedElementId(null);
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (selectedElementId && e.target instanceof HTMLElement) {
            const el = document.getElementById(selectedElementId);
            if (el && el.contains(e.target as Node)) {
                setIsDragging(true);
                const rect = el.getBoundingClientRect();
                setDragStart({
                    x: e.clientX,
                    y: e.clientY,
                    initialX: parseInt(selectedElement?.styles.desktop.left || '0') || 0,
                    initialY: parseInt(selectedElement?.styles.desktop.top || '0') || 0
                });
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
    };

    const handleCanvasPointerMove = (e: React.PointerEvent) => {
        if (isDragging && selectedElementId) {
            const dx = (e.clientX - dragStart.x) / (zoom / 100);
            const dy = (e.clientY - dragStart.y) / (zoom / 100);

            const newX = dragStart.initialX + dx;
            const newY = dragStart.initialY + dy;

            updateElementStyle('left', `${newX}px`);
            updateElementStyle('top', `${newY}px`);
            // Remove transform if we are manually positioning
            updateElementStyle('transform', 'none');
        }
    };

    const handleCanvasPointerUp = (e: React.PointerEvent) => {
        if (isDragging) {
            saveHistoryStep();
        }
        setIsDragging(false);
        if (e.target instanceof HTMLElement) {
            (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        }
    };

    return (
        <div className="fixed inset-0 bg-[#050505] flex overflow-hidden select-none text-white font-['Inter',_sans-serif']">
            {/* --- LEFT SIDEBAR: NAVIGATION ICONS --- */}
            <div className="w-16 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-6 gap-8 z-50">
                <div className="w-10 h-10 bg-[#A855F7] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] mb-4">
                    <Box size={20} className="text-white" />
                </div>

                <div className="flex flex-col gap-4">
                    {[
                        { id: 'layers', icon: LayersIcon, label: 'Layers' },
                        { id: 'design', icon: Sparkles, label: 'Design' },
                        { id: 'gallery', icon: ImageIconLucide, label: 'Gallery' },
                        { id: 'backgrounds', icon: Wind, label: 'Backgrounds' },
                        { id: 'content', icon: FileText, label: 'Content' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSideTab(tab.id as any)}
                            className={`p-3 rounded-xl transition-all group relative ${sideTab === tab.id ? 'bg-[#A855F7]/10 text-[#A855F7]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            title={tab.label}
                        >
                            <tab.icon size={20} />
                            {sideTab === tab.id && (
                                <motion.div layoutId="activeTab" className="absolute left-0 w-1 h-6 bg-[#A855F7] rounded-r-full" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-4">
                    <Link href="/admin" className="p-3 text-gray-500 hover:text-white transition-colors">
                        <ChevronLeft size={20} />
                    </Link>
                </div>
            </div>

            {/* --- LEFT PANEL: CONTEXTUAL CONTENT --- */}
            <div className={`w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-40 transition-all duration-300 ${hidePanels ? '-ml-72 opacity-0' : 'opacity-100'}`}>
                <div className="h-14 flex items-center px-6 border-b border-white/5 justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">
                        {sideTab === 'layers' ? 'Project Layers' : `Global ${sideTab}`}
                    </h2>
                    <button onClick={() => setHidePanels(true)} className="p-1 text-gray-600 hover:text-white"><ChevronLeft size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {sideTab === 'layers' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Quick Add Image</h3>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Paste image URL..."
                                        id="quick-add-image-input"
                                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-[#A855F7]/30 transition-all font-mono"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const url = e.currentTarget.value.trim();
                                                if (url) {
                                                    // Standard add element logic but specialized for image URL
                                                    const newId = Math.random().toString(36).substr(2, 9);
                                                    const newEl: VisualElement = {
                                                        id: newId,
                                                        type: 'image',
                                                        label: 'Image Layer',
                                                        props: { url },
                                                        styles: {
                                                            desktop: {
                                                                position: 'absolute',
                                                                top: '20%',
                                                                left: '30%',
                                                                width: '300px',
                                                                height: 'auto',
                                                                zIndex: 10
                                                            }
                                                        }
                                                    };
                                                    const nextSettings = JSON.parse(JSON.stringify(settings));
                                                    if (!nextSettings.layouts[activePage]) nextSettings.layouts[activePage] = { pageId: activePage, layers: [] };
                                                    nextSettings.layouts[activePage].layers.push(newEl);
                                                    setSettings(nextSettings);
                                                    saveHistoryStep();
                                                    setSelectedElementId(newId);
                                                    e.currentTarget.value = '';
                                                }
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => {
                                            const input = document.getElementById('quick-add-image-input') as HTMLInputElement;
                                            const url = input?.value.trim();
                                            if (url) {
                                                const newId = Math.random().toString(36).substr(2, 9);
                                                const newEl: VisualElement = {
                                                    id: newId,
                                                    type: 'image',
                                                    label: 'Image Layer',
                                                    props: { url },
                                                    styles: {
                                                        desktop: {
                                                            position: 'absolute',
                                                            top: '20%',
                                                            left: '30%',
                                                            width: '300px',
                                                            height: 'auto',
                                                            zIndex: 10
                                                        }
                                                    }
                                                };
                                                const nextSettings = JSON.parse(JSON.stringify(settings));
                                                if (!nextSettings.layouts[activePage]) nextSettings.layouts[activePage] = { pageId: activePage, layers: [] };
                                                nextSettings.layouts[activePage].layers.push(newEl);
                                                setSettings(nextSettings);
                                                saveHistoryStep();
                                                setSelectedElementId(newId);
                                                input.value = '';
                                            }
                                        }}
                                        className="p-2.5 bg-[#A855F7] text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Active Layers</h3>
                                    <button onClick={importFromTemplate} className="text-[8px] font-black text-[#A855F7] hover:underline uppercase tracking-widest">Templates</button>
                                </div>
                                <div className="space-y-1">
                                    {currentLayout.layers.map(layer => (
                                        <div
                                            key={layer.id}
                                            onClick={() => setSelectedElementId(layer.id)}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${selectedElementId === layer.id ? 'bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'text-gray-400 hover:bg-white/5 border border-transparent'} ${layer.hidden ? 'opacity-40' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {layer.type === 'text' && <Type size={10} />}
                                                {layer.type === 'image' && <ImageIconLucide size={10} />}
                                                {layer.type === 'button' && <MousePointer2 size={10} />}
                                                {layer.type === 'section' && <Layout size={10} />}
                                                <span className="truncate max-w-[120px]">{layer.label}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleVisibility(layer.id);
                                                }}
                                                className="hover:text-white transition-colors"
                                            >
                                                {layer.hidden ? <EyeOff size={10} /> : <Eye size={10} />}
                                            </button>
                                        </div>
                                    ))}
                                    {currentLayout.layers.length === 0 && (
                                        <div className="py-8 text-center border border-dashed border-white/5 rounded-xl">
                                            <p className="text-[8px] text-gray-600 uppercase font-black tracking-widest">No layers found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {sideTab === 'design' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Brand Palette</h3>
                                <div className="space-y-2">
                                    {Object.entries(settings?.globalDesign.colors || {}).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{key}</span>
                                            <input
                                                type="color"
                                                value={value as string}
                                                onChange={(e) => {
                                                    const next = JSON.parse(JSON.stringify(settings));
                                                    next.globalDesign.colors[key] = e.target.value;
                                                    setSettings(next);
                                                }}
                                                onBlur={saveHistoryStep}
                                                className="w-6 h-6 bg-transparent rounded cursor-pointer border-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {sideTab === 'gallery' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Add Media Assets</h3>
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Paste image URL..."
                                            id="gallery-url-input"
                                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-[#A855F7]/30 transition-all font-mono"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const input = e.currentTarget;
                                                    const url = input.value.trim();
                                                    if (url) {
                                                        const urls = url.split(/[\s,]+/).filter(u => u.startsWith('http'));
                                                        const next = { ...settings!, mediaGallery: [...(settings?.mediaGallery || []), ...urls] };
                                                        setSettings(next);
                                                        saveHistoryStep();
                                                        input.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const input = document.getElementById('gallery-url-input') as HTMLInputElement;
                                                const url = input?.value.trim();
                                                if (url) {
                                                    const urls = url.split(/[\s,]+/).filter(u => u.startsWith('http'));
                                                    const next = { ...settings!, mediaGallery: [...(settings?.mediaGallery || []), ...urls] };
                                                    setSettings(next);
                                                    saveHistoryStep();
                                                    input.value = '';
                                                }
                                            }}
                                            className="p-2.5 bg-[#A855F7] text-white rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 transition-all"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                    <p className="text-[7px] text-gray-600 uppercase font-black tracking-widest pl-1">Supports bulk adding URLs separated by space or comma</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Asset Pool ({settings?.mediaGallery?.length || 0})</h3>
                                    {settings?.mediaGallery?.length && settings.mediaGallery.length > 0 && (
                                        <button
                                            onClick={() => {
                                                if (confirm("Clear all media assets?")) {
                                                    const next = { ...settings!, mediaGallery: [] };
                                                    setSettings(next);
                                                    saveHistoryStep();
                                                }
                                            }}
                                            className="text-[7px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                                        >
                                            Clear All
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {(settings?.mediaGallery || []).map((img, i) => (
                                        <div key={i} className="aspect-square bg-black rounded-xl border border-white/10 overflow-hidden relative group">
                                            <img src={img} className="w-full h-full object-contain p-2" alt="" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button onClick={() => {
                                                    const next = { ...settings!, mediaGallery: settings!.mediaGallery.filter((_, idx) => idx !== i) };
                                                    setSettings(next);
                                                    saveHistoryStep();
                                                }} className="p-1 bg-red-500 rounded text-white active:scale-95 transition-all"><Trash2 size={10} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {(settings?.mediaGallery || []).length === 0 && (
                                        <div className="col-span-2 py-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                            <ImageIcon size={24} className="mx-auto mb-3 text-gray-700" strokeWidth={1} />
                                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">Gallery Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {sideTab === 'backgrounds' && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Global Effects</h3>
                                <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Overlay Darkness</span>
                                            <span>{settings?.backgroundEffects.overlayDarkness}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={settings?.backgroundEffects.overlayDarkness || 0}
                                            onChange={(e) => {
                                                const next = JSON.parse(JSON.stringify(settings));
                                                next.backgroundEffects.overlayDarkness = parseInt(e.target.value);
                                                setSettings(next);
                                            }}
                                            onBlur={saveHistoryStep}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Blur Intensity</span>
                                            <span>{settings?.backgroundEffects.blurIntensity}px</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="20"
                                            value={settings?.backgroundEffects.blurIntensity || 0}
                                            onChange={(e) => {
                                                const next = JSON.parse(JSON.stringify(settings));
                                                next.backgroundEffects.blurIntensity = parseInt(e.target.value);
                                                setSettings(next);
                                            }}
                                            onBlur={saveHistoryStep}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Image Opacity</span>
                                            <span>{settings?.backgroundEffects.imageOpacity}%</span>
                                        </div>
                                        <input
                                            type="range" min="0" max="100"
                                            value={settings?.backgroundEffects.imageOpacity || 0}
                                            onChange={(e) => {
                                                const next = JSON.parse(JSON.stringify(settings));
                                                next.backgroundEffects.imageOpacity = parseInt(e.target.value);
                                                setSettings(next);
                                            }}
                                            onBlur={saveHistoryStep}
                                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#A855F7]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Page Backgrounds</h3>
                                {Object.entries(settings?.pageBackgrounds || {}).map(([page, images]) => (
                                    <div key={page} className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[8px] font-black uppercase text-[#A855F7] tracking-widest">{page}</span>
                                            <button
                                                onClick={() => {
                                                    const url = prompt(`Enter image URL for ${page} background:`);
                                                    if (url) {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        if (!next.pageBackgrounds[page]) next.pageBackgrounds[page] = [];
                                                        next.pageBackgrounds[page].push(url);
                                                        setSettings(next);
                                                        saveHistoryStep();
                                                    }
                                                }}
                                                className="p-1 hover:bg-[#A855F7]/10 rounded text-gray-500 hover:text-[#A855F7] transition-all"
                                                title="Add Background"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {Array.isArray(images) && images.map((img, i) => (
                                                <div key={i} className="w-16 h-16 flex-shrink-0 bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                                    <img src={img} className="w-full h-full object-contain p-1" alt="" />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={() => {
                                                                const next = JSON.parse(JSON.stringify(settings));
                                                                next.pageBackgrounds[page] = next.pageBackgrounds[page].filter((_: any, idx: number) => idx !== i);
                                                                setSettings(next);
                                                                saveHistoryStep();
                                                            }}
                                                            className="p-1 bg-red-500/80 hover:bg-red-500 rounded text-white active:scale-95 transition-all"
                                                        >
                                                            <Trash2 size={8} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!images || images.length === 0) && (
                                                <div className="w-full py-4 text-center border border-dashed border-white/5 rounded-lg">
                                                    <p className="text-[7px] text-gray-700 uppercase font-black">Empty</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {sideTab === 'content' && (
                        <div className="space-y-8">
                            <h3 className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-4">Global Content</h3>
                            {Object.keys(settings?.pageContent || {}).filter(k => k.endsWith('_title')).map(titleKey => {
                                const prefix = titleKey.replace('_title', '');
                                return (
                                    <div key={prefix} className="space-y-3 p-4 bg-white/5 rounded-xl border border-white/5">
                                        <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{prefix}</h4>
                                        <input
                                            type="text"
                                            value={settings?.pageContent?.[titleKey] || ''}
                                            onChange={(e) => {
                                                const next = JSON.parse(JSON.stringify(settings));
                                                if (!next.pageContent) next.pageContent = {};
                                                next.pageContent[titleKey] = e.target.value;
                                                setSettings(next);
                                            }}
                                            onBlur={saveHistoryStep}
                                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] text-white outline-none"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN WORKSPACE --- */}
            <div className="flex-1 flex flex-col relative bg-[#050505] overflow-hidden">
                {/* --- PROFESSIONAL TOOLBAR --- */}
                <div className="h-14 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-30">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Page:</span>
                            <select
                                value={activePage}
                                onChange={(e) => setActivePage(e.target.value as any)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-[#A855F7] outline-none cursor-pointer focus:ring-0"
                            >
                                <option value="home">Home</option>
                                <option value="rental">Rental</option>
                                <option value="buy">Buy</option>
                                <option value="sell">Sell</option>
                                <option value="services">Services</option>
                            </select>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                            {[
                                { id: 'desktop', icon: Monitor },
                                { id: 'tablet', icon: Tablet },
                                { id: 'mobile', icon: Smartphone }
                            ].map(v => (
                                <button
                                    key={v.id}
                                    onClick={() => setViewport(v.id as any)}
                                    className={`p-1.5 rounded-md transition-all ${viewport === v.id ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <v.icon size={14} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <button onClick={undo} disabled={historyIndex <= 0} className="p-2 text-gray-500 hover:text-white disabled:opacity-20"><UndoIcon size={16} /></button>
                            <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 text-gray-500 hover:text-white disabled:opacity-20"><RedoIcon size={16} /></button>
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-colors ${showGrid ? 'text-[#A855F7] bg-[#A855F7]/10' : 'text-gray-500 hover:text-white'}`}><Grid size={16} /></button>
                            <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-md border border-white/5">
                                <span className="text-[9px] font-black text-gray-500">{zoom}%</span>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-[#A855F7] hover:bg-[#9333EA] text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_10px_30px_rgba(168,85,247,0.3)] active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? "Deploying..." : "Publish Site"}
                        </button>
                    </div>
                </div>

                {/* --- CANVAS AREA --- */}
                <div className="flex-1 overflow-auto custom-scrollbar bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center p-20">
                    <div
                        style={{
                            width: viewport === 'desktop' ? '1280px' : viewport === 'tablet' ? '768px' : '375px',
                            transform: `scale(${zoom / 100})`,
                            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        className="bg-[#0a0a0a] min-h-[80vh] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5 rounded-2xl overflow-hidden relative cursor-default"
                        onPointerDown={handleCanvasPointerDown}
                        onPointerMove={handleCanvasPointerMove}
                        onPointerUp={handleCanvasPointerUp}
                    >
                        {showGrid && (
                            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                        )}
                        <BuilderRenderer
                            elements={currentLayout.layers}
                            mode="edit"
                            viewport={viewport}
                            selectedId={selectedElementId || undefined}
                            onElementClick={setSelectedElementId}
                            globalDesign={settings!.globalDesign}
                        />
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: PROPERTIES --- */}
            <div className={`w-80 bg-[#0a0a0a] border-l border-white/5 flex flex-col z-40 transition-all duration-300 ${hidePanels ? 'mr-[-320px] opacity-0' : 'opacity-100'}`}>
                <div className="h-14 flex items-center px-6 border-b border-white/5 justify-between">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Properties</h2>
                    <button onClick={() => setHidePanels(true)} className="p-1 text-gray-600 hover:text-white"><ChevronRight size={14} /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {selectedElement ? (
                        <div className="space-y-8">
                            {/* Selected Element Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#A855F7]/10 rounded-lg flex items-center justify-center text-[#A855F7]">
                                        {selectedElement.type === 'text' && <Type size={14} />}
                                        {selectedElement.type === 'image' && <ImageIconLucide size={14} />}
                                        {selectedElement.type === 'button' && <MousePointer2 size={14} />}
                                        {selectedElement.type === 'section' && <Layout size={14} />}
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase text-white tracking-widest">{selectedElement.type}</h3>
                                        <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest">{selectedElement.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => duplicateElement(selectedElement.id)} className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white" title="Duplicate"><Copy size={12} /></button>
                                    <button onClick={() => deleteElement(selectedElement.id)} className="p-1.5 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-500" title="Delete"><Trash2 size={12} /></button>
                                </div>
                            </div>

                            {/* Properties Tabs */}
                            <div className="flex p-1 bg-black/40 rounded-lg border border-white/5">
                                {['content', 'style', 'animation'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTab(t as any)}
                                        className={`flex-1 py-1.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-[#A855F7] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-6">
                                {activeTab === 'content' && (
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Element Label</label>
                                            <input
                                                type="text"
                                                value={selectedElement.label}
                                                onChange={(e) => {
                                                    const next = JSON.parse(JSON.stringify(settings));
                                                    const layer = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
                                                    if (layer) layer.label = e.target.value;
                                                    setSettings(next);
                                                }}
                                                onBlur={saveHistoryStep}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#A855F7]/30 font-bold"
                                            />
                                        </div>
                                        {selectedElement.type === 'text' && (
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Text Content</label>
                                                <textarea
                                                    value={selectedElement.props.content}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        const layer = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
                                                        if (layer) layer.props.content = e.target.value;
                                                        setSettings(next);
                                                    }}
                                                    onBlur={saveHistoryStep}
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] text-white outline-none focus:border-[#A855F7]/30 min-h-[120px] resize-none"
                                                />
                                            </div>
                                        )}
                                        {selectedElement.type === 'image' && (
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Source URL</label>
                                                <input
                                                    type="text"
                                                    value={selectedElement.props.url || ''}
                                                    onChange={(e) => {
                                                        const next = JSON.parse(JSON.stringify(settings));
                                                        const layer = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
                                                        if (layer) layer.props.url = e.target.value;
                                                        setSettings(next);
                                                    }}
                                                    onBlur={saveHistoryStep}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#A855F7]/30"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'style' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Width</label>
                                                <input
                                                    type="text"
                                                    value={selectedElement.styles[viewport]?.width || selectedElement.styles.desktop.width || 'auto'}
                                                    onChange={(e) => updateElementStyle('width', e.target.value)}
                                                    onBlur={saveHistoryStep}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Height</label>
                                                <input
                                                    type="text"
                                                    value={selectedElement.styles[viewport]?.height || selectedElement.styles.desktop.height || 'auto'}
                                                    onChange={(e) => updateElementStyle('height', e.target.value)}
                                                    onBlur={saveHistoryStep}
                                                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Color & Theme</label>
                                            <div className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-white/5">
                                                <input
                                                    type="color"
                                                    value={selectedElement.styles[viewport]?.color || selectedElement.styles.desktop.color || '#ffffff'}
                                                    onChange={(e) => updateElementStyle('color', e.target.value)}
                                                    onBlur={saveHistoryStep}
                                                    className="w-10 h-10 bg-transparent rounded cursor-pointer border-none p-0"
                                                />
                                                <div className="flex-1">
                                                    <input
                                                        type="text"
                                                        value={selectedElement.styles[viewport]?.color || selectedElement.styles.desktop.color || ''}
                                                        onChange={(e) => updateElementStyle('color', e.target.value)}
                                                        className="w-full bg-transparent text-[11px] font-mono text-white outline-none"
                                                    />
                                                    <p className="text-[7px] text-gray-600 uppercase font-black">Hex Code</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'animation' && (
                                    <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl opacity-40">
                                        <Sparkles size={24} className="mx-auto text-gray-600 mb-3" />
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600 leading-relaxed">Advanced Animations<br />In Engine v3.0</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10 opacity-20">
                            <MousePointer2 size={40} className="mb-6 text-gray-600" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 leading-relaxed">Artboard Mode<br />Select an element</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

