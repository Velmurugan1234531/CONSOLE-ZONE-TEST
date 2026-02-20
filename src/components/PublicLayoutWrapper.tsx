"use client";

import { usePathname } from "next/navigation";
import React from "react";

/**
 * A wrapper component that hides its children if the current route is an admin route.
 * This is used to hide public Navbar, Footer, etc. from the Admin panel.
 */
export function PublicLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith("/admin");

    if (isAdmin) return null;

    return <>{children}</>;
}
