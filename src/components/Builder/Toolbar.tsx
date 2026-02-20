import React from 'react';
import {
    Monitor, Tablet, Smartphone, ZoomIn, Plus, Minus,
    RotateCcw as UndoIcon, RotateCw as RedoIcon, Save,
    Eye, EyeOff, Sparkles
} from 'lucide-react';

interface ToolbarProps {
    activePage: string;
    onPageChange: (page: any) => void;
    viewport: 'desktop' | 'tablet' | 'mobile';
    onViewportChange: (v: 'desktop' | 'tablet' | 'mobile') => void;
    zoom: number;
    onZoomChange: (z: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave: () => void;
    isSaving: boolean;
    showGlobalSettings: boolean;
    onToggleGlobalSettings: () => void;
    hidePanels: boolean;
    onTogglePanels: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = (props) => {
    return (
        <div className="h-14 bg-[#0a0a0a] border-b border-white/10 flex items-center justify-between px-6 z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
                    {['home', 'rental', 'buy', 'sell', 'services'].map(page => (
                        <button
                            key={page}
                            onClick={() => props.onPageChange(page)}
                            className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${props.activePage === page ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                <div className="h-6 w-[1px] bg-white/10" />

                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl">
                    <button onClick={() => props.onViewportChange('desktop')} className={`p-2 rounded-lg transition-all ${props.viewport === 'desktop' ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}><Monitor size={14} /></button>
                    <button onClick={() => props.onViewportChange('tablet')} className={`p-2 rounded-lg transition-all ${props.viewport === 'tablet' ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}><Tablet size={14} /></button>
                    <button onClick={() => props.onViewportChange('mobile')} className={`p-2 rounded-lg transition-all ${props.viewport === 'mobile' ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white'}`}><Smartphone size={14} /></button>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2">
                        <button onClick={() => props.onUndo()} className="text-gray-500 hover:text-white transition-colors"><UndoIcon size={14} /></button>
                        <button onClick={() => props.onRedo()} className="text-gray-500 hover:text-white transition-colors"><RedoIcon size={14} /></button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                    <button onClick={() => props.onZoomChange(Math.max(25, props.zoom - 25))} className="text-gray-500 hover:text-white"><Minus size={12} /></button>
                    <span className="text-[9px] font-black text-white w-8 text-center">{props.zoom}%</span>
                    <button onClick={() => props.onZoomChange(Math.min(200, props.zoom + 25))} className="text-gray-500 hover:text-white"><Plus size={12} /></button>
                </div>

                <button
                    onClick={props.onToggleGlobalSettings}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${props.showGlobalSettings ? 'bg-[#A855F7] text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                    <Sparkles size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Master Theme</span>
                </button>

                <div className="h-6 w-[1px] bg-white/10" />

                <button
                    onClick={props.onSave}
                    disabled={props.isSaving}
                    className="flex items-center gap-2 bg-[#A855F7] hover:bg-[#9333EA] text-white px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                    {props.isSaving ? "Deploying..." : "Publish Site"}
                </button>

                <button onClick={props.onTogglePanels} className="text-gray-600 hover:text-white transition-colors">
                    {props.hidePanels ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
        </div>
    );
};
