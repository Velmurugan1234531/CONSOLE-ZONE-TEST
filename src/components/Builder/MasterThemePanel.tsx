import React from 'react';
import { Sparkles, Palette, Type, Plus } from 'lucide-react';
import { VisualSettings } from '@/services/visuals';

interface MasterThemePanelProps {
    settings: VisualSettings;
    onUpdateColor: (key: string, value: string) => void;
    onUpdateFont: (key: string, value: string) => void;
    onClose: () => void;
}

export const MasterThemePanel: React.FC<MasterThemePanelProps> = (props) => {
    const { settings } = props;

    return (
        <div className="w-80 bg-[#0a0a0a] border-l border-white/10 flex flex-col transition-all duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-[#A855F7] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles size={12} /> Master Design
                    </h3>
                    <button onClick={props.onClose} className="text-gray-600 hover:text-white"><Plus className="rotate-45" size={16} /></button>
                </div>

                <div className="space-y-10">
                    {/* Global Colors */}
                    <div>
                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Palette size={10} /> Brand Colors
                        </h4>
                        <div className="space-y-4">
                            {[
                                { key: 'primary', label: 'Primary Brand' },
                                { key: 'secondary', label: 'Secondary Accent' },
                                { key: 'accent', label: 'Neon Highlights' },
                                { key: 'background', label: 'Deep Background' },
                                { key: 'surface', label: 'Panel Surface' }
                            ].map(color => (
                                <div key={color.key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] font-bold text-white uppercase tracking-widest">{color.label}</span>
                                        <span className="text-[8px] text-white/30 font-mono uppercase">{(settings.globalDesign.colors as any)[color.key]}</span>
                                    </div>
                                    <input
                                        type="color"
                                        value={(settings.globalDesign.colors as any)[color.key]}
                                        onChange={(e) => props.onUpdateColor(color.key, e.target.value)}
                                        className="w-10 h-10 bg-transparent border-none cursor-pointer p-0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Global Typography */}
                    <div>
                        <h4 className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Type size={10} /> Site Typography
                        </h4>
                        <div className="space-y-4">
                            {[
                                { key: 'display', label: 'Headers & Titles' },
                                { key: 'body', label: 'Body & Paragraphs' }
                            ].map(font => (
                                <div key={font.key} className="space-y-2">
                                    <label className="text-[8px] text-white/30 uppercase tracking-widest font-black">{font.label}</label>
                                    <select
                                        value={(settings.globalDesign.typography as any)[font.key]}
                                        onChange={(e) => props.onUpdateFont(font.key, e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                                    >
                                        <option value="Inter, sans-serif">Inter (Modern)</option>
                                        <option value="'Outfit', sans-serif">Outfit (Premium)</option>
                                        <option value="'Rajdhani', sans-serif">Rajdhani (Gaming)</option>
                                        <option value="'JetBrains Mono', monospace">JetBrains (Tech)</option>
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
