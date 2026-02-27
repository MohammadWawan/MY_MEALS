"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "next-themes";
import { ShoppingCart, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navigation() {
  const { user, logout, cart } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname.startsWith('/auth')) return null;

  const isAdmin = user?.role === 'admin';
  const totalCartQty = cart.reduce((acc, item) => acc + item.qty, 0);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string, color: string = 'indigo') => `
    relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
    ${isActive(path) 
      ? `text-${color}-600 dark:text-${color}-400 bg-${color}-50/80 dark:bg-${color}-900/30 shadow-sm` 
      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'}
  `;

  const mobileLinkClass = (path: string, color: string = 'indigo') => `
    block px-4 py-3 rounded-xl text-sm font-bold transition-all
    ${isActive(path)
      ? `bg-${color}-50 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400`
      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
  `;

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 group-hover:scale-105 transition-transform">
                <img 
                  src="/assets/logo.svg" 
                  alt="Hermina Logo" 
                  className="w-7 h-7"
                />
              </div>
              <span className="text-emerald-700 dark:text-emerald-500 font-black text-xl tracking-tighter leading-none">
                HERMINA <br/><span className="text-[9px] tracking-[0.2em] text-emerald-600/60 dark:text-emerald-400/60">PASURUAN</span>
              </span>
            </Link>
            
            {user && (
              <div className="hidden lg:flex ml-10 items-center gap-1">
                {(isAdmin || user.role === 'customer' || user.role === 'doctor') && (
                  <>
                    <Link href="/order" className={linkClass('/order')}>Order Menu</Link>
                    <Link href="/tracking" className={linkClass('/tracking')}>My Orders</Link>
                  </>
                )}
                {(isAdmin || user.role === 'customer') && (
                  <Link href="/payment" className={linkClass('/payment')}>Payments</Link>
                )}
                {(isAdmin || user.role === 'catering') && (
                  <Link href="/catering" className={linkClass('/catering')}>Kitchen Hub</Link>
                )}
                {(isAdmin || user.role === 'waiter') && (
                  <Link href="/server" className={linkClass('/server')}>Server Dash</Link>
                )}
                {(isAdmin || user.role === 'cashier') && (
                  <Link href="/cashier" className={linkClass('/cashier')}>Validations</Link>
                )}
                {(isAdmin || user.role === 'catering' || user.role === 'cashier' || user.role === 'waiter') && (
                  <Link href="/reports" className={linkClass('/reports')}>Reports</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link href="/admin/menu" className={linkClass('/admin/menu', 'emerald')}>Manage Menus</Link>
                    <Link href="/admin/doctors" className={linkClass('/admin/doctors', 'indigo')}>Add Doctor</Link>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
             {mounted && (
               <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors">
                 {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
               </button>
             )}

             {user ? (
               <div className="flex items-center gap-4">
                  {(user.role === 'customer' || user.role === 'doctor') && (
                    <div className="relative cursor-pointer opacity-75 hover:opacity-100" onClick={() => router.push('/payment')}>
                       <ShoppingCart className="w-6 h-6 text-zinc-800 dark:text-zinc-200" />
                       {totalCartQty > 0 && (
                          <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">{totalCartQty}</span>
                       )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 border-l pl-4 border-zinc-200 dark:border-zinc-800">
                     <Link href="/profile" className="flex items-center gap-3 group">
                        {user.image ? (
                           <img src={user.image} className="w-9 h-9 rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm transition-transform group-hover:scale-110" alt="Profile avatar" />
                        ) : (
                           <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-400 font-black shadow-sm transition-transform group-hover:scale-110">
                               {user.name.charAt(0).toUpperCase()}
                           </div>
                        )}
                        <div className="text-right hidden sm:block">
                           <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors leading-tight">
                              Hy, {user.name}
                           </p>
                           <p className="text-[9px] font-black text-indigo-500/60 dark:text-indigo-400/60 uppercase tracking-[0.2em]">{user.role}</p>
                        </div>
                     </Link>
                  </div>
                  <button onClick={handleLogout} className="hidden lg:block bg-red-50 hover:bg-red-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 text-red-600 dark:text-rose-400 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm">
                    Logout
                  </button>
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    className="lg:hidden p-2 ml-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-300"
                  >
                     {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                  </button>
               </div>
             ) : (
               <div className="flex gap-2">
                 <Link href="/auth/login" className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white px-3 py-2 text-sm font-bold transition-colors">Log in</Link>
                 <Link href="/auth/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-500/30">Sign up</Link>
               </div>
             )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && user && (
          <div className="lg:hidden py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 animate-in slide-in-from-top-5">
            <div className="flex flex-col space-y-2 px-2">
                {(isAdmin || user.role === 'customer' || user.role === 'doctor') && (
                  <>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/order" className={mobileLinkClass('/order')}>Order Menu</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/tracking" className={mobileLinkClass('/tracking')}>My Orders</Link>
                  </>
                )}
                {(isAdmin || user.role === 'customer') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/payment" className={mobileLinkClass('/payment')}>Payments</Link>
                )}
                {(isAdmin || user.role === 'catering') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/catering" className={mobileLinkClass('/catering')}>Kitchen Hub</Link>
                )}
                {(isAdmin || user.role === 'waiter') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/server" className={mobileLinkClass('/server')}>Server Dash</Link>
                )}
                {(isAdmin || user.role === 'cashier') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/cashier" className={mobileLinkClass('/cashier')}>Validations</Link>
                )}
                {(isAdmin || user.role === 'catering' || user.role === 'cashier' || user.role === 'waiter') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/reports" className={mobileLinkClass('/reports')}>Reports</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin/menu" className={mobileLinkClass('/admin/menu', 'emerald')}>Manage Menus</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin/doctors" className={mobileLinkClass('/admin/doctors')}>Add Doctor</Link>
                  </>
                )}
                
                <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
                <button 
                  onClick={() => {
                     setIsMobileMenuOpen(false);
                     handleLogout();
                  }} 
                  className="w-full text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 px-4 py-3 rounded-xl text-sm font-bold transition-all"
                >
                  Logout session
                </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
