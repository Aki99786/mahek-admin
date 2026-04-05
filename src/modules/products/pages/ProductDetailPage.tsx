import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Heart, ShoppingBag, Star, ArrowLeft, Edit, Trash2 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { getProductById } from "@/http/Services/all";
import { Spinner } from "@/components/ui/spinner";

interface ProductVariant {
  id: string;
  color: string;
  sellingPrice: string;
  mrp: string;
  sizes: Record<string, { selected: boolean; stock: string }>;
  images: string[];
}

interface ProductApiResponse {
  productName: string;
  brand: string;
  category: string;
  subCategory?: string;
  pattern: string;
  fabric: string;
  neckType?: string;
  sleeveType?: string;
  description: string;
  variants: ProductVariant[];
  images: string[];
  colors: string[];
  sizes: string[];
  allImages: string[];
  allColors: string[];
  allSizes: string[];
  price: number;
  avgPrice: number;
  stockCount: number;
  totalStock: number;
  rating?: number;
}

// Memoized Image Slider Component
const ImageSlider = memo(({ images }: { images: string[] }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi]
  );

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-gray-200 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No product images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image Carousel */}
      <div className="relative group">
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {images.map((image, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://via.placeholder.com/400x600?text=Invalid+Image";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        {canScrollPrev && (
          <button
            onClick={scrollPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
        )}
        {canScrollNext && (
          <button
            onClick={scrollNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>
        )}

        {/* Image Counter */}
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
          {selectedIndex + 1}/{images.length}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg">
          <Heart className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Thumbnail Navigation */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={cn(
                "flex-shrink-0 w-16 h-20 rounded-md overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-pink-500 ring-2 ring-pink-200"
                  : "border-gray-300 hover:border-gray-400"
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

ImageSlider.displayName = "ImageSlider";

const ProductDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Fetch product by ID using TanStack Query
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<ProductApiResponse>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await getProductById(id!);
      // Handle both response formats
      return (res as { data?: ProductApiResponse }).data ?? (res as unknown as ProductApiResponse);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const variants: ProductVariant[] = product?.variants || [];

  const selectedVariant = variants[selectedVariantIndex] || variants[0];

  const { allImages, lowestPrice, highestMRP, totalStock } = useMemo(() => {
    if (!product) {
      return {
        allImages: [],
        lowestPrice: 0,
        highestMRP: 0,
        totalStock: 0,
      };
    }

    // Use allImages from API response or fallback to variant images
    const images = product.allImages || variants.flatMap((v) => v.images);

    const prices = variants.map((v) => parseFloat(v.sellingPrice) || 0).filter((p) => p > 0);
    const mrps = variants.map((v) => parseFloat(v.mrp) || 0).filter((m) => m > 0);
    const lowest = prices.length > 0 ? Math.min(...prices) : product.price || product.avgPrice || 0;
    const highest = mrps.length > 0 ? Math.max(...mrps) : product.price || product.avgPrice || 0;

    // Use totalStock from API response or calculate from variants
    const stock = product.totalStock || product.stockCount || variants.reduce((sum, v) => {
      return (
        sum +
        Object.entries(v.sizes)
          .filter(([, data]) => data.selected)
          .reduce((vSum, [, data]) => vSum + (parseInt(data.stock) || 0), 0)
      );
    }, 0);

    return {
      allImages: images,
      lowestPrice: lowest,
      highestMRP: highest,
      totalStock: stock,
    };
  }, [product, variants]);

  const calculateDiscount = useCallback((selling: string, mrp: string) => {
    const sellingPrice = parseFloat(selling) || 0;
    const mrpPrice = parseFloat(mrp) || 0;
    if (mrpPrice <= 0 || sellingPrice >= mrpPrice) return 0;
    return Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100);
  }, []);

  const currentDiscount = selectedVariant
    ? calculateDiscount(selectedVariant.sellingPrice, selectedVariant.mrp)
    : 0;

  const hasMultipleVariants = variants.length > 1 && variants.some((v) => v.color);

  // Get rating from API response
  const averageRating = product?.rating || 4.5;
  const ratingCount = 147;

  // Get selected sizes from current variant
  const availableSizes = selectedVariant
    ? Object.entries(selectedVariant.sizes)
        .filter(([, data]) => data.selected)
        .map(([size, data]) => ({ size, stock: parseInt(data.stock) || 0 }))
    : [];

  const handleEdit = () => {
    navigate(`/products/edit-product/${id}`);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      console.log("Delete product:", id);
      // TODO: Implement delete API call
      navigate("/products");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Failed to Load Product</h3>
            <p className="text-red-600 text-sm">
              {(error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? "Unable to fetch product details. Please try again."}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              onClick={() => navigate("/products")}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Product Details</h1>
              <p className="text-sm text-gray-500">{product.productName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 h-9 text-sm"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 px-4 h-9 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Image Gallery */}
          <div>
            <ImageSlider images={selectedVariant?.images || allImages} />
          </div>

          {/* Right Side - Product Info */}
          <div className="space-y-5">
            <Card className="p-6 bg-white">
              {/* Rating at the top */}
              <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-5 h-5",
                        star <= Math.floor(averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : star - 0.5 <= averageRating
                          ? "fill-yellow-200 text-yellow-400"
                          : "fill-gray-200 text-gray-300"
                      )}
                    />
                  ))}
                  <span className="ml-2 font-semibold text-lg text-gray-900">
                    {averageRating}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  ({ratingCount.toLocaleString()} ratings)
                </span>
              </div>

              {/* Brand and Name */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {product.brand || "Brand"}
                </h3>
                <h2 className="text-2xl font-bold text-gray-900">
                  {product.productName}
                </h2>
              </div>

              {/* Category and Sub-Category */}
              <div className="flex gap-2 mb-4">
                {product.category && (
                  <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 px-3 py-1 text-xs font-medium">
                    {product.category}
                  </Badge>
                )}
                {product.subCategory && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 px-3 py-1 text-xs font-medium">
                    {product.subCategory}
                  </Badge>
                )}
              </div>

              {/* Price */}
              <div className="space-y-2 border-b border-gray-200 pb-4 mb-4">
                {selectedVariant && currentDiscount > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-3xl font-bold text-gray-900">
                        ₹{selectedVariant.sellingPrice || "0"}
                      </span>
                      <span className="text-lg text-gray-400 line-through">
                        ₹{selectedVariant.mrp || "0"}
                      </span>
                      <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 px-2 py-1 text-sm font-semibold">
                        {currentDiscount}% OFF
                      </Badge>
                    </div>
                    <p className="text-sm text-green-600 font-medium">
                      You save ₹
                      {(
                        (parseFloat(selectedVariant.mrp) || 0) -
                        (parseFloat(selectedVariant.sellingPrice) || 0)
                      ).toFixed(0)}
                    </p>
                  </div>
                ) : lowestPrice > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-bold text-gray-900">₹{lowestPrice}</span>
                    {highestMRP > lowestPrice && (
                      <span className="text-lg text-gray-400 line-through">₹{highestMRP}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-400">₹0</span>
                )}
                <p className="text-xs text-gray-500">inclusive of all taxes</p>
              </div>

              {/* Color Selection */}
              {hasMultipleVariants && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase">Select Color</h4>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {variants.map((variant, index) => {
                      if (!variant.color) return null;
                      const isSelected = index === selectedVariantIndex;
                      const discount = calculateDiscount(variant.sellingPrice, variant.mrp);
                      return (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariantIndex(index)}
                          className={cn(
                            "px-4 py-3 border-2 rounded-lg text-left transition-all hover:border-pink-400",
                            isSelected
                              ? "border-pink-500 bg-pink-50"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          <div className="text-sm font-semibold text-gray-900">{variant.color}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            ₹{variant.sellingPrice}
                            {discount > 0 && (
                              <span className="ml-1 text-green-600">({discount}% OFF)</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase">Available Sizes</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableSizes.map(({ size, stock }) => (
                      <button
                        key={size}
                        disabled={stock === 0}
                        className={cn(
                          "py-3 border-2 rounded-lg text-center font-medium transition-all relative",
                          stock > 0
                            ? "border-gray-300 hover:border-pink-400 text-gray-900"
                            : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        )}
                      >
                        {size}
                        {stock > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                            {stock}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock Status */}
              {totalStock > 0 && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-green-600 font-medium">
                    {totalStock < 10 ? `Only ${totalStock} left` : "In Stock"}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2 mb-4">
                <Button className="flex-1 h-12 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-base">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  ADD TO BAG
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-5 border-2 border-gray-300 hover:border-gray-400"
                >
                  <Heart className="w-5 h-5 text-gray-700" />
                </Button>
              </div>

              {/* Delivery Information */}
              <div className="border border-gray-200 rounded-lg p-4 space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-gray-700">DELIVERY OPTIONS</h4>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Free Delivery on orders above ₹499</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Only 7 day return window</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600">Cash on Delivery available</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="border-t border-gray-200 pt-4 space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase">
                  Product Details
                </h4>
                <div
                  className="text-sm text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>

              {/* Product Specifications */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">
                  Specifications
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.fabric && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Fabric:</span>
                      <span className="font-medium text-gray-900">{product.fabric}</span>
                    </div>
                  )}
                  {product.pattern && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Pattern:</span>
                      <span className="font-medium text-gray-900">{product.pattern}</span>
                    </div>
                  )}
                  {product.neckType && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Neck Type:</span>
                      <span className="font-medium text-gray-900">{product.neckType}</span>
                    </div>
                  )}
                  {product.sleeveType && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Sleeve:</span>
                      <span className="font-medium text-gray-900">{product.sleeveType}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Stock:</span>
                    <span className="font-medium text-gray-900">{totalStock}</span>
                  </div>
                  {product.allColors && product.allColors.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Colors:</span>
                      <span className="font-medium text-gray-900">{product.allColors.join(", ")}</span>
                    </div>
                  )}
                  {product.allSizes && product.allSizes.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">All Sizes:</span>
                      <span className="font-medium text-gray-900">{product.allSizes.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;