import React from "react";
import Link from "next/link";

interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

// Easily add or adjust items here
const menuItems: SidebarItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Chats", href: "/chat" },
  { label: "Settings", href: "/settings" },
];

export default function SideBar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Sidebar Header / Brand */}
      <div className="mb-6 px-3 py-2">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Workspace
        </h2>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200/70 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer / Profile Section */}
      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
            U
          </div>
          <div className="text-xs">
            <p className="font-medium text-zinc-900 dark:text-white">User Name</p>
            <p className="text-zinc-500 dark:text-zinc-400">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
