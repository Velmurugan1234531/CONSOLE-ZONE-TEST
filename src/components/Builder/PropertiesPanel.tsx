import React from 'react';
import {
    Plus, Sparkles, Wind, Timer, Palette, Type, Sliders,
    AlignLeft, AlignCenter, AlignRight, BoxSelect, Copy, Clipboard
} from 'lucide-react';
import { VisualElement, GlobalDesign, VisualSettings } from '@/services/visuals';

interface PropertiesPanelProps {
    selectedElement: VisualElement | null;
    settings: VisualSettings;
    activeTab: 'content' | 'style' | 'animation' | 'advanced';
    setActiveTab: (tab: any) => void;
    viewport: 'desktop' | 'tablet' | 'mobile';
    updateElementStyle: (key: string, value: any) => void;
    updateElementProp: (key: string, value: any) => void;
    updateElementAnimation: (anim: any) => void;
    onOpenMediaLibrary?: () => void;
    saveHistoryStep: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
    const { selectedElement, activeTab, viewport, settings } = props;

    if (!selectedElement) return null;

    return (
        <div className="w-80 bg-[#0a0a0a] border-l border-white/10 flex flex-col transition-all duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Properties</h3>
                </div>

                <div className="flex border-b border-white/5 mb-8">
                    {['content', 'style', 'animation', 'advanced'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => props.setActiveTab(tab as any)}
                            className={`flex-1 py-3 transition-colors text-[9px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-[#A855F7] border-b-2 border-[#A855F7]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {tab.slice(0, 4)}
                        </button>
                    ))}
                </div>

                <div className="space-y-8">
                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            {selectedElement.type === 'text' && (
                                <div className="space-y-4">
                                    <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block">Text Content</label>
                                    <textarea
                                        value={selectedElement.props.content || ''}
                                        onChange={(e) => props.updateElementProp('content', e.target.value)}
                                        onBlur={props.saveHistoryStep}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-[#A855F7] outline-none resize-none"
                                        rows={4}
                                    />
                                </div>
                            )}

                            {selectedElement.type === 'image' && (
                                <div className="space-y-4">
                                    <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block">Image URL</label>
                                    <input
                                        type="text"
                                        value={selectedElement.props.url || ''}
                                        onChange={(e) => props.updateElementProp('url', e.target.value)}
                                        onBlur={props.saveHistoryStep}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                        placeholder="https://..."
                                    />
                                    <button
                                        onClick={props.onOpenMediaLibrary}
                                        className="w-full bg-white/5 hover:bg-[#A855F7] text-white text-[9px] font-black uppercase py-2.5 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={10} /> Open Media Library
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'style' && (
                        <div className="space-y-8">
                            {/* Layout Controls */}
                            <div>
                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Alignment</label>
                                <div className="flex gap-1 bg-black p-1 rounded-xl border border-white/5">
                                    {[
                                        { id: 'left', icon: <AlignLeft size={14} /> },
                                        { id: 'center', icon: <AlignCenter size={14} /> },
                                        { id: 'right', icon: <AlignRight size={14} /> }
                                    ].map(align => (
                                        <button
                                            key={align.id}
                                            onClick={() => props.updateElementStyle('textAlign', align.id)}
                                            className={`flex-1 py-1.5 rounded-lg flex justify-center transition-all ${selectedElement.styles[viewport]?.textAlign === align.id ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {align.icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Dimensions */}
                            <div>
                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Geometry ({viewport})</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {['left', 'top', 'width', 'height'].map(prop => (
                                        <div key={prop}>
                                            <input
                                                type="text"
                                                value={selectedElement.styles[viewport]?.[prop] || selectedElement.styles.desktop[prop] || ''}
                                                onChange={(e) => props.updateElementStyle(prop, e.target.value)}
                                                onBlur={props.saveHistoryStep}
                                                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                            />
                                            <span className="text-[8px] text-white/30 uppercase block mt-1 tracking-widest font-black">{prop}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'animation' && (
                        <div className="space-y-8">
                            <div>
                                <label className="text-[9px] text-gray-600 font-bold uppercase tracking-widest block mb-4">Entrance Effect</label>
                                <select
                                    value={selectedElement.animation?.type || 'none'}
                                    onChange={(e) => props.updateElementAnimation({ type: e.target.value })}
                                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none"
                                >
                                    <option value="none">None</option>
                                    <option value="fade">Fade In</option>
                                    <option value="slide">Slide In</option>
                                    <option value="zoom">Zoom In</option>
                                    <option value="bounce">Bounce</option>
                                    <option value="rotate">Rotate</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
