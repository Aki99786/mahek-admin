import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore, type CartLine } from "@/features/cart/store/useCartStore";

interface CartLineItemProps {
  item: CartLine;
}

export function CartLineItem({ item }: CartLineItemProps) {
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="h-28 w-24 shrink-0 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center px-1">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover rounded-md"
          />
        ) : (
          "Image"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{item.brand}</p>
        <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
        <p className="text-sm text-gray-600 mt-1">Size: {item.size}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900">
            ₹{item.price.toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-gray-400 line-through">
            ₹{item.mrp.toLocaleString("en-IN")}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-gray-500 uppercase tracking-wide">
            Qty
          </span>
          <div className="flex items-center border border-gray-300 rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-none"
              onClick={() => setQuantity(item.id, item.quantity + 1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
