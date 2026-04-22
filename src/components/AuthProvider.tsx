"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { getUser } from "@/app/actions";

export type Role = "customer" | "doctor" | "catering" | "waiter" | "cashier" | "admin" | null;

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  image?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number, itemIfNew?: CartItem) => void;
  clearCart: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Restore user from storage on initial load
  useEffect(() => {
    setMounted(true);
    const storedAuthStr = localStorage.getItem("medpos_auth") || sessionStorage.getItem("medpos_auth");
    if (storedAuthStr) {
      try {
        const data = JSON.parse(storedAuthStr);
        if (new Date().getTime() < data.expiry) {
           setUser(data.user);
        } else {
           localStorage.removeItem("medpos_auth");
           sessionStorage.removeItem("medpos_auth");
        }
      } catch (e) {}
    }
  }, []);

  // Sync user data / Polling whenever user state exists
  useEffect(() => {
    if (!user) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    const syncUser = async () => {
      try {
        const freshUser = await getUser(user.id);
        if (freshUser) {
          const newRole = freshUser.role as Role;
          const newImage = freshUser.image || undefined;
          const newName = freshUser.name;

          const hasChanges = 
            newRole !== user.role || 
            newImage !== user.image || 
            newName !== user.name;

          if (hasChanges) {
            const updatedUser: User = { 
              ...user, 
              role: newRole,
              image: newImage,
              name: newName
            };
            
            setUser(updatedUser);

            const isLocal = !!localStorage.getItem("medpos_auth");
            const storedStr = localStorage.getItem("medpos_auth") || sessionStorage.getItem("medpos_auth");
            if (storedStr) {
              const parsed = JSON.parse(storedStr);
              parsed.user = updatedUser;
              const authData = JSON.stringify(parsed);
              if (isLocal) localStorage.setItem("medpos_auth", authData);
              else sessionStorage.setItem("medpos_auth", authData);
            }
          }
        }
      } catch (e) {
        console.error("Sync user error:", e);
      }
    };

    // Initial sync
    syncUser();

    // Setup polling every 30 seconds (not 5s to avoid heavy load, but enough for auto-load feeling)
    pollingIntervalRef.current = setInterval(syncUser, 30000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user, user?.id]); // Only recreate if user ID changes (login/logout/switch)

  const login = (newUser: User, rememberMe: boolean = false) => {
    setUser(newUser);
    // Use 1 hour for session, or 30 days for remember me
    const expiryDelay = rememberMe ? (30 * 24 * 60 * 60 * 1000) : (60 * 60 * 1000);
    const expiry = new Date().getTime() + expiryDelay;
    const authData = JSON.stringify({ user: newUser, expiry });
    
    localStorage.setItem("medpos_auth", authData);

  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem("medpos_auth");
    sessionStorage.removeItem("medpos_auth");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
       const newUserState = { ...user, ...data };
       setUser(newUserState);
       // Sync to storage
        const storedStr = localStorage.getItem("medpos_auth");
        if (storedStr) {
           try {
              const parsed = JSON.parse(storedStr);
              parsed.user = newUserState;
              const authData = JSON.stringify(parsed);
              localStorage.setItem("medpos_auth", authData);
           } catch(e) {}
        }

    }
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQty = (id: string, delta: number, itemIfNew?: CartItem) => {
    setCart((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) {
        if (delta > 0 && itemIfNew) {
          return [...prev, { ...itemIfNew, qty: delta }];
        }
        return prev;
      }
      const newQty = item.qty + delta;
      if (newQty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty: newQty } : i));
    });
  };

  const clearCart = () => setCart([]);

  // Inactivity auto-logout logic (1 Hour)
  useEffect(() => {
    if (!user) return;

    let timeout: NodeJS.Timeout;
    
    const resetInactivityTimer = () => {
      clearTimeout(timeout);
      // 10 minutes = 600000 ms
      timeout = setTimeout(() => {
        logout();
        window.location.href = "/auth/login";
      }, 600000); 
    };

    let lastExecution = 0;
    const handleActivity = () => {
      const now = Date.now();
      // Throttle event listener to run at most once per second
      if (now - lastExecution > 1000) {
        lastExecution = now;
        resetInactivityTimer();
        
        // Update session expiry in storage to keep it fresh
        const storedStr = localStorage.getItem("medpos_auth") || sessionStorage.getItem("medpos_auth");
        if (storedStr) {
           try {
              const parsed = JSON.parse(storedStr);
              // Extend the expiry
              const isLocal = !!localStorage.getItem("medpos_auth");
              const extension = isLocal ? (30 * 24 * 60 * 60 * 1000) : (60 * 60 * 1000);
              parsed.expiry = new Date().getTime() + extension;
              const authData = JSON.stringify(parsed);
              if (isLocal) localStorage.setItem("medpos_auth", authData);
              else sessionStorage.setItem("medpos_auth", authData);
           } catch(e) {}
        }
      }
    };

    // Initialize the timer
    resetInactivityTimer();

    // List of events indicating user activity
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => window.addEventListener(event, handleActivity));

    return () => {
      clearTimeout(timeout);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
