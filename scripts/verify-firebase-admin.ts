
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local FIRST
config({ path: resolve(process.cwd(), '.env.local') });

async function verifyAdminService() {
    console.log("🔥 Starting Admin Service Verification...");

    try {
        // Dynamic imports to ensure env vars are loaded first
        const { db } = await import('../src/lib/firebase');
        const {
            getAllDevices,
            createDevice,
            updateDevice,
            deleteDevice
        } = await import('../src/services/admin');
        const { doc, getDoc } = await import('firebase/firestore');

        // 1. List existing devices
        console.log("1. Fetching existing devices...");
        const devices = await getAllDevices();
        console.log(`   Found ${devices.length} devices.`);

        // 2. Create a test device
        console.log("2. Creating a test device...");
        const testDeviceData = {
            serialNumber: `TEST-DEV-${Date.now()}`,
            category: 'PS5',
            status: 'Ready',
            storage_gb: 825,
            controllers: 2,
            notes: 'Verification Script Test Device'
        };

        const newDevice = await createDevice(testDeviceData);
        if (!newDevice || !newDevice.id) throw new Error("Failed to create device");
        console.log(`   Created device with ID: ${newDevice.id}`);

        // 3. Verify creation
        const verifySnap = await getDoc(doc(db, "devices", newDevice.id));
        if (!verifySnap.exists()) throw new Error("Created device not found in Firestore");
        console.log("   Device verified in Firestore.");

        // 4. Update device
        console.log("3. Updating device status...");
        await updateDevice(newDevice.id, { status: 'Maintenance', notes: 'Updated by script' });

        const updatedSnap = await getDoc(doc(db, "devices", newDevice.id));
        const updatedData = updatedSnap.data();
        if (updatedData?.status !== 'Maintenance') throw new Error("Update failed");
        console.log("   Device updated successfully.");

        // 5. Delete device
        console.log("4. Deleting test device...");
        await deleteDevice(newDevice.id);

        const deletedSnap = await getDoc(doc(db, "devices", newDevice.id));
        if (deletedSnap.exists()) throw new Error("Delete failed - device still exists");
        console.log("   Device deleted successfully.");

        console.log("✅ Verification Complete: Admin Service is fully functional with Firestore.");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    }
}

verifyAdminService();
