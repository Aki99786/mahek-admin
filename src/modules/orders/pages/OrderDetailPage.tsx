import { ArrowLeft, Mail, Phone, MapPin, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { getOrderById } from "@/http/Services/all";

interface OrderItem {
  _id: string;
  product?: {
    name?: string;
  };
  quantity?: number;
  price?: number;
}

interface OrderDetailApi {
  _id: string;
  user?: {
    email?: string;
    name?: string;
  };
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
  };
  items?: OrderItem[];
  totalAmount?: number;
}

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading, isError } = useQuery<OrderDetailApi>({
    queryKey: ["order-detail", id],
    queryFn: async () => {
      const res = await getOrderById(id!);
      return (
        (res as { data?: { order?: OrderDetailApi } }).data?.order ??
        (res as { data?: OrderDetailApi }).data ??
        (res as unknown as OrderDetailApi)
      );
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });

  const items = order?.items ?? [];
  const totalAmount = Number(order?.totalAmount ?? 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-sm text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <p className="text-sm text-red-600">Failed to load order details.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/orders"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Orders</span>
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order._id}
            </h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Items
              </h2>

              <div className="space-y-4">
                {items.map((item) => {
                  const quantity = Number(item.quantity ?? 0);
                  const price = Number(item.price ?? 0);
                  const itemTotal = quantity * price;
                  return (
                  <Card key={item._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.product?.name || "Unnamed Product"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Quantity: {quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₹{itemTotal.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Customer Info, Address, Invoice */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Customer Information
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="font-medium text-gray-900">
                    {order.shippingAddress?.fullName || "N/A"}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href={`mailto:${order.user?.email || ""}`}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    {order.user?.email || "N/A"}
                  </a>
                </div>

                {/* Phone */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {order.shippingAddress?.phone || "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Delivery Address
              </h3>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {order.shippingAddress?.addressLine1 || "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice */}
          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-1">Invoice</h3>
              <p className="text-sm text-purple-100 mb-6">
                Order #{order._id}
              </p>

              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Subtotal</span>
                  <span className="font-semibold">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Shipping</span>
                  <span className="font-semibold">-</span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-400">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
