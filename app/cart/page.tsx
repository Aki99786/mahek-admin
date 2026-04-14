import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { CartLineItem } from "@/features/cart/components/CartLineItem";
import { CartItem } from "@/features/cart/components/CartItem";
import { useCartStore } from "@/features/cart/store/useCartStore";

/**
 * Cart page (App Router–style path `app/cart/page.tsx`).
 * Wired in `src/router.tsx` as route `/cart`.
 */
export default function CartPage() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa]">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-gray-800">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-800 font-medium">Bag</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-8">
          MY BAG <span className="text-gray-500 font-normal">({items.length})</span>
        </h1>

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">Your shopping bag is empty.</p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center h-10 px-6 text-sm font-semibold text-white bg-[#ff3f6c] hover:bg-[#e63661] rounded-sm"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartLineItem key={item.id} item={item} />
              ))}
            </div>
            <div className="lg:col-span-1">
              <CartItem />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
