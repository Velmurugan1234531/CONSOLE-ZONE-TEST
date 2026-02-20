import React from 'react';
import {
    Layers, Plus, Trash2, Copy, Eye, EyeOff, Layout, Type,
    ImageIcon as ImageIconLucide, MousePointer2
} from 'lucide-react';
import { VisualElement } from '@/services/visuals';

interface LayerPanelProps {
    layers: VisualElement[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: (type: VisualElement['type']) => void;
    onDelete: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onImportTemplate: () => void;
    onDuplicate: (id: string) => void;
}

export const LayerPanel: React.FC<LayerPanelProps> = (props) => {
    const renderLayerItem = (el: VisualElement, depth = 0) => (
        <React.Fragment key={el.id}>
            <div
                onClick={() => props.onSelect(el.id)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border group ${props.selectedId === el.id ? 'bg-[#A855F7]/10 border-[#A855F7]/30 shadow-lg' : 'hover:bg-white/5 border-transparent'}`}
                style={{ marginLeft: `${depth * 12}px` }}
            >
                <div className="flex items-center gap-3">
                    <div className={`${props.selectedId === el.id ? 'text-[#A855F7]' : 'text-gray-500'} group-hover:scale-110 transition-transform`}>
                        {el.type === 'text' && <Type size={14} />}
                        {el.type === 'image' && <ImageIconLucide size={14} />}
                        {(el.type === 'section' || el.type === 'container') && <Layers size={14} />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${props.selectedId === el.id ? 'text-white' : 'text-gray-400'}`}>{el.label}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); props.onToggleVisibility(el.id); }} className="p-1 px-1.5 text-gray-600 hover:text-white">
                        {el.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); props.onDuplicate(el.id); }} className="p-1 px-1.5 text-gray-600 hover:text-[#A855F7]"><Copy size={11} /></button>
                    <button onClick={(e) => { e.stopPropagation(); props.onDelete(el.id); }} className="p-1 px-1.5 text-gray-600 hover:text-red-500"><Trash2 size={11} /></button>
                </div>
            </div>
            {el.children?.map(child => renderLayerItem(child, depth + 1))}
        </React.Fragment>
    );

    return (
        <div className="w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col">
            <div className="p-6 flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Layout size={12} /> Canvas Layers
                </h3>
                <button
                    onClick={props.onImportTemplate}
                    className="text-[9px] font-black text-[#A855F7] uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1"
                >
                    <Plus size={10} /> Import Template
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {props.layers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-3xl m-2">
                        <div className="w-12 h-12 bg-[#A855F7]/10 rounded-2xl flex items-center justify-center mb-4"><MousePointer2 className="text-[#A855F7]" size={20} /></div>
                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-1">Canvas is Empty</p>
                        <p className="text-[9px] text-gray-700 leading-relaxed uppercase">Add your first element to start designing</p>
                    </div>
                ) : (
                    props.layers.map(el => renderLayerItem(el))
                )}
            </div>

            <div className="p-4 grid grid-cols-2 gap-2 border-t border-white/5 bg-black/40">
                {[
                    { type: 'section', label: 'Section', icon: <Layers size={12} /> },
                    { type: 'text', label: 'Text', icon: <Type size={12} /> },
                    { type: 'image', label: 'Image', icon: <ImageIconLucide size={12} /> },
                    { type: 'button', label: 'Button', icon: <Plus size={12} /> }
                ].map(tool => (
                    <button
                        key={tool.type}
                        onClick={() => props.onAdd(tool.type as any)}
                        className="flex items-center gap-2 bg-white/5 hover:bg-[#A855F7] hover:text-white text-gray-400 p-2.5 rounded-xl transition-all border border-white/5 group"
                    >
                        <span className="group-hover:scale-110 transition-transform">{tool.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{tool.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
