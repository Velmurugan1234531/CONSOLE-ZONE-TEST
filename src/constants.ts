export const PLANS = {
    DAILY: {
        id: 'daily',
        label: 'Daily Access',
        description: 'Flexible 24-hour rental',
        duration: 1,
        price: 499, // Competitive Daily Rate
        type: 'DAILY'
    },
    WEEKEND: {
        id: 'weekend',
        label: 'Weekend Warrior',
        description: 'Fri-Sun Marathon',
        duration: 3,
        price: 1299, // Competitive Weekend Rate
        type: 'DAILY'
    },
    WEEKLY: {
        id: 'weekly',
        label: 'Weekly Power',
        description: '7 Days of Gaming',
        duration: 7,
        price: 2499, // Competitive Weekly Rate
        type: 'WEEKLY'
    },
    MONTHLY: {
        id: 'monthly',
        label: 'Monthly Marathon',
        description: '30 Days of Bliss',
        duration: 30,
        price: 5499, // Competitive Monthly Rate
        type: 'MONTHLY'
    }
};

// Extra Controller Pricing: Console-specific and Plan-specific TOTAL prices
export const EXTRA_CONTROLLER_PRICING = {
    ps4: {
        DAILY: 99,      // ₹99 total for Day plan
        WEEKEND: 99,    // ₹99 total per controller (same as daily)
        WEEKLY: 399,    // ₹399 total for Week plan
        MONTHLY: 999    // ₹999 total for Month plan
    },
    ps5: {
        DAILY: 199,     // ₹199 total for Day plan
        WEEKEND: 199,   // ₹199 total per controller
        WEEKLY: 799,    // ₹799 total for Week plan
        MONTHLY: 1499   // ₹1,499 total for Month plan
    },
    // Default pricing for other consoles (using PS4 rates)
    default: {
        DAILY: 99,
        WEEKEND: 99,
        WEEKLY: 399,
        MONTHLY: 999
    }
};

export const ADDONS = [
    { id: 'controller', label: 'Extra DualSense™ (beyond included)', price: 299 },
    { id: 'game_pass', label: 'Instant Game Library', price: 399 },
    { id: 'headset', label: 'Pro Surround Headset', price: 199 },
];

export const CONSOLE_RATES = {
    ps5: {
        DAILY: 600,
        WEEKEND: 1500,
        WEEKLY: 3000,
        MONTHLY: 6000
    },
    ps4: {
        DAILY: 300,
        WEEKEND: 800,
        WEEKLY: 1500,
        MONTHLY: 3000
    },
    xbox: {
        DAILY: 500,
        WEEKEND: 1300,
        WEEKLY: 2500,
        MONTHLY: 5000
    },
    switch: {
        DAILY: 400,
        WEEKEND: 1000,
        WEEKLY: 2000,
        MONTHLY: 4000
    },
    pc: {
        DAILY: 1000,
        WEEKEND: 2500,
        WEEKLY: 5000,
        MONTHLY: 10000
    }
};
