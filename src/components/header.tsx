"use client";
import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();

  const path = pathname?.split("/").filter(Boolean).pop() || "Dashboard";

  return (
    <header className="flex gap-3 items-center">
      <SidebarTrigger />
      <h1 className="text-3xl font-extrabold font-sans capitalize">{path}</h1>
    </header>
  );
};

export default Header;
