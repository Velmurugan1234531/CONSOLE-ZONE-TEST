type SubscriptionCallback = (payload: any) => void;

class RealtimeSync {
    private subs: Map<string, SubscriptionCallback[]> = new Map();

    /**
     * Subscribe to a specific channel (e.g. 'booking-updates')
     */
    subscribe(channel: string, callback: SubscriptionCallback) {
        if (!this.subs.has(channel)) this.subs.set(channel, []);
        this.subs.get(channel)?.push(callback);
        console.log(`[SYNC] Subscribed to ${channel}`);
    }

    /**
     * Unsubscribe from a channel
     */
    unsubscribe(channel: string, callback: SubscriptionCallback) {
        const callbacks = this.subs.get(channel);
        if (callbacks) {
            this.subs.set(channel, callbacks.filter(c => c !== callback));
        }
    }

    /**
     * Broadcast an event to all subscribers
     */
    broadcast(channel: string, payload: any) {
        console.log(`[SYNC] BROADCAST on ${channel}:`, payload);
        this.subs.get(channel)?.forEach(cb => cb(payload));
    }

    /**
     * Specialized: Trigger Badge Update
     */
    triggerBadgeUpdate(type: 'booking' | 'payment' | 'delivery') {
        this.broadcast(`badge-${type}`, { timestamp: Date.now(), alert: true });
    }
}

export const NeuralSync = new RealtimeSync();
