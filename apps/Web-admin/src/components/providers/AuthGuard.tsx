"use client";

import { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
