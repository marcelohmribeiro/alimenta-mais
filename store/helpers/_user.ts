import { create } from "zustand";

type UserStore = {
  isDoador: boolean;
  setIsDoador: (v: boolean) => void;
  reset: () => void;
};

const useUser = create<UserStore>((set) => ({
  isDoador: false,
  setIsDoador: (isDoador) => set({ isDoador }),
  reset: () => set({ isDoador: false }),
}));

export { useUser };
