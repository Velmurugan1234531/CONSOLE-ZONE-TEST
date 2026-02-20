"use client";

import React, { useRef } from 'react';
import { Download, Printer, X } from 'lucide-react';

interface QRGeneratorProps {
    value: string;
    title?: string;
    subtitle?: string;
    onClose?: () => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ value, title, subtitle, onClose }) => {
    const canvasRef = useRef<HTMLDivElement>(null);

    const downloadQR = () => {
        const img = document.querySelector('img[alt^="Asset Tag"]');
        if (img) {
            const url = (img as HTMLImageElement).src;
            fetch(url)
                .then(response => response.blob())
                .then(blob => {
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.download = `qr-${value}.png`;
                    link.href = blobUrl;
                    link.click();
                    window.URL.revokeObjectURL(blobUrl);
                });
        }
    };

    const printQR = () => {
        const content = canvasRef.current;
        if (!content) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const img = document.querySelector('img[alt^="Asset Tag"]');
        if (!img) return;
        const dataUrl = (img as HTMLImageElement).src;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Asset Tag - ${value}</title>
                    <style>
                        body { 
                            display: flex; 
                            flex-direction: column; 
                            align-items: center; 
                            justify-content: center; 
                            height: 100vh; 
                            margin: 0; 
                            font-family: sans-serif;
                            background: white;
                        }
                        .tag {
                            border: 2px solid black;
                            padding: 20px;
                            text-align: center;
                            border-radius: 10px;
                        }
                        h1 { font-size: 24px; margin: 10px 0; }
                        h2 { font-size: 18px; margin: 5px 0; color: #666; }
                        img { width: 300px; height: 300px; }
                        .serial { font-family: monospace; font-weight: bold; margin-top: 10px; font-size: 20px; }
                    </style>
                </head>
                <body>
                    <div class="tag">
                        <h1>${title || 'CONSOLE ZONE'}</h1>
                        ${subtitle ? `<h2>${subtitle}</h2>` : ''}
                        <img src="${dataUrl}" />
                        <div class="serial">${value}</div>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[32px] w-full max-w-md space-y-6 relative overflow-hidden shadow-2xl">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8B5CF6]/10 blur-[60px] -z-10"></div>

            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">{title || 'Asset Identity'}</h3>
                    <p className="text-xs text-gray-500 font-mono tracking-widest mt-1 uppercase italic">{subtitle || 'Hardware Tag'}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                )}
            </div>

            <div ref={canvasRef} className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl">
                <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(value)}&color=000000&bgcolor=FFFFFF&margin=10`}
                    alt={`Asset Tag ${value}`}
                    className="w-[200px] h-[200px]"
                    crossOrigin="anonymous"
                />
            </div>

            <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 block mb-1">Encrypted Payload</span>
                    <span className="text-sm font-mono font-bold text-[#8B5CF6] break-all">{value}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={downloadQR}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all text-sm font-bold text-white group"
                    >
                        <Download size={16} className="text-[#8B5CF6] group-hover:scale-110 transition-transform" />
                        Save Image
                    </button>
                    <button
                        onClick={printQR}
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-2xl transition-all text-sm font-bold text-white shadow-[0_4px_20px_rgba(139,92,246,0.3)] group"
                    >
                        <Printer size={16} className="group-hover:scale-110 transition-transform" />
                        Print Tag
                    </button>
                </div>
            </div>
        </div>
    );
};
