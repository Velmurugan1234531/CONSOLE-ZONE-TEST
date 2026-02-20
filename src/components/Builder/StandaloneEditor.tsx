"use client";

import React, { useState, useEffect } from 'react';
import { VisualsService, VisualSettings, VisualElement } from '@/services/visuals';
import { BuilderRenderer } from './BuilderRenderer';
import { Toolbar } from './Toolbar';
import { LayerPanel } from './LayerPanel';
import { PropertiesPanel } from './PropertiesPanel';
import { MasterThemePanel } from './MasterThemePanel';

export const StandaloneEditor: React.FC = () => {
    const [settings, setSettings] = useState<VisualSettings | null>(null);
    const [originalSettings, setOriginalSettings] = useState<VisualSettings | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [activePage, setActivePage] = useState<any>('home');
    const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [hidePanels, setHidePanels] = useState(false);
    const [activeTab, setActiveTab] = useState<'content' | 'style' | 'animation' | 'advanced'>('content');
    const [showGlobalSettings, setShowGlobalSettings] = useState(false);
    const [history, setHistory] = useState<VisualSettings[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialX: 0, initialY: 0 });

    useEffect(() => {
        const init = async () => {
            const current = await VisualsService.getSettings();
            setSettings(current);
            setOriginalSettings(JSON.parse(JSON.stringify(current)));
            setHistory([JSON.parse(JSON.stringify(current))]);
            setHistoryIndex(0);
        };
        init();
    }, []);

    const pushToHistory = (newSettings: VisualSettings) => {
        setHistory(prev => {
            const next = prev.slice(0, historyIndex + 1);
            next.push(JSON.parse(JSON.stringify(newSettings)));
            if (next.length > 50) next.shift();
            return next;
        });
        setHistoryIndex(prev => Math.min(prev + 1, 49));
    };

    const saveHistoryStep = () => {
        if (!settings) return;
        pushToHistory(settings);
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

    const addElement = (type: VisualElement['type']) => {
        if (!settings) return;
        const newEl: VisualElement = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            props: type === 'text' ? { content: 'New Text Element', tag: 'div' } : {},
            styles: {
                desktop: {
                    position: 'absolute',
                    top: '100px',
                    left: '100px',
                    padding: '20px',
                    color: '#ffffff',
                    background: type === 'container' ? 'rgba(255,255,255,0.05)' : 'transparent',
                    border: type === 'container' ? '1px dashed rgba(255,255,255,0.1)' : 'none'
                }
            }
        };

        const nextSettings = JSON.parse(JSON.stringify(settings));
        nextSettings.layouts[activePage].layers.push(newEl);
        setSettings(nextSettings);
        pushToHistory(nextSettings);
        setSelectedElementId(newEl.id);
    };

    const deleteElement = (id: string) => {
        if (!settings) return;
        const nextSettings = JSON.parse(JSON.stringify(settings));
        nextSettings.layouts[activePage].layers = nextSettings.layouts[activePage].layers.filter((l: any) => l.id !== id);
        setSettings(nextSettings);
        pushToHistory(nextSettings);
        if (selectedElementId === id) setSelectedElementId(null);
    };

    const updateElementStyle = (key: string, value: any) => {
        if (!selectedElementId || !settings) return;
        const next = JSON.parse(JSON.stringify(settings));
        const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
        if (el) {
            const styleKey = viewport || 'desktop';
            if (!el.styles[styleKey]) el.styles[styleKey] = { ...el.styles.desktop };
            el.styles[styleKey] = { ...el.styles[styleKey], [key]: value };
            setSettings(next);
        }
    };

    const updateElementProp = (key: string, value: any) => {
        if (!selectedElementId || !settings) return;
        const next = JSON.parse(JSON.stringify(settings));
        const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
        if (el) {
            el.props[key] = value;
            setSettings(next);
        }
    };

    const updateElementAnimation = (anim: any) => {
        if (!selectedElementId || !settings) return;
        const next = JSON.parse(JSON.stringify(settings));
        const el = next.layouts[activePage].layers.find((l: any) => l.id === selectedElementId);
        if (el) {
            el.animation = { ...el.animation, ...anim };
            setSettings(next);
            saveHistoryStep();
        }
    };

    const handleOpenMediaLibrary = () => {
        // WordPress native media picker bridge
        const wp = (window as any).wp;
        if (wp && wp.media) {
            const frame = wp.media({
                title: 'Select or Upload Image',
                button: { text: 'Use this image' },
                multiple: false
            });

            frame.on('select', () => {
                const attachment = frame.state().get('selection').first().toJSON();
                updateElementProp('url', attachment.url);
                saveHistoryStep();
            });

            frame.open();
        } else {
            // Fallback/Development mode
            const url = prompt("Enter Image URL (Development Fallback):", "https://images.unsplash.com/photo-1621259182978-fbf93132d53d?q=80&w=2000");
            if (url) {
                updateElementProp('url', url);
                saveHistoryStep();
            }
        }
    };

    const importFromTemplate = () => {
        if (!settings) return;
        if (!confirm("This will overwrite existing layers on this page. Continue?")) return;

        const next = JSON.parse(JSON.stringify(settings));
        let layers: VisualElement[] = [];

        if (activePage === 'home') {
            layers = [
                {
                    id: 'hero-title',
                    type: 'text',
                    label: 'Main Headline',
                    props: { content: "EVOLVE YOUR GEAR", tag: 'h1' },
                    styles: {
                        desktop: {
                            position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '120px', fontWeight: '900', color: '#ffffff', textAlign: 'center', width: '1000px', zIndex: 10
                        }
                    }
                },
                {
                    id: 'hero-subtitle',
                    type: 'text',
                    label: 'Sub-headline',
                    props: { content: "Rent. Buy. Sell. The Premium Gaming Ecosystem.", tag: 'p' },
                    styles: {
                        desktop: {
                            position: 'absolute', top: '55%', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '24px', color: '#94a3b8', textAlign: 'center', width: '100%', zIndex: 10
                        }
                    }
                }
            ];
        } else if (activePage === 'rental') {
            layers = [
                {
                    id: 'rental-title',
                    type: 'text',
                    label: 'Page Header',
                    props: { content: "RENTAL FLEET", tag: 'h1' },
                    styles: {
                        desktop: {
                            position: 'absolute', top: '100px', left: '50px',
                            fontSize: '60px', fontWeight: '900', color: '#A855F7'
                        }
                    }
                }
            ];
        }

        next.layouts[activePage].layers = layers;
        setSettings(next);
        pushToHistory(next);
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await VisualsService.saveSettings(settings);
            setOriginalSettings(JSON.parse(JSON.stringify(settings)));
        } finally {
            setIsSaving(false);
        }
    };

    const handleCanvasPointerDown = (e: React.PointerEvent) => {
        if (selectedElementId && e.target instanceof HTMLElement) {
            const el = document.getElementById(selectedElementId);
            if (el && el.contains(e.target as Node)) {
                setIsDragging(true);
                const rect = el.getBoundingClientRect();
                const selected = settings?.layouts[activePage].layers.find(l => l.id === selectedElementId);
                setDragStart({
                    x: e.clientX,
                    y: e.clientY,
                    initialX: parseInt(selected?.styles[viewport]?.left || selected?.styles.desktop.left || '0') || 0,
                    initialY: parseInt(selected?.styles[viewport]?.top || selected?.styles.desktop.top || '0') || 0
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

    if (!settings) return null;

    const selectedElement = settings.layouts[activePage].layers.find(l => l.id === selectedElementId) || null;

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-hidden">
            <Toolbar
                activePage={activePage}
                onPageChange={setActivePage}
                viewport={viewport}
                onViewportChange={setViewport}
                zoom={zoom}
                onZoomChange={setZoom}
                onUndo={undo}
                onRedo={redo}
                onSave={handleSave}
                isSaving={isSaving}
                showGlobalSettings={showGlobalSettings}
                onToggleGlobalSettings={() => {
                    setShowGlobalSettings(!showGlobalSettings);
                    if (!showGlobalSettings) setSelectedElementId(null);
                }}
                hidePanels={hidePanels}
                onTogglePanels={() => setHidePanels(!hidePanels)}
            />

            <div className="flex-1 flex overflow-hidden">
                {!hidePanels && (
                    <LayerPanel
                        layers={settings.layouts[activePage].layers}
                        selectedId={selectedElementId}
                        onSelect={setSelectedElementId}
                        onAdd={addElement}
                        onDelete={deleteElement}
                        onToggleVisibility={(id) => {
                            const next = JSON.parse(JSON.stringify(settings));
                            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
                            if (el) el.hidden = !el.hidden;
                            setSettings(next);
                            saveHistoryStep();
                        }}
                        onImportTemplate={importFromTemplate}
                        onDuplicate={(id) => {
                            const next = JSON.parse(JSON.stringify(settings));
                            const el = next.layouts[activePage].layers.find((l: any) => l.id === id);
                            if (el) {
                                const newEl = JSON.parse(JSON.stringify(el));
                                newEl.id = Math.random().toString(36).substr(2, 9);
                                newEl.label = `${el.label} (Copy)`;
                                next.layouts[activePage].layers.push(newEl);
                                setSettings(next);
                                pushToHistory(next);
                            }
                        }}
                    />
                )}

                <div
                    className="flex-1 bg-[#0f0f0f] relative overflow-hidden flex items-center justify-center p-20"
                    onPointerDown={handleCanvasPointerDown}
                    onPointerMove={handleCanvasPointerMove}
                    onPointerUp={handleCanvasPointerUp}
                >
                    <div
                        className="transition-all duration-500 shadow-[0_0_100px_rgba(0,0,0,0.5)] bg-black relative"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            width: viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%',
                            height: viewport === 'mobile' ? '667px' : viewport === 'tablet' ? '1024px' : '100%',
                            minHeight: viewport === 'desktop' ? '800px' : 'auto'
                        }}
                    >
                        <BuilderRenderer
                            elements={settings.layouts[activePage].layers}
                            globalDesign={settings.globalDesign}
                            selectedId={selectedElementId || undefined}
                            onElementClick={(id, key, val) => {
                                setSelectedElementId(id);
                                if (key && val !== undefined) {
                                    updateElementProp(key, val);
                                    saveHistoryStep();
                                }
                            }}
                            mode="edit"
                        />
                    </div>
                </div>

                {!hidePanels && (
                    <>
                        {showGlobalSettings ? (
                            <MasterThemePanel
                                settings={settings}
                                onClose={() => setShowGlobalSettings(false)}
                                onUpdateColor={(key, val) => {
                                    const next = JSON.parse(JSON.stringify(settings));
                                    next.globalDesign.colors[key] = val;
                                    setSettings(next);
                                    saveHistoryStep();
                                }}
                                onUpdateFont={(key, val) => {
                                    const next = JSON.parse(JSON.stringify(settings));
                                    next.globalDesign.typography[key] = val;
                                    setSettings(next);
                                    saveHistoryStep();
                                }}
                            />
                        ) : selectedElement && (
                            <PropertiesPanel
                                selectedElement={selectedElement}
                                settings={settings}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                viewport={viewport}
                                updateElementStyle={updateElementStyle}
                                updateElementProp={updateElementProp}
                                updateElementAnimation={updateElementAnimation}
                                onOpenMediaLibrary={handleOpenMediaLibrary}
                                saveHistoryStep={saveHistoryStep}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
