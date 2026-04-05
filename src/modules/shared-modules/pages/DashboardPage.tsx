import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Package, ShoppingCart, TrendingUp, AlertCircle, MessageSquare, IndianRupee } from "lucide-react";
import { getDashBoardData } from "@/http/Services/all";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Dummy data for charts
const monthlySalesData = [
  { name: "Jan", sales: 4000 },
  { name: "Feb", sales: 3000 },
  { name: "Mar", sales: 5000 },
  { name: "Apr", sales: 4500 },
  { name: "May", sales: 6000 },
  { name: "Jun", sales: 7000 },
];

const weeklyOrdersData = [
  { name: "Mon", orders: 12 },
  { name: "Tue", orders: 19 },
  { name: "Wed", orders: 15 },
  { name: "Thu", orders: 22 },
  { name: "Fri", orders: 25 },
  { name: "Sat", orders: 30 },
  { name: "Sun", orders: 20 },
];

const DashboardPage = () => {
  // Fetch dashboard data using TanStack Query
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => getDashBoardData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const dashboardData = data?.data || {
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    lowStockProducts: [],
    verifiedUsers: 0,
    activeUsers: 0,
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <h3 className="text-3xl font-bold text-gray-900">{dashboardData.totalUsers}</h3>
                <p className="text-xs text-green-600 mt-2">
                  {dashboardData.verifiedUsers} verified
                </p>
                 <p className="text-xs text-green-600 mt-2">
                  {dashboardData.activeUsers} Active
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <h3 className="text-3xl font-bold text-gray-900">{dashboardData.totalProducts}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <h3 className="text-3xl font-bold text-gray-900">{dashboardData.totalOrders}</h3>
                <p className="text-xs text-gray-500 mt-2">
                  0 delivered, 0 pending
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="bg-white hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  ₹{dashboardData.totalRevenue.toFixed(2)}
                </h3>
                <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +15% from last month
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales Trend */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Sales Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Orders */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Orders</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="orders" fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-gray-900">Low Stock Alerts</h3>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-sm text-gray-500 py-4 text-center">Loading...</div>
              ) : dashboardData.lowStockProducts && dashboardData.lowStockProducts.length > 0 ? (
                dashboardData.lowStockProducts.map((product: any) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                      {product.stock <= 5 ? "LOW" : "OUT OF STOCK"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 py-4 text-center">
                  No low stock products
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Support Queries */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Support Queries</h3>
            </div>
            <div className="space-y-3">
              {/* Dummy Support Queries */}
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Missing item in order</p>
                  <p className="text-xs text-gray-500">Sarah Johnson</p>
                  <p className="text-xs text-gray-400 mt-1">2024-01-15 09:32 PM</p>
                </div>
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100">high</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Question about shipping</p>
                  <p className="text-xs text-gray-500">Michael Chen</p>
                  <p className="text-xs text-gray-400 mt-1">2024-01-14 03:45 PM</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                  medium
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
