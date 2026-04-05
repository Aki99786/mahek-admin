import * as React from "react";
import { Search, Eye, UserX, LoaderCircle } from "lucide-react";
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
import { getUsersList } from "@/http/Services/all";

const UsersListPage = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");
  const [showSearchSpinner, setShowSearchSpinner] = React.useState(false);
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);

  // Debounce search input
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

  // Reset to first page when search changes
  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearchValue, filterStatus]);

  // Build query string for API
  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearchValue) {
      params.append("search", debouncedSearchValue);
    }
    if (filterStatus !== "all") {
      params.append("isActive", filterStatus === "active" ? "true" : "false");
    }
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return `?${params.toString()}`;
  }, [debouncedSearchValue, filterStatus, page, limit]);

  // Fetch users using TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", queryString],
    queryFn: () => getUsersList(queryString),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalUsers = pagination.total;
    const activeUsers = users.filter((u: any) => u.isActive).length;
    const blockedUsers = users.filter((u: any) => !u.isActive).length;

    return {
      total: totalUsers,
      active: activeUsers,
      blocked: blockedUsers,
    };
  }, [users, pagination.total]);

  // Get initials from name
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-500 mt-1">Manage customer accounts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6">
        {/* Total Users */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Users</p>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Active Users</p>
            <p className="text-4xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>

        {/* Blocked Users */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Blocked Users</p>
            <p className="text-4xl font-bold text-red-600">{stats.blocked}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search users by name, email, or phone..."
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
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 font-semibold">Error loading users</p>
            <p className="text-sm text-gray-500 mt-1">
              {(error as any)?.message || "Something went wrong"}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 font-semibold">No users found</p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearchValue
                ? "Try adjusting your search"
                : "No users registered yet"}
            </p>
          </div>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !isError && users.length > 0 && (
        <>
          <Card className="bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Email Verified
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Join Date
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
                  {users.map((user: any) => (
                    <TableRow key={user._id} className="hover:bg-gray-50">
                      {/* User */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-pink-500"
                          >
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Role */}
                      <TableCell>
                        <Badge className={user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}>
                          {user.role}
                        </Badge>
                      </TableCell>

                      {/* Email Verified */}
                      <TableCell>
                        <Badge className={user.emailVerified ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                          {user.emailVerified ? "Yes" : "No"}
                        </Badge>
                      </TableCell>

                      {/* Join Date */}
                      <TableCell className="text-gray-700">
                        {formatDate(user.createdAt)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Badge
                          className={`${getStatusBadgeClass(user.isActive)} font-medium`}
                        >
                          {user.isActive ? "Active" : "Blocked"}
                        </Badge>
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/users/detail/${user._id}`}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-9 w-9 ${
                              user.isActive
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                : "text-green-600 hover:text-green-700 hover:bg-green-50"
                            }`}
                          >
                            <UserX className="h-5 w-5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination Section */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} users
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
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
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

export default UsersListPage;
