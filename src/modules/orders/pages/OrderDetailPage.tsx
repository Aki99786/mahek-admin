import { ArrowLeft, Mail, Phone, MapPin, Package, Check, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOrderById, updateOrderStatus } from "@/http/Services/all";
import { showSuccess, showError } from "@/utility/utility";

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id as string),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (newStatus: string) => updateOrderStatus(id as string, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] }); // Also invalidate list
      showSuccess("Order status updated successfully");
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message || "Failed to update order status");
    },
  });

  const order = data?.data?.order;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-red-600 font-semibold text-lg">Order not found</p>
        <button onClick={() => navigate("/orders")} className="text-purple-600 hover:underline">
          Go back to Orders
        </button>
      </div>
    );
  }

  // Define tracking steps dynamically based on current status
  const trackingSteps = [
    { id: 1, status: "CREATED", completed: true },
    { id: 2, status: "PROCESSING", completed: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order.orderStatus) },
    { id: 3, status: "SHIPPED", completed: ["SHIPPED", "DELIVERED"].includes(order.orderStatus) },
    { id: 4, status: "DELIVERED", completed: order.orderStatus === "DELIVERED" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Orders</span>
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order {order._id.substring(order._id.length - 8).toUpperCase()}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Status Dropdown */}
          <Select 
            value={order.orderStatus} 
            onValueChange={(val) => updateMutation.mutate(val)}
            disabled={updateMutation.isPending}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="SHIPPED">Shipped</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="CREATED">Created</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Tracking & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Tracking */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Tracking
              </h2>

              <div className="space-y-0">
                {trackingSteps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Timeline Icon & Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.completed
                            ? "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      >
                        <Check
                          className={`w-5 h-5 ${
                            step.completed ? "text-white" : "text-gray-400"
                          }`}
                        />
                      </div>
                      {index < trackingSteps.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-200 my-1" />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 pb-8">
                      <h3
                        className={`font-semibold ${
                          step.completed ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {step.status}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Items
              </h2>

              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <Card key={item._id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product?.allImages?.[0] ? (
                            <img src={item.product.allImages[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {item.product?.name || "Unknown Product"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            ₹{item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  ₹{order.totalAmount.toFixed(2)}
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
                    {order.user?.name || "Unknown"}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <a
                    href={`mailto:${order.user?.email}`}
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
                    {order.user?.phone || "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address (Placeholder since it's not in schema yet) */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Delivery Address
              </h3>

              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  {order.shippingAddress?.street ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}` : "Address not provided"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice */}
          <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-1">Invoice</h3>
              <p className="text-sm text-purple-100 mb-6">
                Order #{order._id.substring(order._id.length - 8).toUpperCase()}
              </p>

              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Payment Status</span>
                  <span className="font-semibold">
                    {order.paymentStatus}
                  </span>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-purple-400">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    ₹{order.totalAmount.toFixed(2)}
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
