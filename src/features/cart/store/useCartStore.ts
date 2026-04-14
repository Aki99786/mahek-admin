import { create } from "zustand";

export interface CartLine {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  mrp: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartLine[];
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
}

const seedItems: CartLine[] = [
  {
    id: "1",
    name: "Floral Print Saree",
    brand: "Mahek",
    size: "Onesize",
    price: 1299,
    mrp: 2499,
    quantity: 1,
  },
  {
    id: "2",
    name: "Bridal Lehenga Set",
    brand: "Mahek",
    size: "M",
    price: 8999,
    mrp: 12999,
    quantity: 1,
  },
];

export const useCartStore = create<CartState>((set) => ({
  items: seedItems,
  setQuantity: (id, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
      ),
    })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
    })),
}));

export function selectCartTotals(items: CartLine[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const mrpTotal = items.reduce((s, i) => s + i.mrp * i.quantity, 0);
  const discount = mrpTotal - subtotal;
  const convenienceFee = subtotal > 0 ? 99 : 0;
  const total = subtotal + convenienceFee;
  return { subtotal, mrpTotal, discount, convenienceFee, total, count: items.length };
}
