// Centralized Image Assets
// Replacing placeholders with high-quality generated local assets

export const CONSOLE_IMAGES = {
    ps5: {
        hero: "/images/products/ps5.png",
        preview: "/images/products/ps5.png",
        controller: "/images/products/dualsense.png",
    },
    ps4: {
        hero: "/images/products/ps5.png", // Using PS5 as premium placeholder for PS4 as well
        preview: "/images/products/ps5.png",
        controller: "/images/products/dualsense.png",
    },
    xbox: {
        hero: "/images/products/xbox.png",
        preview: "/images/products/xbox.png",
        controller: "/images/products/xbox.png", // Using main console shot if controller shot is missing
    },
    default: {
        hero: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=85&w=3840",
        preview: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=85&w=3840"
    }
};
