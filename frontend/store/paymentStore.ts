import { create } from "zustand";

export interface PaymentCourse {
  subjectId: number;
  title: string;
  price: number;
}

export type PaymentStatus = "idle" | "processing" | "success" | "error";

interface PaymentState {
  isOpen: boolean;
  course: PaymentCourse | null;
  status: PaymentStatus;
  error: string | null;
  openModal: (course: PaymentCourse) => void;
  closeModal: () => void;
  setStatus: (status: PaymentStatus) => void;
  setError: (error: string | null) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  isOpen: false,
  course: null,
  status: "idle",
  error: null,
  openModal: (course) => set({ isOpen: true, course, status: "idle", error: null }),
  closeModal: () => set({ isOpen: false, course: null, status: "idle", error: null }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: "error" }),
}));
