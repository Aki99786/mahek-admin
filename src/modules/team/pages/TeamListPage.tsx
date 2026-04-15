import * as React from "react";
import { Search, Eye, LoaderCircle, Edit2, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const TeamListPage = () => {
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");
  const [showSearchSpinner, setShowSearchSpinner] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(20);
  const [statusOverrides, setStatusOverrides] = React.useState<
    Record<string, boolean>
  >({});

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
  }, [debouncedSearchValue]);

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearchValue) {
      params.append("search", debouncedSearchValue);
    }
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return `?${params.toString()}`;
  }, [debouncedSearchValue, page, limit]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["team", queryString],
    queryFn: () => getUsersList(queryString),
    staleTime: 1000 * 60 * 5,
  });

  const teamMembers = data?.data?.users || [];
  const pagination = data?.data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const stats = React.useMemo(() => {
    const totalMembers = pagination.total;
    const activeMembers = teamMembers.filter((m: any) => m.isActive).length;
    const inactiveMembers = teamMembers.filter((m: any) => !m.isActive).length;

    return {
      total: totalMembers,
      active: activeMembers,
      inactive: inactiveMembers,
    };
  }, [teamMembers, pagination.total]);

  const getInitials = (name?: string) => {
    if (!name?.trim()) return "NA";
    const parts = name.trim().split(/\s+/);
    return parts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Team</h1>
        <p className="text-gray-500 mt-1">Manage team members</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Total Members</p>
            <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Active Members</p>
            <p className="text-4xl font-bold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardContent className="p-6">
            <p className="text-sm text-gray-600 mb-2">Inactive Members</p>
            <p className="text-4xl font-bold text-red-600">{stats.inactive}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search team by name, email, or phone..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 h-11 border-gray-300 bg-white"
          />
          {showSearchSpinner && (
            <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        <Link to="/team/add-member">
          <Button className="h-11 bg-[#8B1A1A] hover:bg-[#6f1414]">
            <Plus className="w-4 h-4 mr-2" />
            Add Team Member
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading team members...</span>
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 font-semibold">Error loading team members</p>
            <p className="text-sm text-gray-500 mt-1">
              {(error as any)?.message || "Something went wrong"}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && teamMembers.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 font-semibold">No team members found</p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearchValue
                ? "Try adjusting your search"
                : "No team members available"}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && teamMembers.length > 0 && (
        <>
          <Card className="bg-white">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Users
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Created At
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
                  {teamMembers.map((member: any) => (
                    <TableRow key={member._id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {member?.profilePicture || member?.avatar ? (
                            <img
                              src={member.profilePicture || member.avatar}
                              alt={member?.name || "Member"}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold bg-gradient-to-br from-purple-500 to-pink-500">
                              {getInitials(member?.name)}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <div className="font-semibold text-gray-900">
                              {member?.name || "-"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member?.email || "-"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {member?.phone || member?.phoneNumber || "-"}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 text-xs font-medium">
                          {member?.role || "MEMBER"}
                        </span>
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {formatDate(member?.createdAt)}
                      </TableCell>

                      <TableCell>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={
                            statusOverrides[member._id] ?? Boolean(member?.isActive)
                          }
                          onClick={() =>
                            setStatusOverrides((prev) => ({
                              ...prev,
                              [member._id]:
                                !(prev[member._id] ?? Boolean(member?.isActive)),
                            }))
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            statusOverrides[member._id] ?? Boolean(member?.isActive)
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              statusOverrides[member._id] ??
                              Boolean(member?.isActive)
                                ? "translate-x-5"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/team/detail/${member._id}`}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <Link
                            to={`/team/edit-member/${member._id}`}
                            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                          >
                            <Edit2 className="h-5 w-5" />
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
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
                {Math.min(page * limit, pagination.total)} of {pagination.total} members
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

export default TeamListPage;