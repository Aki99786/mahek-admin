import { ArrowLeft, Mail, Phone, Calendar, ShoppingBag, UserX, UserCheck, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserById, getOrdersList } from "@/http/Services/all";

const UserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch User Details
  const { data: userData, isLoading: isUserLoading, isError: isUserError } = useQuery({
    queryKey: ["user", id],
    queryFn: () => getUserById(id as string),
    enabled: !!id,
  });

  // Fetch User Orders
  const { data: userOrdersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["userOrders", id],
    queryFn: () => getOrdersList(`?search=${id}`), // The backend getAllOrders searches by ID
    enabled: !!id,
  });

  // We'll skip the update user mutation here since `updateUser` isn't fully exported from all.ts 
  // and might require more complex form handling per the backend controller.
  
  const user = userData?.data?.user;
  const userOrders = userOrdersData?.data?.orders || [];
  
  const isLoading = isUserLoading || isOrdersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderCircle className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isUserError || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen flex-col gap-4">
        <p className="text-red-600 font-semibold text-lg">User not found</p>
        <button onClick={() => navigate("/users")} className="text-purple-600 hover:underline">
          Go back to Users
        </button>
      </div>
    );
  }

  // Calculate stats from orders
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((acc: number, order: any) => acc + (order.totalAmount || 0), 0);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.map((part) => part[0]).join("");
  };

  // Get status badge styling
  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-700 hover:bg-green-100"
      : "bg-red-100 text-red-700 hover:bg-red-100";
  };

  // Get order status badge styling
  const getOrderStatusBadgeClass = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case "CANCELLED":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate("/users")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Users</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - User Info */}
        <div className="lg:col-span-1">
          <Card className="bg-white">
            <CardContent className="p-6">
              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 bg-purple-600"
                >
                  {getInitials(user.name || "Unknown User")}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {user.name || "No name provided"}
                </h2>
                <Badge className={`${getStatusBadgeClass(user.isActive)} font-medium`}>
                  {user.isActive ? "Active" : "Blocked"}
                </Badge>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 mb-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{user.email}</span>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{user.phone}</span>
                </div>

                {/* Address (If available in UI mock but not schema, omited or placeholder) */}
                <div className="flex items-start gap-3">
                  <Badge variant={user.emailVerified ? "default" : "secondary"}>
                    {user.emailVerified ? "Email Verified" : "Unverified Email"}
                  </Badge>
                </div>

                {/* Join Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Total Orders */}
                <div className="flex items-start gap-3">
                  <ShoppingBag className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">
                    {totalOrders} total orders
                  </span>
                </div>
              </div>

              {/* Block User Button (Display only for now, logic out of scope) */}
              <Button 
                className={`w-full text-white h-11 ${user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {user.isActive ? <UserX className="w-5 h-5 mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />}
                {user.isActive ? "Block User" : "Unblock User"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-6">
            {/* Total Orders */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total Orders</p>
                <p className="text-4xl font-bold text-gray-900">
                  {totalOrders}
                </p>
              </CardContent>
            </Card>

            {/* Total Spent */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-2">Total Spent</p>
                <p className="text-4xl font-bold text-purple-600">
                  ₹{totalSpent.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order History */}
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Order History
              </h3>

              <div className="space-y-4">
                {userOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders found for this user.</p>
                ) : (
                  userOrders.map((order: any) => (
                    <Card key={order._id} className="border border-gray-200">
                      <CardContent className="p-5">
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-gray-900">
                              Order #{order._id.substring(order._id.length - 8).toUpperCase()}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            className={`${getOrderStatusBadgeClass(order.orderStatus)} font-semibold text-xs px-3 py-1`}
                          >
                            {order.orderStatus}
                          </Badge>
                        </div>
  
                        {/* Order Items */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((item: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">
                                {item.product?.name || "Unknown"} x {item.quantity}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
  
                        {/* Order Total */}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">
                            Total
                          </span>
                          <span className="font-bold text-lg text-purple-600">
                            ₹{order.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* We are hiding Recent Activity component for now since the backend doesn't have a dedicated endpoint or schema for user actions log */}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
