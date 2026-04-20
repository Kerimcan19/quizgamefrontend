import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

type User = {
  id: string;
  email: string;
  username: string;
  credits: number;
};

type Store = {
  user: User | null;
  token: string | null;
  setToken: (token: string, userData?: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  loadFromStorage: () => void;
};

export const useUserStore = create<Store>((set) => ({
  user: null,
  token: null,

  setToken: (token: string, userData?: User) => {
    set({
      token,
      user: userData || null,
    });

    localStorage.setItem("token", token);
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  },

  setUser: (user: User) => {
    set({ user });
    localStorage.setItem("user", JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user });
      } catch (e) {
        console.error("Failed to load user from storage");
        set({ token, user: null });
      }
    }
  },
}));