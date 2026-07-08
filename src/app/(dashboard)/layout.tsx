import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="dashboard-layout h-screen flex overflow-hidden">
      <script dangerouslySetInnerHTML={{
        __html: `(function(){try{var t=localStorage.getItem("skillnest-theme"),d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme:dark)").matches);if(d)document.currentScript.parentElement.classList.add("dark")}catch(e){}})();`
      }} />
      {/* Sidebar */}
      <div className="sidebar-wrap w-auto p-4 bg-white dark:bg-[#1f2419] border-r border-gray-100 dark:border-white/10 flex flex-col overflow-y-auto">
        <Link href="/" className="w-full flex items-center justify-start -ml-1 mb-3 py-1">
          <Image src="/skillnest.png" alt="SkillNest Logo" width={180} height={90} className="w-full max-w-[175px] h-auto max-h-28 object-contain object-left" priority />
        </Link>
        <div className="overflow-y-auto flex-1 mt-2">
          <Menu />
        </div>
      </div>
      {/* Main */}
      <div className="main-wrap flex-1 min-w-0 bg-[#F7F8FA] dark:bg-[#171b12] overflow-y-auto flex flex-col">
        {/* Navbar wrapper */}
        <div className="navbar-wrap bg-white dark:bg-[#1f2419] border-b border-gray-100 dark:border-white/10">
          <Navbar />
        </div>
        {children}
      </div>
    </div>
  );
}
