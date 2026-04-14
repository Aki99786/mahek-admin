import * as React from "react";
import { Search, Eye, Package, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getOrderList } from "@/http/Services/all";

type OrderStatus =
  | "ORDER_PLACED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | string;

interface ApiOrder {
  _id: string;
  user?: {
    email?: string;
    name?: string;
  };
  createdAt?: string;
  items?: unknown[];
  totalAmount?: number;
  orderStatus?: string;
}

const OrdersListPage = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");
  const [showSearchSpinner, setShowSearchSpinner] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const trimmedValue = searchValue.trim();
      setDebouncedSearchValue(trimmedValue);
      setShowSearchSpinner(false);
    }, 500);

    if (searchValue.trim().length > 0) {
      setShowSearchSpinner(true);
    }

    return () => window.clearTimeout(timeoutId);
  }, [searchValue]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchValue, filterStatus]);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearchValue) {
      params.append("search", debouncedSearchValue);
    }
    if (filterStatus !== "all") {
      params.append("orderStatus", filterStatus);
    }
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return `?${params.toString()}`;
  }, [debouncedSearchValue, filterStatus, page, limit]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", queryString],
    queryFn: () => getOrderList(queryString),
    staleTime: 1000 * 60 * 5,
  });

  const orders: ApiOrder[] = data?.data?.orders || [];
  const pagination = data?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const statuses = orders.map((o) => (o.orderStatus || "").toUpperCase());
    return {
      total: pagination.total,
      pending: statuses.filter((s) => s === "ORDER_PLACED").length,
      processing: statuses.filter((s) => s === "PROCESSING").length,
      shipped: statuses.filter((s) => s === "SHIPPED").length,
      delivered: statuses.filter((s) => s === "DELIVERED").length,
    };
  }, [orders, pagination.total]);

  // Get status badge styling
  const getStatusBadgeClass = (status: OrderStatus) => {
    switch ((status || "").toUpperCase()) {
      case "DELIVERED":
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case "PROCESSING":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
      case "ORDER_PLACED":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case "SHIPPED":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100";
      case "CANCELLED":
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 mt-1">Track and manage customer orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-6">
        {/* Total */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total</p>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        {/* Order Placed */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Order Placed</p>
            <p className="text-4xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </CardContent>
        </Card>

        {/* Processing */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Processing</p>
            <p className="text-4xl font-bold text-blue-600">
              {stats.processing}
            </p>
          </CardContent>
        </Card>

        {/* Shipped */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Shipped</p>
            <p className="text-4xl font-bold text-purple-600">
              {stats.shipped}
            </p>
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Delivered</p>
            <p className="text-4xl font-bold text-green-600">
              {stats.delivered}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by order ID, customer name, or email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-11 border-gray-300 bg-white"
          />
          {showSearchSpinner && (
            <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>

        {/* Filter Dropdown */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-11 border-gray-300 bg-white">
            <SelectValue placeholder="All Orders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="ORDER_PLACED">Order Placed</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 font-semibold">Error loading orders</p>
            <p className="text-sm text-gray-500 mt-1">
              {(error as { message?: string })?.message || "Something went wrong"}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 font-semibold">No orders found</p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearchValue
                ? "Try adjusting your search"
                : "No orders available yet"}
            </p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && !isError && orders.length > 0 && (
        <>
          <Card className="bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Order ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Customer
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Items
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-gray-900">
                            {order._id}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {order.user?.name?.trim() || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.user?.email || "N/A"}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {formatDate(order.createdAt)}
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {order.items?.length ?? 0} item(s)
                      </TableCell>

                      <TableCell className="font-semibold text-gray-900">
                        ₹{Number(order.totalAmount ?? 0).toFixed(2)}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={`${getStatusBadgeClass(order.orderStatus || "")} font-semibold text-xs px-3 py-1`}
                        >
                          {(order.orderStatus || "UNKNOWN").replaceAll("_", " ")}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Link
                          to={`/orders/detail/${order._id}`}
                          className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <div className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, pagination.total)} of {pagination.total} orders
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-600">
                  Page {page} of {pagination.totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, pagination.totalPages))
                  }
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OrdersListPage;
