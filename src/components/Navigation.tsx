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

  return (
    <nav className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors duration-300 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-10 h-10  rounded-lg flex items-center justify-center ">
              <img 
                src="/assets/logo.svg" 
                alt="Hospital Waiter Mascot" 
                
             />
              </div>
              <span className="text-emerald-700 dark:text-emerald-500 font-black text-xl tracking-tight leading-none">
                HERMINA <br/><span className="text-[10px] tracking-widest text-emerald-600/80 dark:text-emerald-400/80">PASURUAN</span>
              </span>
            </Link>
            
            {user && (
              <div className="hidden lg:flex ml-10 space-x-2">
                {(isAdmin || user.role === 'customer' || user.role === 'doctor') && (
                  <>
                    <Link href="/order" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Order Menu</Link>
                    <Link href="/tracking" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">My Orders</Link>
                  </>
                )}
                {(isAdmin || user.role === 'customer') && (
                  <Link href="/payment" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Payments</Link>
                )}
                {(isAdmin || user.role === 'catering') && (
                  <Link href="/catering" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Kitchen Hub</Link>
                )}
                {(isAdmin || user.role === 'waiter') && (
                  <Link href="/server" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Server Dash</Link>
                )}
                {(isAdmin || user.role === 'cashier') && (
                  <>
                    <Link href="/cashier" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Validations</Link>
                  </>
                )}
                {(isAdmin || user.role === 'catering' || user.role === 'cashier' || user.role === 'waiter') && (
                  <Link href="/reports" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-2 rounded-md text-sm font-semibold transition-all">Reports</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link href="/admin/menu" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-2 rounded-md text-sm font-bold transition-all">Manage Menus</Link>
                    <Link href="/admin/doctors" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-2 rounded-md text-sm font-bold transition-all">Add Doctor</Link>
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
                           <img src={user.image} className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-700 object-cover shadow-sm transition-transform group-hover:scale-110" alt="Profile avatar" />
                        ) : (
                           <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex flex-col items-center justify-center text-indigo-700 dark:text-indigo-400 font-black shadow-sm transition-transform group-hover:scale-110">
                              {user.name.charAt(0).toUpperCase()}
                           </div>
                        )}
                        <div className="text-right hidden sm:block">
                           <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 transition-colors">
                              Hy {user.name} - {user.role === 'customer' ? 'Customer' : user.role === 'doctor' ? 'Doctor' : user.role === 'admin' ? 'Admin' : 'Staff'}
                           </p>
                           <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-0.5">Edit Profile</p>
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
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/order" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Order Menu</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/tracking" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">My Orders</Link>
                  </>
                )}
                {(isAdmin || user.role === 'customer') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/payment" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Payments</Link>
                )}
                {(isAdmin || user.role === 'catering') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/catering" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Kitchen Hub</Link>
                )}
                {(isAdmin || user.role === 'waiter') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/server" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Server Dash</Link>
                )}
                {(isAdmin || user.role === 'cashier') && (
                  <>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/cashier" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Validations</Link>
                  </>
                )}
                {(isAdmin || user.role === 'catering' || user.role === 'cashier' || user.role === 'waiter') && (
                  <Link onClick={() => setIsMobileMenuOpen(false)} href="/reports" className="text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-3 rounded-md text-sm font-bold transition-all">Reports</Link>
                )}
                {user.role === 'admin' && (
                  <>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin/menu" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-3 py-3 rounded-md text-sm font-bold transition-all">Manage Menus</Link>
                    <Link onClick={() => setIsMobileMenuOpen(false)} href="/admin/doctors" className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-3 rounded-md text-sm font-bold transition-all">Add Doctor</Link>
                  </>
                )}
                
                <hr className="my-2 border-zinc-200 dark:border-zinc-800" />
                <button 
                  onClick={() => {
                     setIsMobileMenuOpen(false);
                     handleLogout();
                  }} 
                  className="w-full text-left text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-900/30 px-3 py-3 rounded-md text-sm font-bold transition-all"
                >
                  Logout
                </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
