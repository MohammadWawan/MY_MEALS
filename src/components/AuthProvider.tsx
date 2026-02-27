"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUser } from "@/app/actions";

export type Role = "customer" | "doctor" | "catering" | "waiter" | "cashier" | "admin" | null;

interface User {
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

  // Restore user from storage on initial load
  useEffect(() => {
    setMounted(true);
    const storedAuthStr = localStorage.getItem("medpos_auth") || sessionStorage.getItem("medpos_auth");
    let initialUser: User | null = null;
    let authExpiry: number = 0;
    if (storedAuthStr) {
      try {
        const data = JSON.parse(storedAuthStr);
        if (new Date().getTime() < data.expiry) {
           setUser(data.user);
           initialUser = data.user;
           authExpiry = data.expiry;
        } else {
           localStorage.removeItem("medpos_auth");
           sessionStorage.removeItem("medpos_auth");
        }
      } catch (e) {}
    }

    // Role realtime update poll
    let interval: any;
    const startPolling = (u: User) => {
       interval = setInterval(async () => {
          try {
             const freshUser = await getUser(u.id);
             setUser(prevUser => {
                if (prevUser && freshUser && freshUser.role !== prevUser.role) {
                   const updatedUser = { ...prevUser, role: freshUser.role as Role };
                   const isLocal = !!localStorage.getItem("medpos_auth");
                   const authData = JSON.stringify({ user: updatedUser, expiry: authExpiry });
                   if (isLocal) localStorage.setItem("medpos_auth", authData);
                   else sessionStorage.setItem("medpos_auth", authData);
                   return updatedUser;
                }
                return prevUser;
             });
          } catch (e) {}
       }, 5000);
    };

    if (initialUser) {
       startPolling(initialUser);
       return () => clearInterval(interval);
    }
  }, []);

  const login = (newUser: User, rememberMe: boolean = false) => {
    setUser(newUser);
    const expiry = new Date().getTime() + (3 * 60 * 60 * 1000); // 3 hours
    const authData = JSON.stringify({ user: newUser, expiry });
    
    if (rememberMe) {
       localStorage.setItem("medpos_auth", authData);
    } else {
       sessionStorage.setItem("medpos_auth", authData);
    }
  };

  const logout = () => {
    setUser(null);
    setCart([]);
    localStorage.removeItem("medpos_auth");
    sessionStorage.removeItem("medpos_auth");
  };

  const updateUser = (data: Partial<User>) => {
    if (user) setUser({ ...user, ...data });
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
