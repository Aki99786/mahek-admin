import * as React from "react";
import { Search, Plus, Eye, Edit2, Trash2, LoaderCircle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "zustand";
import { getProductsList, deleteProduct } from "@/http/Services/all";
import { confirmationStore } from "@/store/store";
import { ModalType } from "@/shared-component/Confirmation";
import { showSuccess, showError } from "@/utility/utility";

const ProductListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const openConfirmation = useStore(confirmationStore, (s) => s.openConfirmation);

  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = React.useState("");
  const [showSearchSpinner, setShowSearchSpinner] = React.useState(false);
  const [offset, setOffset] = React.useState(0);
  const [limit] = React.useState(20);

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showSuccess("Product deleted successfully");
    },
    onError: (error: any) => {
      showError(error?.response?.data?.message ?? "Failed to delete product");
    },
  });

  const handleDeleteProduct = React.useCallback(
    async (product: { _id?: string; id?: string }) => {
      const id = product._id ?? product.id;
      const response = await openConfirmation({
        title: "Delete Product",
        description: "Are you sure you want to delete this product?",
        type: ModalType.DESTRUCTIVE,
        id,
      });
      if (response?.confirmed && response?.data?.id) {
        deleteMutation.mutate(response.data.id);
      }
    },
    [openConfirmation, deleteMutation]
  );

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
    setOffset(0);
  }, [debouncedSearchValue]);

  // Build query string for API
  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearchValue) {
      params.append("search", debouncedSearchValue);
    }
    params.append("offset", offset.toString());
    params.append("limit", limit.toString());
    return `?${params.toString()}`;
  }, [debouncedSearchValue, offset, limit]);

  // Fetch products using TanStack Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products", queryString],
    queryFn: () => getProductsList(queryString),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const products = data?.data?.products || [];
  const totalCount = data?.data?.total || 0;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">
            Manage your product inventory
          </p>
        </div>
        <Link to={"/products/add-product"}>
          <Button className="bg-[#8B1A1A] hover:bg-[#6f1414]">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-11 border-gray-300 bg-white"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {showSearchSpinner && (
            <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
          )}
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] h-11 border-gray-300 bg-white">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Lehenga">Lehenga</SelectItem>
            <SelectItem value="Rajputi Poshak">Rajputi Poshak</SelectItem>
            <SelectItem value="Saree">Saree</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <LoaderCircle className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 font-semibold">Error loading products</p>
            <p className="text-sm text-gray-500 mt-1">
              {error?.message || "Something went wrong"}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && products.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-600 font-semibold">No products found</p>
            <p className="text-sm text-gray-500 mt-1">
              {debouncedSearchValue
                ? "Try adjusting your search"
                : "Add some products to get started"}
            </p>
          </div>
        </div>
      )}

      {/* Products Grid - 5 columns */}
      {!isLoading && !isError && products.length > 0 && (
        <>
          <div className="grid grid-cols-5 gap-4">
            {products.map((product: any) => {
              // Get first variant data
              const firstVariant = product.variants?.[0];
              const hasMultipleVariants = product.variants?.length > 1;
              const variantImage = "https://res.cloudinary.com/dhgylinef/image/upload/v1776250194/b5drchfcsuhqcmmr6wed.png";
              // const variantImage = firstVariant?.images?.[0] || product?.allImages?.[0] || "https://res.cloudinary.com/dhgylinef/image/upload/v1776250194/b5drchfcsuhqcmmr6wed.png";
              const sellingPrice = firstVariant?.sellingPrice || product.price || 0;
              const mrp = firstVariant?.mrp || product.price || 0;
              const hasDiscount = mrp > sellingPrice;

              return (
                <Card
                  key={product.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image with Badges */}
                  <div className="relative h-56 overflow-hidden bg-white border-b">
                    <div className="w-full flex items-center justify-center">
                      <img
                        src={variantImage}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://res.cloudinary.com/dhgylinef/image/upload/v1776250194/b5drchfcsuhqcmmr6wed.png";
                        }}
                      />
                    </div>
                    {/* Stock Badges */}
                    {product.totalStock === 0 && (
                      <Badge className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1">
                        SOLD OUT
                      </Badge>
                    )}
                    {product.totalStock > 0 && product.totalStock < 10 && (
                      <Badge className="absolute top-2 right-2 bg-orange-500 hover:bg-orange-600 text-white text-xs px-2 py-1">
                        Low Stock
                      </Badge>
                    )}
                    {/* Multiple Variants Button - Icon Only */}
                    {hasMultipleVariants && (
                      <button
                        onClick={() => navigate(`/products/detail/${product._id}`)}
                        className="group absolute bottom-3 right-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full p-2 transition-all shadow-md hover:shadow-lg"
                        title="More Variant"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                        <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          More Variant
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Product Details */}
                  <CardContent className="p-4 space-y-2.5">
                    {/* Category */}
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-xs px-2 py-0.5">
                      {product.category || "Uncategorized"}
                    </Badge>

                    {/* Product Name */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                    </div>

                    {/* Brand */}
                    <div className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">Brand:</span>{" "}
                      <span>{product.brand || "N/A"}</span>
                    </div>

                    {/* Price Section */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-green-600">
                          ₹{sellingPrice}
                        </span>
                        {hasDiscount && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              ₹{mrp}
                            </span>
                            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs px-1.5 py-0">
                              {Math.round(((mrp - sellingPrice) / mrp) * 100)}% OFF
                            </Badge>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Stock: {" "}
                        <span
                          className={`font-medium ${
                            product.totalStock === 0
                              ? "text-red-600"
                              : product.totalStock < 10
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {product.totalStock || 0}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Link to={`/products/detail/${product._id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-4 text-xs font-medium border-gray-300 hover:bg-gray-50"
                        >
                          <Eye className="w-3 h-3 mr-1.5" />
                          View
                        </Button>
                      </Link>
                      <div className="flex items-center gap-1.5">
                        <Link to={`/products/edit-product/${product?._id}`}>
                          <Button 
                            size="icon-sm"
                            className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="icon-sm"
                          className="h-7 w-7 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending &&
                          deleteMutation.variables === (product._id ?? product.id) ? (
                            <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination Section */}
          {totalCount > limit && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <div className="text-sm text-gray-600">
                Showing {offset + 1} to {Math.min(offset + limit, totalCount)} of {totalCount} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((prev) => Math.max(prev - limit, 0))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <div className="text-sm text-gray-600">
                  Page {Math.floor(offset / limit) + 1} of {Math.ceil(totalCount / limit)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOffset((prev) => prev + limit)}
                  disabled={offset + limit >= totalCount}
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

export default ProductListPage;
