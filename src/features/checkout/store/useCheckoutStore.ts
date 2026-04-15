import { create } from "zustand";
import type { AddressFormValues } from "@/features/checkout/address/addressFormSchema";

interface CheckoutState {
  savedDeliveryAddress: AddressFormValues | null;
  setSavedDeliveryAddress: (address: AddressFormValues) => void;
  clearSavedDeliveryAddress: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  savedDeliveryAddress: null,
  setSavedDeliveryAddress: (address) => set({ savedDeliveryAddress: address }),
  clearSavedDeliveryAddress: () => set({ savedDeliveryAddress: null }),
}));
