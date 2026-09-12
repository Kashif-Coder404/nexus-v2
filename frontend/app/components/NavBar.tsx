"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSideBar } from "../store/useSideBar";
import { useUserCredentials } from "../store/useUserCredentials";
import { Download } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

export default function NavBar() {
  const pathname = usePathname();
  const user = useUserCredentials((state) => state.user);
  const { toggleSidebar, isSidebarOpen } = useSideBar();
  const isDashboard = user ? "/dashboard" : "/auth/login";
  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "Dashboard", href: isDashboard },
    { label: "Chat", href: "/chat" },
  ];
  const handleDownloadNexus = () => {
    // window.location.href =
    //   "https://github.com/Kashif-Coder404/nexus-v2/releases/download/v2.2.0/nexus.exe";
    window.open(
      "https://github.com/Kashif-Coder404/nexus-v2/releases/latest",
      "_blank",
    );
  };
  return (
    <header className={style.navCont}>
      <div className={style.innerCont}>
        <div className={style.leftLinks}>
          <div
            className={`${style.imageCont} group relative flex items-center justify-center w-10 h-10 cursor-pointer`}
            onClick={() => toggleSidebar(isSidebarOpen)}
          >
            {pathname === "/" || pathname === "/auth/login" ? (
              <>
                <img
                  src="https://i.ibb.co/NgXjccp7/Neon-Purple-Orbital-N-Emblem.png"
                  alt="NexusIcon"
                  className={`${style.logoImageNav}`}
                />
              </>
            ) : (
              <p className="text-white text-2xl hover:scale-110 flex justify-center items-center">
                ☰
              </p>
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
        {user ? (
          <>
            <div className={style.leftCont}>
              <button
                onClick={handleDownloadNexus}
                className="flex justify-center items-center gap-2 transition-all duration-300 hover:text-purple-500 cursor-pointer"
              >
                <Download />
                <h1>Latest v2.5.0</h1>
              </button>
              <h1 className="rounded-full bg-purple-800 w-4 h-4 text-center text-white flex justify-center items-center p-4">
                {user?.name.slice(0, 1).toUpperCase()}
              </h1>
            </div>
          </>
        ) : (
          <div className={style.actionsCont}>
            <Link href="/auth/login" className={style.loginBtn}>
              Log in
            </Link>
            <Link href="/auth/signup" className={style.defaultBtn}>
              SignUp
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

const style = {
  navCont: "sticky top-0 z-30 w-full border-b border-b-purple-500/40",
  innerCont:
    "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8",
  leftLinks: "flex flex-row gap-2 px-2",
  imageCont: "max-w-30 max-h-30",
  logoImageNav: "w-10 h-10",
  brandCont: "flex items-center gap-2",
  brandText:
    "text-xl md:text-3xl font-bold tracking-tight text-white underline-offset-2",
  brandDot: "text-shadow-green-700",
  navLinks: "hidden md:flex items-center gap-6",
  navLinkItem:
    "text-sm font-medium transition-all duration-300 hover:bg-purple-900 px-2 py-1 rounded-full text-white/50 hover:text-white",
  actionsCont: "flex items-center gap-3",
  leftCont: "flex justify-center items-center text-white gap-4",
  loginBtn:
    "rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition",
  defaultBtn:
    "flex flex-col justify-center rounded-xl m-2 px-[clamp(0.8rem,2vw,1rem)] text-white text-[1.2rem] font-bold bg-linear-to-r from-[#7357E2] to-[#9129b6] text-nowrap transform hover:scale-[1.1] duration-300",
};
