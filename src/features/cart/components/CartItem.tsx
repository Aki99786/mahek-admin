import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  selectCartTotals,
  useCartStore,
} from "@/features/cart/store/useCartStore";

/**
 * Order summary + primary checkout CTA (Myntra-style PRICE DETAILS panel).
 * "Proceed to Checkout" navigates to the delivery address step.
 */
export function CartItem() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const { subtotal, mrpTotal, discount, convenienceFee, total, count } =
    selectCartTotals(items);

  const handleProceedToCheckout = () => {
    navigate("/checkout/address");
  };

  if (count === 0) {
    return (
      <Card className="border-gray-200 shadow-sm sticky top-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold tracking-wide text-gray-800">
            PRICE DETAILS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Your bag is empty.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-200 shadow-sm sticky top-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold tracking-wide text-gray-800">
          PRICE DETAILS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between text-gray-700">
          <span>Bag MRP ({count} items)</span>
          <span>₹{mrpTotal.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Bag discount</span>
          <span>− ₹{discount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Bag total</span>
          <span className="font-medium">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-gray-700">
          <span>Convenience Fee</span>
          <span>₹{convenienceFee.toLocaleString("en-IN")}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-bold text-gray-900">
          <span>Total Amount</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <Button
          type="button"
          className="w-full mt-4 h-12 text-base font-semibold bg-[#ff3f6c] hover:bg-[#e63661] text-white rounded-sm"
          onClick={handleProceedToCheckout}
        >
          Proceed to Checkout
        </Button>
      </CardContent>
    </Card>
  );
}
