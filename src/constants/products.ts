
import { CONSOLE_IMAGES } from "@/constants/images";

export const PRODUCTS: any = {
    "ps5": {
        name: "Sony PlayStation 5",
        price: 699,
        weeklyPrice: 4499,
        monthlyPrice: 9999,
        image: CONSOLE_IMAGES.ps5.hero,
        thumbs: [
            CONSOLE_IMAGES.ps5.hero,
            CONSOLE_IMAGES.ps5.controller,
            CONSOLE_IMAGES.ps5.preview,
            "https://images.unsplash.com/photo-1621259182902-3815b89a96e2?q=80&w=1200", // Setup
            "https://images.unsplash.com/photo-1592840496694-26d035b5a696?q=80&w=1200"  // Lifestyle
        ],
        features: [
            "4K 120Hz Gaming",
            "Hardware Ray Tracing",
            "Ultra-High Speed SSD",
            "Haptic Feedback Support",
            "Tempest 3D AudioTech",
            "Includes 1 Controller"
        ],
        description: "Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with support for haptic feedback, adaptive triggers, and 3D Audio, and an all-new generation of incredible PlayStation® games."
    },
    "ps4": {
        name: "Sony PlayStation 4",
        price: 399,
        weeklyPrice: 2499,
        monthlyPrice: 4999,
        image: CONSOLE_IMAGES.ps4.hero,
        thumbs: [
            CONSOLE_IMAGES.ps4.hero,
            CONSOLE_IMAGES.ps4.controller,
            CONSOLE_IMAGES.ps4.preview,
            "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200", // Retro vibes
            "https://images.unsplash.com/photo-1580237072617-771c3ecc4a24?q=80&w=1200"  // Details
        ],
        features: [
            "HDR Technology",
            "Massive Game Library",
            "Share Play & Remote Play",
            "Blu-ray™ Disc Player",
            "Stable 1080p Gaming",
            "Includes 1 Controller"
        ],
        description: "The classic PlayStation 4 console. Perfect for casual gaming and accessing a massive library of hit titles like God of War, Spider-Man, and The Last of Us Part II."
    },
    "xbox": {
        name: "Xbox Series X",
        price: 599,
        weeklyPrice: 3999,
        monthlyPrice: 7999,
        image: CONSOLE_IMAGES.xbox.hero,
        thumbs: [
            CONSOLE_IMAGES.xbox.hero,
            CONSOLE_IMAGES.xbox.preview,
            "https://images.unsplash.com/photo-1621259182902-3815b89a96e2?q=80&w=1200",
            "https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1200"
        ],
        features: [
            "Xbox Velocity Architecture",
            "Quick Resume",
            "12 TFLOPS Processing Power",
            "Game Pass Ultimate Ready",
            "True 4K Gaming",
            "Includes 1 Controller"
        ],
        description: "The fastest, most powerful Xbox ever. Play thousands of titles from four generations of consoles-all games look and play best on Xbox Series X."
    },
    // Fallback for others
    "default": {
        name: "Gaming Console",
        price: 499,
        image: CONSOLE_IMAGES.default.hero,
        thumbs: [
            CONSOLE_IMAGES.default.hero,
            CONSOLE_IMAGES.default.preview
        ],
        features: ["All Cables", "PlayStation Plus", "EA Sports", "1 Controller"],
        description: "Standard gaming console rental."
    }
};
