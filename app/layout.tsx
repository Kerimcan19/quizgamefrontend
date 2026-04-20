"use client";
import { useEffect } from "react";
import { useUserStore } from "../store/useUserStore";

export default function RootLayout({ children }: any) {
  const loadFromStorage = useUserStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}