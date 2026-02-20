import { createClient } from "@/lib/supabase/client";
import { ServiceItem } from "@/types";

export const getServices = async (): Promise<ServiceItem[]> => {
    const supabase = createClient();

    try {
        const { data, error } = await supabase
            .from('repair_services')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.warn("Supabase fetch failed. Returning mock data.", error);
            // Fallback
            return [
                {
                    id: 'mock-1',
                    name: 'HDMI Port Replacement (Mock)',
                    category: 'Repair',
                    price: 2499,
                    duration: '24h',
                    status: 'Active',
                    description: 'Fixing broken or loose HDMI ports.'
                },
                {
                    id: 'mock-2',
                    name: 'Thermal Paste Re-application (Mock)',
                    category: 'Maintenance',
                    price: 999,
                    duration: '4h',
                    status: 'Active',
                    description: 'High-performance cooling solution.'
                }
            ];
        }

        return data as ServiceItem[];
    } catch (error) {
        console.warn("Service fetch error. Returning mock data.", error);
        return [
            {
                id: 'mock-1',
                name: 'HDMI Port Replacement (Mock)',
                category: 'Repair',
                price: 2499,
                duration: '24h',
                status: 'Active',
                description: 'Fixing broken or loose HDMI ports.'
            },
            {
                id: 'mock-2',
                name: 'Thermal Paste Re-application (Mock)',
                category: 'Maintenance',
                price: 999,
                duration: '4h',
                status: 'Active',
                description: 'High-performance cooling solution.'
            }
        ];
    }
};

export const createService = async (data: Partial<ServiceItem>) => {
    const supabase = createClient();
    const { error } = await supabase.from('repair_services').insert(data);
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
};

export const updateService = async (id: string, data: Partial<ServiceItem>) => {
    const supabase = createClient();
    const { error } = await supabase.from('repair_services').update(data).eq('id', id);
    if (error) throw new Error(`Supabase update failed: ${error.message}`);
};

export const deleteService = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('repair_services').delete().eq('id', id);
    if (error) throw new Error(`Supabase delete failed: ${error.message}`);
};
