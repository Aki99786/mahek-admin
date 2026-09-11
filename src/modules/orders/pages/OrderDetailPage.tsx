import { ArrowLeft, Mail, Phone, MapPin, Package, Check, RefreshCw, Download, XCircle, Truck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getOrderById, trackOrder, retryShipment, downloadShipmentLabel, cancelShipment } from "@/http/Services/all";

interface OrderItem {
  _id: string;
  product?: {
    name?: string;
    allImages?: string[];
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
  orderStatus?: string;
  paymentStatus?: string;
  // Shiprocket fields
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  awbCode?: string | null;
  courierName?: string | null;
}

interface TrackingActivity {
  date?: string;
  activity?: string;
  location?: string;
}

interface TrackingResponse {
  orderId?: string;
  orderStatus?: string;
  awbCode?: string | null;
  courierName?: string | null;
  shiprocketOrderId?: string | null;
  shiprocketShipmentId?: string | null;
  trackingData?: {
    current_status?: string;
    etd?: string;
    shipment_track?: TrackingActivity[];
    shipment_track_activities?: TrackingActivity[];
  } | null;
  message?: string;
}

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

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

  // Live tracking query — fetches Shiprocket data
  const { data: tracking, isLoading: isTrackingLoading, refetch: refetchTracking } =
    useQuery<TrackingResponse>({
      queryKey: ["order-tracking", id],
      queryFn: async () => {
        const res = await trackOrder(id!);
        return (res as { data?: TrackingResponse }).data ?? (res as unknown as TrackingResponse);
      },
      enabled: Boolean(id),
      staleTime: 1000 * 60 * 2, // refresh every 2 min
    });

  // Mutation: Retry Shiprocket shipment
  const retryMutation = useMutation({
    mutationFn: () => retryShipment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["order-tracking", id] });
    },
  });

  // Mutation: Cancel shipment
  const cancelMutation = useMutation({
    mutationFn: () => cancelShipment(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
    },
  });

  // Label download handler
  const handleDownloadLabel = async () => {
    try {
      const res = await downloadShipmentLabel(id!);
      const labelUrl =
        (res as { data?: { labelUrl?: string } }).data?.labelUrl ??
        (res as { labelUrl?: string }).labelUrl;
      if (labelUrl) {
        window.open(labelUrl, "_blank");
      } else {
        alert("Label URL not available. Try again after Shiprocket processes the shipment.");
      }
    } catch {
      alert("Failed to download label. Please try again.");
    }
  };

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
        {/* Left Column - Order Tracking & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Order Tracking (Shiprocket) */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Order Tracking</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetchTracking()}
                  className="text-xs text-gray-500 hover:text-gray-700 gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
              </div>

              {isTrackingLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="animate-spin h-4 w-4 rounded-full border-2 border-purple-500 border-t-transparent" />
                  Fetching live tracking...
                </div>
              )}

              {!isTrackingLoading && tracking && (() => {
                const activities: TrackingActivity[] =
                  tracking.trackingData?.shipment_track_activities ??
                  tracking.trackingData?.shipment_track ??
                  [];

                return (
                  <div className="space-y-4">
                    {/* Shipment info chips */}
                    <div className="flex flex-wrap gap-2">
                      {tracking.courierName && (
                        <span className="flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 rounded-full px-3 py-1">
                          <Truck className="w-3.5 h-3.5" />
                          {tracking.courierName}
                        </span>
                      )}
                      {tracking.awbCode && (
                        <span className="text-xs bg-blue-50 text-blue-700 font-mono rounded-full px-3 py-1">
                          AWB: {tracking.awbCode}
                        </span>
                      )}
                      {tracking.trackingData?.etd && (
                        <span className="text-xs bg-green-50 text-green-700 rounded-full px-3 py-1">
                          ETA: {tracking.trackingData.etd}
                        </span>
                      )}
                    </div>

                    {!tracking.awbCode && (
                      <p className="text-sm text-gray-400 italic">
                        {tracking.message ?? "AWB not yet assigned. Use 'Retry Shipment' if needed."}
                      </p>
                    )}

                    {/* Event timeline */}
                    {activities.length > 0 ? (
                      <div className="space-y-0">
                        {activities.map((step, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                index === 0 ? "bg-green-500" : "bg-gray-200"
                              }`}>
                                <Check className={`w-5 h-5 ${index === 0 ? "text-white" : "text-gray-400"}`} />
                              </div>
                              {index < activities.length - 1 && (
                                <div className="w-0.5 h-16 bg-gray-200 my-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-8">
                              <h3 className="font-semibold text-gray-900">{step.activity ?? "—"}</h3>
                              {step.location && (
                                <p className="text-xs text-gray-500 mt-0.5">📍 {step.location}</p>
                              )}
                              {step.date && (
                                <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        No tracking events yet.
                      </p>
                    )}
                  </div>
                );
              })()}

            </CardContent>
          </Card>

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
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.product?.allImages?.[0] ? (
                            <img src={item.product.allImages[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
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
          {/* Shiprocket Info Card */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-500" />
                Shiprocket Shipment
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5">Shiprocket Order ID</p>
                  <p className="font-mono font-medium text-gray-800">
                    {order.shiprocketOrderId ?? <span className="italic text-gray-400">Not created</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Shipment ID</p>
                  <p className="font-mono font-medium text-gray-800">
                    {order.shiprocketShipmentId ?? <span className="italic text-gray-400">—</span>}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">AWB Number</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-blue-700">
                      {order.awbCode ?? <span className="italic text-gray-400 font-normal">Not assigned</span>}
                    </p>
                    {order.awbCode && (
                      <button
                        onClick={() => navigator.clipboard.writeText(order.awbCode ?? "")}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy AWB"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5">Courier</p>
                  <p className="font-medium text-gray-800">
                    {order.courierName ?? <span className="italic text-gray-400">—</span>}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                {/* Retry Shipment — only shown when AWB is missing */}
                {!order.awbCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    onClick={() => retryMutation.mutate()}
                    disabled={retryMutation.isPending}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryMutation.isPending ? "animate-spin" : ""}`} />
                    {retryMutation.isPending ? "Creating Shipment..." : "Retry Shipment"}
                  </Button>
                )}

                {/* Download Label — only shown when AWB exists */}
                {order.awbCode && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={handleDownloadLabel}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Label
                  </Button>
                )}

                {/* Cancel Shipment */}
                {order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Are you sure you want to cancel this shipment? This cannot be undone.")) {
                        cancelMutation.mutate();
                      }
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className={`w-3.5 h-3.5 ${cancelMutation.isPending ? "animate-spin" : ""}`} />
                    {cancelMutation.isPending ? "Cancelling..." : "Cancel Shipment"}
                  </Button>
                )}

                {retryMutation.isError && (
                  <p className="text-xs text-red-500">Retry failed. Check Shiprocket credentials.</p>
                )}
                {cancelMutation.isError && (
                  <p className="text-xs text-red-500">Cancellation failed. Please try again.</p>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* Delivery Address (Placeholder since it's not in schema yet) */}
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
                {/* Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-purple-100">Payment Status</span>
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
