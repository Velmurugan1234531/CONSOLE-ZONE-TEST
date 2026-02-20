/**
 * Neural Transmission Templates
 * Wraps raw system data in tactical Sci-Fi terminology
 */

export const Transmissions = {
    RENTAL: {
        BOOKED: (assetName: string, id: string) => ({
            title: "Uplink Established",
            message: `Transmission Received. Tactical Asset [${assetName}] (ID: ${id.slice(0, 8)}) confirmed for deployment.`
        }),
        SHIPPED: (assetName: string) => ({
            title: "Asset in Transit",
            message: `Tactical Asset [${assetName}] has left the hub. Tracking satellite synced. Interception imminent.`
        }),
        EXPIRY_WARNING: (assetName: string) => ({
            title: "Recall Warning",
            message: `Operational window for [${assetName}] closing in 24 hours. Prepare for extraction.`
        }),
        RECOVERED: (assetName: string) => ({
            title: "Extraction Complete",
            message: `Asset [${assetName}] successfully recovered. Integrity check in progress.`
        })
    },
    KYC: {
        PENDING: () => ({
            title: "Sync Pending",
            message: "Biometric and credential data uploaded. Neural sync in progress. Awaiting Admin authorization."
        }),
        VERIFIED: () => ({
            title: "Identity Verified",
            message: "Identity Verified. All premium sectors and high-tier hardware now accessible. Welcome to the Elite Fleet."
        }),
        FAILURE: (reason: string) => ({
            title: "Uplink Failure",
            message: `Credential data corrupt or invalid. Sector rejection reason: ${reason}. Re-transmit immediately.`
        })
    },
    SECURITY: {
        BREACH: (location: string) => ({
            title: "UNAUTHORIZED ACCESS",
            message: `BREACH DETECTED at Sector [${location}]. Primary shield integrity at 99%. Verify credentials.`
        })
    },
    SYNC: {
        XP_GAINED: (amount: number, total: number) => ({
            title: "Neural Alignment Increased",
            message: `Sync Gained: +${amount} XP. Current Neural Integrity: ${total} XP. Keep the uplink stable.`
        }),
        TIER_UP: (tierName: string) => ({
            title: "NEURAL EVOLUTION DETECTED",
            message: `Clearance Escalated to [${tierName}] status. New tactical perks initialized.`
        })
    }
};
