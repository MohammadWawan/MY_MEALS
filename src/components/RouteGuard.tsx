"use client";

import { useAuth } from "./AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password'];
      if (!user && !publicPaths.includes(pathname)) {
        router.replace('/auth/login');
      }
    }
  }, [mounted, user, pathname, router]);

  if (!mounted) return null;

  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password'];
  if (!user && !publicPaths.includes(pathname)) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 font-bold p-6 text-center">
         <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
         <p>Redirecting to Authentication...</p>
       </div>
     );
  }

  return <>{children}</>;
}
