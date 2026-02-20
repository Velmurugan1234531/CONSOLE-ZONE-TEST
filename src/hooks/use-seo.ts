import { useEffect } from 'react';
import { getSiteSettings } from '@/services/site-settings';

export const usePageSEO = (pageKey: string) => {
    useEffect(() => {
        const updateSEO = () => {
            const settings = getSiteSettings();

            if (settings.seo && settings.seo[pageKey]) {
                const { title, description, keywords } = settings.seo[pageKey];

                // Update Title
                if (title) document.title = title;

                // Update Meta Description
                const metaDesc = document.querySelector('meta[name="description"]');
                if (metaDesc) {
                    metaDesc.setAttribute('content', description);
                } else {
                    const meta = document.createElement('meta');
                    meta.name = "description";
                    meta.content = description;
                    document.head.appendChild(meta);
                }

                // Update Meta Keywords
                const metaKw = document.querySelector('meta[name="keywords"]');
                if (metaKw) {
                    metaKw.setAttribute('content', keywords);
                } else {
                    const meta = document.createElement('meta');
                    meta.name = "keywords";
                    meta.content = keywords;
                    document.head.appendChild(meta);
                }
            }
        };

        // Initial load
        updateSEO();

        // Listen for storage changes (cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'site_settings') {
                updateSEO();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [pageKey]);
};
