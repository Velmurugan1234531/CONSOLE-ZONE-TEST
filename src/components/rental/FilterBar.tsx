import React from 'react';
import { Filter, SortAsc, SortDesc } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterBarProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
    sortBy: 'name' | 'available' | 'price';
    onSortChange: (sort: 'name' | 'available' | 'price') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    categories,
    activeCategory,
    onCategoryChange,
    sortBy,
    onSortChange
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full no-scrollbar">
                <Filter size={18} className="text-gray-400 shrink-0" />
                <button
                    onClick={() => onCategoryChange('All')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === 'All' ? 'bg-[#A855F7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                    All
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => onCategoryChange(cat)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-[#A855F7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-4 shrink-0">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sort By:</span>
                <div className="flex bg-black/40 rounded-lg p-1">
                    <button
                        onClick={() => onSortChange('name')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${sortBy === 'name' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Name
                    </button>
                    <button
                        onClick={() => onSortChange('available')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${sortBy === 'available' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Availability
                    </button>
                </div>
            </div>
        </div>
    );
};
