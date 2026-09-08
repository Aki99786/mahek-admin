import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { getProductById, updateProduct } from "@/http/Services/all";
import { Spinner } from "@/components/ui/spinner";
import { showError, showSuccess } from "@/utility/utility";

interface ProductSize {
  size: string;
  quantity: number;
  selling_price: number;
  mrp: number;
  _id: string;
  is_cart_active: boolean;
  is_wishlist: boolean;
}

interface ProductVariant {
  _id: string;
  product_id: string;
  color: string;
  sizes: ProductSize[];
  images: string[];
  sku: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  _id: string;
  category: string;
  brand: string;
  product_name: string;
  fabric: string;
  description: string;
  is_sale: boolean;
  is_visible: boolean;
  status: string;
  is_delete: boolean;
  createdAt?: string;
  updatedAt?: string;
  product_variants: ProductVariant[];
}

const FALLBACK_IMAGE = "https://via.placeholder.com/400?text=No+Image";
const LOW_STOCK_THRESHOLD = 10;

const COLOR_NAMES: Record<string, string> = {
  "#000000": "Black",
  "#FFFFFF": "White",
  "#F31B1B": "Red",
  "#FF0000": "Red",
  "#0000FF": "Blue",
  "#000080": "Navy Blue",
  "#191970": "Navy Blue",
  "#1E3A5F": "Navy Blue",
  "#808080": "Grey",
  "#C0C0C0": "Silver",
  "#FFD700": "Gold",
  "#FFC0CB": "Pink",
  "#800080": "Purple",
  "#008000": "Green",
  "#A52A2A": "Brown",
  "#F5F5DC": "Beige",
  "#FFFF00": "Yellow",
  "#FFA500": "Orange",
  "#800000": "Maroon",
};

const formatCategory = (value: string): string =>
  value
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatColorLabel = (hex: string): string => {
  const key = hex.trim().toUpperCase();
  return COLOR_NAMES[key] || key;
};

const formatMoney = (value: number): string =>
  `₹${Number(value).toLocaleString("en-IN")}`;

const getDiscountPercent = (mrp: number, sellingPrice: number): number => {
  if (!(mrp > 0 && sellingPrice >= 0 && mrp > sellingPrice)) return 0;
  return Math.round(((mrp - sellingPrice) / mrp) * 100);
};

const pickInitialSize = (sizes: ProductSize[]): ProductSize | undefined =>
  sizes.find((size) => size.quantity > 0) ?? sizes[0];

