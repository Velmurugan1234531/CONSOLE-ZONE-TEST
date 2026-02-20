
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDebug() {
    console.log("--- DEBUGGING DEVICES TABLE ---");

    // 1. Inspect existing row to see columns
    const { data: existing, error: fetchError } = await supabase
        .from('devices')
        .select('*')
        .limit(1);

    if (fetchError) {
        console.error("Fetch Error:", fetchError);
    } else if (existing && existing.length > 0) {
        console.log("Existing Row Keys:", Object.keys(existing[0]));
        console.log("Sample Row:", existing[0]);
    } else {
        console.log("No devices found to inspect columns.");
    }

    // 2. Try Standard Insert (Minimal)
    console.log("\n--- TEST: Minimal Insert ---");
    const serial1 = `TEST-MIN-${Date.now()}`;
    const { data: data1, error: error1 } = await supabase
        .from('devices')
        .insert({
            serial_number: serial1,
            status: 'AVAILABLE'
        })
        .select()
        .single();

    if (error1) {
        console.error("Minimal Insert Failed:", error1);
    } else {
        console.log("Minimal Insert Success:", data1);
        // Clean up
        await supabase.from('devices').delete().eq('id', data1.id);
    }

    // 3. Try Metadata Insert
    console.log("\n--- TEST: Metadata Insert ---");
    const serial2 = `TEST-META-${Date.now()}`;
    const { data: data2, error: error2 } = await supabase
        .from('devices')
        .insert({
            serial_number: serial2,
            status: 'AVAILABLE',
            metadata: { model: 'Test Model', foo: 'bar' }
        })
        .select()
        .single();

    if (error2) {
        console.error("Metadata Insert Failed:", error2);
        if (error2.code === '42703') { // Undefined column
            console.log(">> CONFIRMED: 'metadata' column does NOT exist.");
        }
    } else {
        console.log("Metadata Insert Success:", data2);
        // Clean up
        await supabase.from('devices').delete().eq('id', data2.id);
    }
}

runDebug().catch(console.error);
