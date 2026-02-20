"use client";

import { useState } from "react";
import { Camera, X, Upload, AlertTriangle, Shield, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DamageType,
    uploadDamagePhoto,
    createDamageReport,
    getEstimatedCostRange,
    calculateDamageCost
} from "@/services/damage-reports";
import { ProtectionPlanType } from "@/services/protection";

interface DamageReportFormProps {
    rentalId: string;
    deviceId: string;
    deviceName: string;
    protectionPlan?: ProtectionPlanType;
    onSubmit?: () => void;
    onCancel?: () => void;
}

export function DamageReportForm({
    rentalId,
    deviceId,
    deviceName,
    protectionPlan = 'none',
    onSubmit,
    onCancel
}: DamageReportFormProps) {
    const [damageType, setDamageType] = useState<DamageType>('cosmetic');
    const [description, setDescription] = useState('');
    const [estimatedCost, setEstimatedCost] = useState(1000);
    const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const costRange = getEstimatedCostRange(damageType);
    const liability = calculateDamageCost(damageType, estimatedCost, protectionPlan);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setIsUploading(true);
        try {
            for (let i = 0; i < Math.min(files.length, 5); i++) {
                const photo = await uploadDamagePhoto(files[i]);
                setPhotos(prev => [...prev, photo]);
            }
        } catch (error) {
            alert('Failed to upload photos');
        } finally {
            setIsUploading(false);
        }
    };

    const removePhoto = (id: string) => {
        setPhotos(prev => prev.filter(p => p.id !== id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await createDamageReport({
                rentalId,
                deviceId,
                reportedBy: 'admin',
                damageType,
                description,
                photos,
                estimatedCost,
                protectionPlan,
                customerLiability: liability.customerLiability,
                coverageAmount: liability.coverageAmount
            });

            alert('Damage report created successfully!');
            onSubmit?.();
        } catch (error) {
            alert('Failed to create damage report');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto"
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Damage Report</h3>
                    <p className="text-xs text-gray-400 mt-1">{deviceName}</p>
                </div>
                {onCancel && (
                    <button onClick={onCancel} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Damage Type */}
                <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3 block">
                        Damage Type
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['cosmetic', 'functional', 'severe'] as DamageType[]).map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => {
                                    setDamageType(type);
                                    const range = getEstimatedCostRange(type);
                                    setEstimatedCost(range.typical);
                                }}
                                className={`
                                    p-4 rounded-xl border transition-all text-left
                                    ${damageType === type
                                        ? 'bg-[#A855F7]/10 border-[#A855F7] ring-2 ring-[#A855F7]/50'
                                        : 'bg-[#0a0a0a] border-white/10 hover:border-white/30'
                                    }
                                `}
                            >
                                <div className="text-sm font-bold text-white capitalize">{type}</div>
                                <div className="text-[10px] text-gray-500 mt-1">
                                    ₹{getEstimatedCostRange(type).typical.toLocaleString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-2 block">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        required
                        placeholder="Describe the damage in detail..."
                        className="w-full bg-[#120520] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#A855F7] resize-none"
                    />
                </div>

                {/* Photo Upload */}
                <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3 block flex items-center gap-2">
                        <Camera size={14} />
                        Photos (Optional)
                    </label>

                    <div className="grid grid-cols-5 gap-3">
                        {photos.map(photo => (
                            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                <img src={photo.url} alt="Damage" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(photo.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        {photos.length < 5 && (
                            <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 hover:border-[#A855F7]/50 flex items-center justify-center cursor-pointer bg-white/5 transition-all">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                                <Upload size={20} className="text-gray-500" />
                            </label>
                        )}
                    </div>
                </div>

                {/* Cost Estimate */}
                <div>
                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-2 block">
                        Estimated Cost (₹)
                    </label>
                    <input
                        type="number"
                        value={estimatedCost}
                        onChange={(e) => setEstimatedCost(Number(e.target.value))}
                        min={costRange.min}
                        max={costRange.max}
                        required
                        className="w-full bg-[#120520] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#A855F7]"
                    />
                    <div className="text-[10px] text-gray-500 mt-1">
                        Typical range: ₹{costRange.min.toLocaleString()} - ₹{costRange.max.toLocaleString()}
                    </div>
                </div>

                {/* Coverage Calculation */}
                <div className="bg-gradient-to-br from-[#A855F7]/10 to-[#8B5CF6]/10 border border-[#A855F7]/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="text-[#A855F7]" size={16} />
                        <h4 className="text-sm font-bold text-white">Coverage Breakdown</h4>
                    </div>

                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Total Damage:</span>
                            <span className="font-bold text-white">₹{liability.totalDamage.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Protection Coverage:</span>
                            <span className="font-bold text-emerald-500">-₹{liability.coverageAmount.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 mt-2 flex justify-between">
                            <span className="text-gray-300">Customer Pays:</span>
                            <span className="font-black text-lg text-[#A855F7]">₹{liability.customerLiability.toLocaleString()}</span>
                        </div>
                        {protectionPlan !== 'none' && (
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <Shield size={10} />
                                {protectionPlan.toUpperCase()} plan saved ₹{liability.protectionSavings.toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !description}
                        className="flex-1 py-3 bg-[#A855F7] hover:bg-[#9333EA] text-white font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A855F7]/20"
                    >
                        {isSubmitting ? 'Creating...' : 'Create Report'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