const variantStock = (variant: ProductVariant): number =>
  (variant.sizes ?? []).reduce((sum, size) => sum + (Number(size.quantity) || 0), 0);

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

  useEffect(() => {
    emblaApi?.scrollTo(0);
    setSelectedIndex(0);
  }, [images, emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-gray-200">
            <ShoppingBag className="size-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No product images</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="group relative">
        <div className="overflow-hidden rounded-lg" ref={emblaRef}>
          <div className="flex">
            {images.map((image, index) => (
              <div key={`${image}-${index}`} className="min-w-0 flex-[0_0_100%]">
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={image}
                    alt={`Product image ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        {canScrollPrev && (
          <button
            type="button"
            onClick={scrollPrev}
            className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ChevronLeft className="size-5 text-gray-800" />
          </button>
        )}
        {canScrollNext && (
          <button
            type="button"
            onClick={scrollNext}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
          >
            <ChevronRight className="size-5 text-gray-800" />
          </button>
        )}
        <div className="absolute right-3 bottom-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">
          {selectedIndex + 1}/{images.length}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={`thumb-${image}-${index}`}
              type="button"
              onClick={() => scrollTo(index)}
              className={cn(
                "h-20 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all",
                selectedIndex === index
                  ? "border-gray-900 ring-2 ring-gray-200"
                  : "border-gray-300 hover:border-gray-400",
              )}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                onError={(event) => {
                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
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
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [activeView, setActiveView] = useState<"storefront" | "summary">("summary");
  const [expandedVariantIndex, setExpandedVariantIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSizeId, setSelectedSizeId] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await getProductById(id!);
      return (res as { data?: Product }).data ?? (res as unknown as Product);
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5,
  });

  const variants = product?.product_variants ?? [];
  const selectedVariant = variants[selectedVariantIndex] ?? variants[0];
  const sizes = selectedVariant?.sizes ?? [];
  const images = selectedVariant?.images ?? [];
  const selectedSize =
    sizes.find((size) => size._id === selectedSizeId) ?? pickInitialSize(sizes);

  useEffect(() => {
    if (!product?._id) return;
    const firstVariant = product.product_variants?.[0];
    setSelectedVariantIndex(0);
    setExpandedVariantIndex(0);
    setSelectedSizeId(pickInitialSize(firstVariant?.sizes ?? [])?._id ?? "");
    setSelectedImageIndex(0);
  }, [product?._id]);

  const stats = useMemo(() => {
    const allSizes = variants.flatMap((variant) => variant.sizes ?? []);
    const prices = allSizes
      .map((size) => Number(size.selling_price) || 0)
      .filter((price) => price > 0);
    const uniqueSizes = new Set(
      allSizes.map((size) => size.size).filter(Boolean),
    );
    const totalInventory = allSizes.reduce(
      (sum, size) => sum + (Number(size.quantity) || 0),
      0,
    );
    return {
      totalVariants: variants.length,
      totalInventory,
      activeSizes: uniqueSizes.size,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [variants]);

  const sellingPrice = Number(selectedSize?.selling_price) || 0;
  const mrp = Number(selectedSize?.mrp) || 0;
  const discount = getDiscountPercent(mrp, sellingPrice);
  const isOutOfStock = (selectedSize?.quantity ?? 0) === 0;
  const isPublished = product?.status === "active" || product?.is_sale === true;

  const publishMutation = useMutation({
    mutationFn: async (current: Product) =>
      updateProduct(current._id, {
        category: current.category,
        brand: current.brand,
        product_name: current.product_name,
        fabric: current.fabric,
        description: current.description,
        is_sale: true,
        is_visible: true,
        status: "active",
        is_delete: false,
        product_variants: (current.product_variants ?? []).map((variant) => ({
          color: variant.color,
          images: variant.images ?? [],
          sizes: (variant.sizes ?? []).map((size) => ({
            size: size.size,
            quantity: size.quantity,
            selling_price: size.selling_price,
            mrp: size.mrp,
          })),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showSuccess("Product published successfully");
    },
    onError: (publishError: { response?: { data?: { message?: string } } }) => {
      showError(publishError?.response?.data?.message ?? "Failed to publish product");
    },
  });

  const handleVariantChange = (index: number) => {
    setSelectedVariantIndex(index);
    setSelectedSizeId(pickInitialSize(variants[index]?.sizes ?? [])?._id ?? "");
    setSelectedImageIndex(0);
  };

  const handleAccordionToggle = (index: number) => {
    if (expandedVariantIndex !== index) {
      handleVariantChange(index);
    }
    setExpandedVariantIndex((current) => (current === index ? -1 : index));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F6F8]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 font-semibold text-red-800">Failed to Load Product</h3>
            <p className="text-sm text-red-600">
              {(error as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ?? "Unable to fetch product details. Please try again."}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/products")}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h1 className="text-lg font-semibold text-gray-900 sm:text-xl">
            Product Preview
          </h1>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setActiveView("storefront")}
              className={cn(
                "pb-1 text-sm font-medium",
                activeView === "storefront"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              Storefront View
            </button>
            <button
              type="button"
              onClick={() => setActiveView("summary")}
              className={cn(
                "pb-1 text-sm font-medium",
                activeView === "summary"
                  ? "border-b-2 border-gray-900 text-gray-900"
                  : "text-gray-500 hover:text-gray-800",
              )}
            >
              Summary View
            </button>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-9 border-gray-300 bg-white px-4 text-gray-800"
              onClick={() => navigate("/products")}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 border-gray-300 bg-white px-4 text-gray-800"
              onClick={() => navigate(`/products/edit-product/${product._id}`)}
            >
              Back to Edit
            </Button>
            <Button
              type="button"
              className="h-9 bg-[#1B365D] px-4 text-white hover:bg-[#152A48]"
              disabled={publishMutation.isPending || isPublished}
              onClick={() => publishMutation.mutate(product)}
            >
              {publishMutation.isPending
                ? "Publishing..."
                : isPublished
                  ? "Published"
                  : "Publish Product"}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 sm:px-6">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-8 border-gray-300 bg-white px-3 text-sm text-gray-700"
            onClick={() => navigate("/products")}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      </div>

      {activeView === "summary" ? (
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {product.brand && (
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-gray-800 uppercase">
                {product.brand}
              </span>
            )}
            {product.category && (
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {formatCategory(product.category)}
              </span>
            )}
            {product.fabric && (
              <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                {product.fabric}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            {product.product_name}
          </h2>
          {product.description && (
            <div
              className="product-html-description mt-3 max-w-4xl text-sm leading-6 text-gray-600 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "TOTAL VARIANTS", value: String(stats.totalVariants) },
              {
                label: "TOTAL INVENTORY",
                value: `${stats.totalInventory} Units`,
              },
              { label: "ACTIVE SIZES", value: String(stats.activeSizes) },
              {
                label: "PRICE RANGE",
                value:
                  stats.minPrice > 0
                    ? stats.minPrice === stats.maxPrice
                      ? formatMoney(stats.minPrice)
                      : `${formatMoney(stats.minPrice)} - ${formatMoney(stats.maxPrice)}`
                    : "—",
              },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4"
              >
                <p className="text-[11px] font-medium tracking-[0.08em] text-gray-400">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {variants.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                No variants available for this product.
              </div>
            )}
            {variants.map((variant, index) => {
              const expanded = index === expandedVariantIndex;
              const stock = variantStock(variant);
              const variantImages = variant.images ?? [];
              const variantSizes = variant.sizes ?? [];
              return (
                <div
                  key={variant._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <button
                    type="button"
                    onClick={() => handleAccordionToggle(index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="size-6 shrink-0 rounded-full border border-gray-200"
                        style={{ backgroundColor: variant.color || "#94A3B8" }}
                      />
                      <span className="font-medium text-gray-900">
                        {formatColorLabel(variant.color)}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        • {isPublished ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      {!expanded && <span>{stock} Units Total</span>}
                      {expanded ? (
                        <ChevronUp className="size-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="size-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-100 px-5 pb-5">
                      {variantImages.length > 0 ? (
                        <div className="flex gap-3 overflow-x-auto py-4">
                          {variantImages.map((image, imageIndex) => (
                            <button
                              key={`${variant._id}-img-${imageIndex}`}
                              type="button"
                              onClick={() => setSelectedImageIndex(imageIndex)}
                              className={cn(
                                "size-24 shrink-0 overflow-hidden rounded-lg border",
                                selectedImageIndex === imageIndex
                                  ? "border-gray-900"
                                  : "border-gray-200",
                              )}
                            >
                              <img
                                src={image}
                                alt={`${formatColorLabel(variant.color)} image ${imageIndex + 1}`}
                                className="h-full w-full object-cover"
                                onError={(event) => {
                                  (event.target as HTMLImageElement).src = FALLBACK_IMAGE;
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-sm text-gray-500">
                          No images for this variant.
                        </div>
                      )}

                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 text-left text-[11px] font-semibold tracking-[0.08em] text-gray-500">
                            <tr>
                              <th className="px-4 py-3">SIZE</th>
                              <th className="px-4 py-3">IN STOCK</th>
                              <th className="px-4 py-3">MRP</th>
                              <th className="px-4 py-3">SELLING PRICE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {variantSizes.map((size) => {
                              const sizeMrp = Number(size.mrp) || 0;
                              const sizePrice = Number(size.selling_price) || 0;
                              const isLowStock =
                                size.quantity > 0 &&
                                size.quantity < LOW_STOCK_THRESHOLD;
                              return (
                                <tr
                                  key={size._id}
                                  className="border-t border-gray-100"
                                >
                                  <td className="px-4 py-3 font-medium text-gray-900">
                                    {size.size}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={cn(
                                        "inline-flex rounded-full px-2.5 py-1 text-sm",
                                        size.quantity === 0
                                          ? "bg-red-50 text-red-600"
                                          : isLowStock
                                            ? "bg-red-50 text-red-600"
                                            : "text-gray-800",
                                      )}
                                    >
                                      {size.quantity} Units
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-gray-400">
                                    {sizeMrp > 0 && sizeMrp > sizePrice ? (
                                      <span className="line-through">
                                        {formatMoney(sizeMrp)}
                                      </span>
                                    ) : sizeMrp > 0 ? (
                                      formatMoney(sizeMrp)
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-gray-900">
                                    {formatMoney(sizePrice)}
                                  </td>
                                </tr>
                              );
                            })}
                            {variantSizes.length === 0 && (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-4 text-gray-500"
                                >
                                  No sizes for this variant.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      {variant.sku && (
                        <p className="mt-3 text-xs text-gray-400">
                          SKU: {variant.sku}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <ImageSlider images={images} />
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {product.brand && (
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold tracking-wide text-gray-800 uppercase">
                    {product.brand}
                  </span>
                )}
                {product.category && (
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {formatCategory(product.category)}
                  </span>
                )}
                {product.fabric && (
                  <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                    {product.fabric}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                {product.product_name}
              </h2>

              <div className="border-b border-gray-200 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatMoney(sellingPrice)}
                  </span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {formatMoney(mrp)}
                      </span>
                      <Badge className="bg-orange-100 px-2 py-1 text-sm font-semibold text-orange-700 hover:bg-orange-100">
                        {discount}% OFF
                      </Badge>
                    </>
                  )}
                </div>
                {discount > 0 && (
                  <p className="mt-1 text-sm font-medium text-green-600">
                    You save {formatMoney(mrp - sellingPrice)}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">inclusive of all taxes</p>
              </div>

              {variants.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase">
                    Select Color
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant, index) => {
                      const isSelected = index === selectedVariantIndex;
                      return (
                        <button
                          key={variant._id}
                          type="button"
                          onClick={() => handleVariantChange(index)}
                          className={cn(
                            "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all",
                            isSelected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-300 hover:border-gray-400",
                          )}
                          title={formatColorLabel(variant.color)}
                        >
                          <span
                            className="size-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: variant.color || "#94A3B8" }}
                          />
                          {formatColorLabel(variant.color)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase">
                    Select Size
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((size) => {
                      const isSelected = size._id === selectedSize?._id;
                      const disabled = size.quantity === 0;
                      return (
                        <button
                          key={size._id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSelectedSizeId(size._id)}
                          className={cn(
                            "relative rounded-lg border-2 py-3 text-center font-medium transition-all",
                            disabled
                              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
                              : isSelected
                                ? "border-gray-900 bg-gray-50 text-gray-900"
                                : "border-gray-300 text-gray-900 hover:border-gray-400",
                          )}
                        >
                          {size.size}
                          {size.quantity > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-orange-500 text-xs font-semibold text-white">
                              {size.quantity}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <div
                  className={cn(
                    "size-2 rounded-full",
                    isOutOfStock ? "bg-red-500" : "bg-green-500",
                  )}
                />
                <span
                  className={cn(
                    "font-medium",
                    isOutOfStock ? "text-red-600" : "text-green-600",
                  )}
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : (selectedSize?.quantity ?? 0) < LOW_STOCK_THRESHOLD
                      ? `Only ${selectedSize?.quantity} left`
                      : "In Stock"}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  className="h-12 flex-1 bg-pink-600 text-base font-semibold text-white hover:bg-pink-700"
                  disabled={isOutOfStock}
                >
                  <ShoppingBag className="mr-2 size-5" />
                  {selectedSize?.is_cart_active ? "IN BAG" : "ADD TO BAG"}
                </Button>
                <Button
                  variant="outline"
                  className="h-12 px-5 border-2 border-gray-300 hover:border-gray-400"
                >
                  <Heart
                    className={cn(
                      "size-5",
                      selectedSize?.is_wishlist
                        ? "fill-pink-600 text-pink-600"
                        : "text-gray-700",
                    )}
                  />
                </Button>
              </div>

              {selectedVariant?.sku && (
                <p className="text-sm text-gray-500">SKU: {selectedVariant.sku}</p>
              )}

              {product.description && (
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-700 uppercase">
                    Product Details
                  </h4>
                  <div
                    className="product-html-description text-sm text-gray-600 [&_p]:mb-2 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
