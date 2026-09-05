"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "About", href: "/about" },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <header className={style.navCont}>
      <div className={style.innerCont}>
        <div className={style.leftLinks}>
          <div className={style.imageCont}>
            {pathname !== "/" ? (
              <p className="text-white w-full text-2xl mr-2">☰</p>
            ) : (
              <img
                src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
                alt="Neon-Purple-Orbital-N-Emblem"
                className={style.logoImageNav}
              />
            )}
          </div>
          <div className={style.brandCont}>
            <Link href="/" className={style.brandText}>
              Nexus<span className={style.brandDot}>.</span>
            </Link>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className={style.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={style.navLinkItem}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Action / Auth Buttons */}
        <div className={style.actionsCont}>
          <Link href="/auth/login" className={style.loginBtn}>
            Log in
          </Link>
          <Link href="/auth/signup" className={style.defaultBtn}>
            SignUp
          </Link>
        </div>
      </div>
    </header>
  );
}

const style = {
  navCont: "sticky top-0 z-50 w-full border-2 border-b-gray-500",
  innerCont:
    "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
  leftLinks: "flex flex-row gap-2 px-2",
  imageCont: "max-w-30 max-h-30",
  logoImageNav: "w-10 h-10",
  brandCont: "flex items-center gap-2",
  brandText: "text-xl md:text-3xl font-bold tracking-tight text-white",
  brandDot: "text-shadow-green-700",
  navLinks: "hidden md:flex items-center gap-6",
  navLinkItem:
    "text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white",
  actionsCont: "flex items-center gap-3",
  loginBtn:
    "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition",
  defaultBtn:
    "flex flex-col justify-center rounded-xl m-2 px-[clamp(0.8rem,2vw,1rem)] text-white text-[1.2rem] font-bold bg-linear-to-r from-[#7357E2] to-[#9129b6] text-nowrap transform hover:scale-[1.1] duration-300",
};
