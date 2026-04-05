import { useEffect, useRef, useState, useMemo, memo } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { ArrowLeft, Plus, Trash2, Upload, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "@/http/Services/all";
import { showError, showSuccess } from "@/utility/utility";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import ProductPreview from "./ProductPreview";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Undo,
  Link,
  List,
  Underline,
  Font
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
// import Font from '@ckeditor/ckeditor5-font/src/font';

// Available sizes for selection
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

// Category to Sub-Category mapping
const CATEGORY_SUBCATEGORY_MAP: Record<string, string[]> = {
  Lehenga: ["Bridal Lehenga", "Sider Lehenga"],
  "Rajputi Poshak": [
    "Bridal one poshak",
    "Bridal one High poshak",
    "Bridal poshak",
  ],
  Saree: ["Ethik saree", "Leven saree", "Govan cortan"],
};

// Image validation constants
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"] as const;
const ALLOWED_IMAGE_ACCEPT = ".jpg,.jpeg,.png";

// Validation function
function validateImageFile(
  file: File,
): { valid: true } | { valid: false; error: string } {
  if (
    !ALLOWED_IMAGE_TYPES.includes(
      file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    )
  ) {
    return {
      valid: false,
      error: `Invalid file type "${file.name}". Only JPG, JPEG, and PNG images are allowed.`,
    };
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is 5 MB.`,
    };
  }
  return { valid: true };
}

// Types
interface ProductVariant {
  id: string;
  color: string;
  sellingPrice: string;
  mrp: string;
  sizes: Record<string, { selected: boolean; stock: string }>;
  images: string[];
  sizeDetails?: string; // For Saree category - description of size
}

interface ProductApiResponse {
  _id: string;
  name: string;
  slug?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  pattern?: string;
  sleeveType?: string;
  fabric?: string;
  neckType?: string;
  description?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  avgPrice: number;
  totalStock: number;
  allImages: string[];
  allColors: string[];
  allSizes: string[];
  variants: Array<{
    variantId: string;
    color: string;
    sellingPrice: number;
    mrp: number;
    sizes: Array<{
      size: string;
      stock: number;
    }>;
    images: string[];
    sizeDetails?: string;
  }>;
  averageRating?: number;
  totalReviews?: number;
  reviews?: unknown[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

// Image upload status
interface ImageUploadStatus {
  file: File;
  status: "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

// Helper to generate SKU
const generateSKU = (
  productName: string,
  color: string,
  size: string,
): string => {
  const prefix =
    productName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
      .slice(0, 3) || "PRD";
  const colorCode = color.slice(0, 3).toUpperCase();
  const sizeCode = size.toUpperCase();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${colorCode}-${sizeCode}-${random}`;
};

// Memoized variant card component for performance
const VariantCard = memo(
  ({
    variant,
    index,
    productName,
    category,
    onUpdate,
    onRemove,
    onMultipleImagesUpload,
    onImageRemove,
    uploadingImages,
  }: {
    variant: ProductVariant;
    index: number;
    productName: string;
    category: string;
    onUpdate: (id: string, updates: Partial<ProductVariant>) => void;
    onRemove: (id: string) => void;
    onMultipleImagesUpload: (
      variantId: string,
      files: FileList,
    ) => Promise<void>;
    onImageRemove: (variantId: string, imageIndex: number) => void;
    uploadingImages: Record<string, ImageUploadStatus[]>;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [colorError, setColorError] = useState("");
    const [priceError, setPriceError] = useState("");

    const calculateDiscount = useMemo(() => {
      const selling = parseFloat(variant.sellingPrice) || 0;
      const mrp = parseFloat(variant.mrp) || 0;
      if (mrp <= 0 || selling >= mrp) return 0;
      return Math.round(((mrp - selling) / mrp) * 100);
    }, [variant.sellingPrice, variant.mrp]);

    const autoGeneratedSKUs = useMemo(() => {
      return Object.entries(variant.sizes)
        .filter(([, data]) => data.selected)
        .map(([size]) => ({
          size,
          sku: generateSKU(productName, variant.color, size),
        }));
    }, [variant.sizes, variant.color, productName]);

    const handleColorChange = (value: string) => {
      if (!value.trim()) {
        setColorError("Color is required");
      } else {
        setColorError("");
      }
      onUpdate(variant.id, { color: value });
    };

    const handlePriceChange = (
      field: "sellingPrice" | "mrp",
      value: string,
    ) => {
      const numValue = parseFloat(value) || 0;
      if (
        field === "sellingPrice" &&
        variant.mrp &&
        numValue >= parseFloat(variant.mrp)
      ) {
        setPriceError("Selling price must be less than MRP");
      } else {
        setPriceError("");
      }
      onUpdate(variant.id, { [field]: value });
    };

    const handleSizeToggle = (size: string) => {
      const newSizes = {
        ...variant.sizes,
        [size]: {
          ...variant.sizes[size],
          selected: !variant.sizes[size]?.selected,
        },
      };
      onUpdate(variant.id, { sizes: newSizes });
    };

    const handleStockChange = (size: string, stock: string) => {
      const newSizes = {
        ...variant.sizes,
        [size]: {
          ...variant.sizes[size],
          stock,
        },
      };
      onUpdate(variant.id, { sizes: newSizes });
    };

    const selectedSizes = Object.entries(variant.sizes).filter(
      ([, data]) => data.selected,
    );
    const totalStock = selectedSizes.reduce(
      (sum, [, data]) => sum + (parseInt(data.stock) || 0),
      0,
    );

    const currentUploadStatuses = uploadingImages[variant.id] || [];
    const hasUploadingImages = currentUploadStatuses.some(
      (status) => status.status === "uploading",
    );

    return (
      <Card className="p-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-semibold text-sm">
              {index + 1}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {variant.color || "New Variant"}{" "}
                {selectedSizes.length > 0 && (
                  <span className="text-gray-500 font-normal text-xs">
                    — {selectedSizes.map(([size]) => size).join(", ")}
                  </span>
                )}
              </h3>
              {calculateDiscount > 0 && (
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900">
                    ₹{variant.sellingPrice || "0"}
                  </span>
                  <span className="text-xs text-gray-400 line-through">
                    ₹{variant.mrp || "0"}
                  </span>
                  <span className="text-xs font-semibold text-green-600">
                    ({calculateDiscount}% OFF)
                  </span>
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onRemove(variant.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {/* Color */}
          <div className="space-y-1">
            <FieldLabel className="text-xs">
              Color <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              placeholder="Red"
              value={variant.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className={cn("h-8 text-sm", colorError && "border-red-500")}
            />
            {colorError && <p className="text-xs text-red-500">{colorError}</p>}
          </div>

          {/* Selling Price */}
          <div className="space-y-1">
            <FieldLabel className="text-xs">
              Selling Price (₹) <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              type="number"
              placeholder="400"
              value={variant.sellingPrice}
              onChange={(e) =>
                handlePriceChange("sellingPrice", e.target.value)
              }
              className={cn("h-8 text-sm", priceError && "border-red-500")}
            />
          </div>

          {/* MRP */}
          <div className="space-y-1">
            <FieldLabel className="text-xs">
              MRP (₹) <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              type="number"
              placeholder="1200"
              value={variant.mrp}
              onChange={(e) => handlePriceChange("mrp", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        {priceError && (
          <p className="text-xs text-red-500 -mt-2 mb-2">{priceError}</p>
        )}

        {/* Discount Display */}
        {calculateDiscount > 0 && (
          <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-green-700">
                  ₹{variant.sellingPrice}
                </span>
                <span className="ml-2 text-xs text-gray-500 line-through">
                  ₹{variant.mrp}
                </span>
                <span className="ml-2 text-xs font-semibold text-green-600">
                  ({calculateDiscount}% OFF)
                </span>
              </div>
              <div className="text-xs text-gray-600">
                Total stock:{" "}
                <span className="font-semibold text-gray-900">
                  {totalStock}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sizes Selection - Hide for Saree category */}
        {category !== "Saree" ? (
          <div className="space-y-2 mb-3">
            <FieldLabel className="text-xs">
              Sizes <span className="text-red-500">*</span>
            </FieldLabel>
            <p className="text-xs text-gray-600">
              Select sizes and set stock for each
            </p>
            <div className="flex gap-2 flex-wrap">
              {AVAILABLE_SIZES.map((size) => (
                <Button
                  key={size}
                  type="button"
                  variant="outline"
                  className={cn(
                    "h-8 px-4 border-2 transition-colors font-medium text-sm",
                    variant.sizes[size]?.selected
                      ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
                  )}
                  onClick={() => handleSizeToggle(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2 mb-3">
            <FieldLabel className="text-xs">Size</FieldLabel>
            <div className="inline-flex items-center px-4 py-2 border-2 border-pink-500 rounded-full text-pink-600 font-semibold text-sm">
              Onesize
            </div>
            <div className="mt-3">
              <FieldLabel className="text-xs mb-2">Size Details (Optional)</FieldLabel>
              <textarea
                placeholder="E.g., Length: 5.5 metres plus 0.8 metre blouse piece&#10;Width: 1.06 metres (approx.)"
                value={variant.sizeDetails || ""}
                onChange={(e) => onUpdate(variant.id, { sizeDetails: e.target.value })}
                className="w-full h-20 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* Stock per Size - For Saree, show single stock input */}
        {category === "Saree" ? (
          <div className="space-y-2 mb-3">
            <FieldLabel className="text-xs">
              Stock <span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={variant.sizes["ONE_SIZE"]?.stock || ""}
              onChange={(e) => handleStockChange("ONE_SIZE", e.target.value)}
              className="h-8 text-sm w-full"
            />
          </div>
        ) : (
          selectedSizes.length > 0 && (
            <div className="space-y-2 mb-3">
              <FieldLabel className="text-xs">
                Stock per Size <span className="text-red-500">*</span>
              </FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {selectedSizes.map(([size, data]) => (
                  <div key={size} className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">
                      {size}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={data.stock}
                      onChange={(e) => handleStockChange(size, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Auto-generated SKUs */}
        {autoGeneratedSKUs.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">
              AUTO-GENERATED SKUS
            </h4>
            <div className="flex gap-2 flex-wrap">
              {autoGeneratedSKUs.map(({ sku }) => (
                <span
                  key={sku}
                  className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-mono rounded"
                >
                  {sku}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Product Images */}
        <div className="space-y-2">
          <FieldLabel className="text-xs">
            Product Images <span className="text-red-500">*</span>
          </FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onMultipleImagesUpload(variant.id, files);
              }
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />

          <div className="grid grid-cols-5 gap-2">
            {/* Existing Images */}
            {variant.images.map((image, imgIndex) => (
              <div
                key={`img-${imgIndex}`}
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
              >
                <img
                  src={image}
                  alt={`Variant ${index + 1} - Image ${imgIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onImageRemove(variant.id, imgIndex)}
                  className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Uploading Images */}
            {currentUploadStatuses.map((status, idx) => (
              <div
                key={`upload-${idx}`}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center"
              >
                {status.status === "uploading" && (
                  <div className="flex flex-col items-center gap-1">
                    <Spinner className="w-5 h-5 text-blue-600" />
                    <span className="text-xs text-gray-600">Uploading...</span>
                  </div>
                )}
                {status.status === "error" && (
                  <div className="p-1 text-center">
                    <X className="w-4 h-4 text-red-600 mx-auto mb-0.5" />
                    <span className="text-xs text-red-600 line-clamp-2">
                      {status.error}
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={hasUploadingImages}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center transition-colors",
                hasUploadingImages
                  ? "border-gray-300 cursor-not-allowed opacity-50"
                  : "border-gray-400 hover:border-pink-500 hover:bg-pink-50 cursor-pointer",
              )}
            >
              <Upload className="w-5 h-5 text-gray-400 mb-0.5" />
              <span className="text-xs text-gray-500">Add</span>
            </button>
          </div>

          {variant.images.length === 0 &&
            currentUploadStatuses.length === 0 && (
              <p className="text-xs text-red-500">
                At least one image is required
              </p>
            )}
        </div>
      </Card>
    );
  },
);

VariantCard.displayName = "VariantCard";

const AddEditProductPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [hasPopulatedForm, setHasPopulatedForm] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");

  // Form state
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: crypto.randomUUID(),
      color: "",
      sellingPrice: "",
      mrp: "",
      sizes: {},
      images: [],
    },
  ]);
  const [uploadingImages, setUploadingImages] = useState<
    Record<string, ImageUploadStatus[]>
  >({});
  const [description, setDescription] = useState("");

  // Fetch product by ID when editing
  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await getProductById(id!);
      console.log('res: ', res);
      return (res as { data?: ProductApiResponse }).data ?? res;
    },
    enabled: isEditMode && Boolean(id),
    staleTime: 1000 * 60 * 5,
  });
  const product = productResponse as ProductApiResponse | undefined;

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      showSuccess("Product created successfully");
      navigate("/products");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      showError(error?.response?.data?.message ?? "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id: productId,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => updateProduct(productId, payload),
    onSuccess: () => {
      showSuccess("Product updated successfully");
      navigate("/products");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      showError(error?.response?.data?.message ?? "Failed to update product");
    },
  });

  const mutation = isEditMode ? updateMutation : createMutation;

  const form = useForm({
    defaultValues: {
      productName: "",
      brand: "",
      category: "",
      subCategory: "",
      pattern: "",
      sleeveType: "",
      fabric: "",
      neckType: "",
      description: "",
      variants: [] as ProductVariant[],
    },
    onSubmit: async ({ value }) => {
      // Validate description
      if (!description || description.trim() === "") {
        showError("Description is required");
        setDescriptionError("Description is required");
        return;
      }

      // Validate brand
      if (!value.brand || value.brand.trim() === "") {
        showError("Brand is required");
        return;
      }

      // Validate pattern
      if (!value.pattern || value.pattern.trim() === "") {
        showError("Pattern is required");
        return;
      }

      // Validate fabric
      if (!value.fabric || value.fabric.trim() === "") {
        showError("Fabric is required");
        return;
      }

      // Validate neck type (not required for Saree)
      if (value.category !== "Saree") {
        if (!value.neckType || value.neckType.trim() === "") {
          showError("Neck Type is required");
          return;
        }

        // Validate sleeve type (not required for Saree)
        if (!value.sleeveType || value.sleeveType.trim() === "") {
          showError("Sleeve Type is required");
          return;
        }
      }

      // Validate variants
      if (variants.length === 0) {
        showError("At least one variant is required");
        return;
      }

      const isSareeCategory = value.category === "Saree";

      for (const variant of variants) {
        if (!variant.color.trim()) {
          showError("All variants must have a color");
          return;
        }
        if (!variant.sellingPrice || parseFloat(variant.sellingPrice) <= 0) {
          showError("All variants must have a valid selling price");
          return;
        }
        if (!variant.mrp || parseFloat(variant.mrp) <= 0) {
          showError("All variants must have a valid MRP");
          return;
        }
        if (variant.images.length === 0) {
          showError(`Variant "${variant.color}" must have at least one image`);
          return;
        }
        
        // For Saree category, validate ONE_SIZE stock
        if (isSareeCategory) {
          const oneSize = variant.sizes["ONE_SIZE"];
          if (!oneSize || !oneSize.stock || parseInt(oneSize.stock) < 0) {
            showError(`Variant "${variant.color}" must have valid stock`);
            return;
          }
        } else {
          // For other categories, validate selected sizes
          const selectedSizes = Object.entries(variant.sizes).filter(
            ([, data]) => data.selected,
          );
          if (selectedSizes.length === 0) {
            showError(
              `Variant "${variant.color}" must have at least one size selected`,
            );
            return;
          }
          // Validate stock for selected sizes
          for (const [size, data] of selectedSizes) {
            if (!data.stock || parseInt(data.stock) < 0) {
              showError(
                `Variant "${variant.color}" size ${size} must have valid stock`,
              );
              return;
            }
          }
        }
      }

      // Prepare payload
      const allImages = variants.flatMap((v) => v.images);
      const allColors = variants.map((v) => v.color);
      
      // For Saree category, use "ONE SIZE", otherwise collect selected sizes
      const allSizes = isSareeCategory
        ? ["ONE SIZE"]
        : Array.from(
            new Set(
              variants.flatMap((v) =>
                Object.entries(v.sizes)
                  .filter(([, data]) => data.selected)
                  .map(([size]) => size),
              ),
            ),
          );

      // Calculate average price
      const avgPrice =
        variants.reduce(
          (sum, v) => sum + parseFloat(v.sellingPrice || "0"),
          0,
        ) / variants.length;

      // Calculate total stock
      const totalStock = variants.reduce((sum, v) => {
        return (
          sum +
          Object.entries(v.sizes)
          .filter(([, data]) => data.selected)
          .reduce((vSum, [, data]) => vSum + (parseInt(data.stock) || 0), 0)
        );
      }, 0);
      
      console.log('variants: ', variants);
      const formData = {
        ...value,
        description: description,
        variants: variants,
        allImages,
        allColors,
        allSizes,
        avgPrice,
        totalStock,
        subCategory: value.subCategory || undefined, // Include subCategory
      };

      // Console log form values
      console.log("=== FORM SUBMISSION ===");
      console.log("Form Values:", formData);
      console.log("======================");

      if (isEditMode && id) {
        const updatePayload = {
          name: value.productName,
          price: avgPrice,
          stock: totalStock,
          sizes: allSizes,
          images: allImages,
          colors: allColors,
          description: description,
          category: value.category,
          subCategory: value.subCategory || undefined,
          brand: value.brand,
          pattern: value.pattern,
          fabric: value.fabric,
          neckType: value.neckType || undefined,
          sleeveType: value.sleeveType || undefined,
          variants: variants, // Include variants array
          allImages,
          allColors,
          allSizes,
          avgPrice,
          totalStock,
          isActive: true,
        };
        console.log('updatePayload: ', updatePayload);
        updateMutation.mutate({ id, payload: updatePayload });
      } else {
        const createPayload = {
          productName: value.productName,
          brand: value.brand,
          category: value.category,
          subCategory: value.subCategory || undefined,
          pattern: value.pattern,
          fabric: value.fabric,
          neckType: value.neckType || undefined,
          sleeveType: value.sleeveType || undefined,
          description: description,
          variants: variants, // Include variants array
          images: allImages,
          colors: allColors,
          sizes: allSizes,
          allImages,
          allColors,
          allSizes,
          price: avgPrice,
          avgPrice,
          stockCount: totalStock,
          totalStock,
        };
        console.log('createPayload: ', createPayload);
        createMutation.mutate(createPayload);
      }
    },
  });

  // Variant handlers
  const addVariant = () => {
    const isSareeCategory = form.state.values.category === "Saree";
    const initialSizes: Record<string, { selected: boolean; stock: string }> = isSareeCategory
      ? { ONE_SIZE: { selected: true, stock: "" } }
      : {};
    
    const newVariant: ProductVariant = {
      id: crypto.randomUUID(),
      color: "",
      sellingPrice: "",
      mrp: "",
      sizes: initialSizes,
      images: [],
      sizeDetails: isSareeCategory ? "" : undefined,
    };
      
    setVariants([...variants, newVariant]);
  };

  const updateVariant = (id: string, updates: Partial<ProductVariant>) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const handleMultipleImagesUpload = async (
    variantId: string,
    files: FileList,
  ) => {
    const filesArray = Array.from(files);

    // Initialize upload statuses
    const initialStatuses: ImageUploadStatus[] = filesArray.map((file) => ({
      file,
      status: "uploading",
    }));

    setUploadingImages((prev) => ({
      ...prev,
      [variantId]: [...(prev[variantId] || []), ...initialStatuses],
    }));

    // Upload all files in order
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const validation = validateImageFile(file);

      if (!validation.valid) {
        // Update status to error
        setUploadingImages((prev) => {
          const updated = [...(prev[variantId] || [])];
          const statusIndex = updated.findIndex(
            (s) => s.file === file && s.status === "uploading",
          );
          if (statusIndex !== -1) {
            updated[statusIndex] = {
              ...updated[statusIndex],
              status: "error",
              error: validation.error,
            };
          }
          return { ...prev, [variantId]: updated };
        });

        // Remove error status after 5 seconds
        setTimeout(() => {
          setUploadingImages((prev) => ({
            ...prev,
            [variantId]: (prev[variantId] || []).filter((s) => s.file !== file),
          }));
        }, 5000);

        continue;
      }

      try {
        const data = await uploadImageToCloudinary(file);

        // Update status to success and add image to variant
        setVariants((prev) =>
          prev.map((v) =>
            v.id === variantId
              ? { ...v, images: [...v.images, data.secure_url] }
              : v,
          ),
        );

        // Remove success status
        setUploadingImages((prev) => ({
          ...prev,
          [variantId]: (prev[variantId] || []).filter((s) => s.file !== file),
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Image upload failed";

        // Update status to error
        setUploadingImages((prev) => {
          const updated = [...(prev[variantId] || [])];
          const statusIndex = updated.findIndex(
            (s) => s.file === file && s.status === "uploading",
          );
          if (statusIndex !== -1) {
            updated[statusIndex] = {
              ...updated[statusIndex],
              status: "error",
              error: message,
            };
          }
          return { ...prev, [variantId]: updated };
        });

        // Remove error status after 5 seconds
        setTimeout(() => {
          setUploadingImages((prev) => ({
            ...prev,
            [variantId]: (prev[variantId] || []).filter((s) => s.file !== file),
          }));
        }, 5000);
      }
    }
  };

  const handleImageRemove = (variantId: string, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? { ...v, images: v.images.filter((_, i) => i !== imageIndex) }
          : v,
      ),
    );
  };

  // Populate form in edit mode
  useEffect(() => {
    if (!product || hasPopulatedForm || !isEditMode) return;
    
    console.log("🔵 Starting form population with product data:", product);
    
    // Transform API response variants to internal format
    const transformedVariants: ProductVariant[] = product.variants.map((apiVariant, idx) => {
      console.log(`🔵 Transforming variant ${idx + 1}:`, apiVariant);
      
      // Transform sizes array to sizes object
      const sizesObject = apiVariant.sizes.reduce((acc, sizeItem) => {
        console.log(`  ✓ Adding size: ${sizeItem.size} with stock: ${sizeItem.stock}`);
        return {
          ...acc,
          [sizeItem.size]: {
            selected: true,
            stock: sizeItem.stock.toString(),
          },
        };
      }, {} as Record<string, { selected: boolean; stock: string }>);
      
      console.log(`  🔵 Sizes object for variant ${idx + 1}:`, sizesObject);
      
      return {
        id: apiVariant.variantId,
        color: apiVariant.color,
        sellingPrice: apiVariant.sellingPrice.toString(),
        mrp: apiVariant.mrp.toString(),
        sizes: sizesObject,
        images: apiVariant.images,
        sizeDetails: apiVariant.sizeDetails,
      };
    });
    
    console.log("🔵 All transformed variants:", transformedVariants);
    console.log("🔵 Transformed variants count:", transformedVariants.length);
    
    const formValues = {
      productName: product.name ?? "",
      brand: product.brand ?? "",
      category: product.category ?? "",
      subCategory: product.subCategory ?? "",
      pattern: product.pattern ?? "",
      sleeveType: product.sleeveType ?? "",
      fabric: product.fabric ?? "",
      neckType: product.neckType ?? "",
      description: product.description ?? "",
      variants: [],
    };
    
    console.log("🔵 Form values to set:", formValues);
    
    // Set variants FIRST before setting category to prevent category change effect from resetting them
    setVariants(transformedVariants);
    console.log("✅ Variants set in state");
    
    // Then set form values
    form.setFieldValue("productName", formValues.productName);
    form.setFieldValue("brand", formValues.brand);
    form.setFieldValue("pattern", formValues.pattern);
    form.setFieldValue("sleeveType", formValues.sleeveType);
    form.setFieldValue("fabric", formValues.fabric);
    form.setFieldValue("neckType", formValues.neckType);
    
    setDescription(product.description ?? "");
    
    // Set category and subCategory LAST to prevent triggering category change effect prematurely
    form.setFieldValue("subCategory", formValues.subCategory);
    form.setFieldValue("category", formValues.category);
    
    // Mark as populated AFTER setting category
    setTimeout(() => {
      setHasPopulatedForm(true);
      console.log("✅ Form population complete - hasPopulatedForm set to true");
    }, 100);
  }, [product, hasPopulatedForm, isEditMode, form]);

  // Update variants when category changes to/from Saree
  useEffect(() => {
    const currentCategory = form.state.values.category;
    
    console.log("🔶 Category change effect triggered:", {
      category: currentCategory,
      isEditMode,
      hasPopulatedForm,
      variantsCount: variants.length
    });
    
    // Skip in edit mode until form is fully populated
    if (isEditMode && !hasPopulatedForm) {
      console.log("⏭️ Skipping category change - edit mode not populated yet");
      return;
    }
    
    if (!currentCategory) {
      // If no category selected, reset variants to initial state (only in create mode)
      if (!isEditMode) {
        console.log("🔶 No category - resetting variants (create mode)");
        setVariants([
          {
            id: crypto.randomUUID(),
            color: "",
            sellingPrice: "",
            mrp: "",
            sizes: {},
            images: [],
          },
        ]);
      }
      return;
    }
    
    const isSareeCategory = currentCategory === "Saree";
    console.log("🔶 Category is Saree?", isSareeCategory);
    
    setVariants(prevVariants => {
      console.log("🔶 Previous variants before transformation:", prevVariants);
      
      // If no variants exist, create one with appropriate structure
      if (prevVariants.length === 0) {
        console.log("🔶 No variants - creating new one");
        const sizes: Record<string, { selected: boolean; stock: string }> = isSareeCategory
          ? { ONE_SIZE: { selected: true, stock: "" } }
          : {};
        return [{
          id: crypto.randomUUID(),
          color: "",
          sellingPrice: "",
          mrp: "",
          sizes,
          images: [],
          sizeDetails: isSareeCategory ? "" : undefined,
        }];
      }
      
      // In edit mode with populated form, preserve existing variant data
      if (isEditMode && hasPopulatedForm) {
        console.log("✅ Edit mode with populated form - preserving variant sizes");
        // Only convert if user is actively changing category (not on initial load)
        // For now, preserve the loaded data
        return prevVariants;
      }
      
      // In create mode or when user manually changes category, apply transformations
      console.log("🔶 Applying category-based transformations");
      return prevVariants.map(variant => {
        if (isSareeCategory) {
          // Convert to ONE_SIZE for Saree category
          const sizes: Record<string, { selected: boolean; stock: string }> = { 
            ONE_SIZE: { selected: true, stock: "" } 
          };
          const newVariant: ProductVariant = {
            ...variant,
            sizes,
            sizeDetails: variant.sizeDetails || "",
          };
          return newVariant;
        } else {
          // For non-Saree, keep existing sizes in edit mode, reset in create mode
          if (isEditMode) {
            return variant; // Preserve sizes
          }
          const sizes: Record<string, { selected: boolean; stock: string }> = {};
          const newVariant: ProductVariant = {
            ...variant,
            sizes,
          };
          delete newVariant.sizeDetails;
          return newVariant;
        }
      });
    });
  }, [form.state.values.category, hasPopulatedForm, isEditMode, variants.length]);

  if (isEditMode && (isLoadingProduct || (product && !hasPopulatedForm))) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-gray-600">Loading product data...</p>
          <p className="text-xs text-gray-500">Please wait while we fetch the product details</p>
        </div>
      </div>
    );
  }

  if (isEditMode && isProductError) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Failed to Load Product</h3>
                <p className="text-red-600 text-sm">
                  {(productError as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Unable to fetch product data. The product may not exist or there was a network error."}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4">
          {/* Left Side - Form */}
          <div className="space-y-4">
            {/* Product Details Card */}
            <Card className="p-4 bg-white">
              <h2 className="text-base font-semibold text-gray-900 mb-3">
                Product Details
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <FieldGroup className="space-y-3">
                  {/* Product Name and Brand */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <form.Field
                        name="productName"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Product name is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor="productName"
                                className="text-xs"
                              >
                                Product Name{" "}
                                <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Input
                                id="productName"
                                placeholder="Parika"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                className="h-8 text-sm"
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                    <div className="space-y-1">
                      <form.Field
                        name="brand"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Brand is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="brand" className="text-xs">
                                Brand <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Input
                                id="brand"
                                placeholder="test"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                onBlur={field.handleBlur}
                                className="h-8 text-sm"
                              />
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                  </div>

                  {/* Category and Sub-Category */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <form.Field
                        name="category"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Category is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor="category"
                                className="text-xs"
                              >
                                Category <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                  field.handleBlur();
                                  // Reset sub-category when category changes
                                  form.setFieldValue("subCategory", "");
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Lehenga">Lehenga</SelectItem>
                                  <SelectItem value="Rajputi Poshak">Rajputi Poshak</SelectItem>
                                  <SelectItem value="Saree">Saree</SelectItem>
                                </SelectContent>
                              </Select>
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                    <div className="space-y-1">
                      <form.Field name="subCategory">
                        {(field) => {
                          const selectedCategory = form.state.values.category;
                          const subCategories = selectedCategory
                            ? CATEGORY_SUBCATEGORY_MAP[selectedCategory] || []
                            : [];
                          const hasSubCategories = subCategories.length > 0;

                          return (
                            <Field>
                              <FieldLabel
                                htmlFor="subCategory"
                                className="text-xs"
                              >
                                Sub Category (Optional)
                              </FieldLabel>
                              <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                  field.handleBlur();
                                }}
                                disabled={!hasSubCategories}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue 
                                    placeholder={
                                      hasSubCategories
                                        ? "Select sub-category"
                                        : "Select category first"
                                    } 
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {subCategories.map((subCat) => (
                                    <SelectItem key={subCat} value={subCat}>
                                      {subCat}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                  </div>

                  {/* Pattern */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <form.Field
                        name="pattern"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Pattern is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="pattern" className="text-xs">
                                Pattern <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                  field.handleBlur();
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="solid">Solid</SelectItem>
                                  <SelectItem value="printed">
                                    Printed
                                  </SelectItem>
                                  <SelectItem value="embroidered">
                                    Embroidered
                                  </SelectItem>
                                  <SelectItem value="striped">
                                    Striped
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                  </div>

                  {/* Fabric and Neck Type */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <form.Field
                        name="fabric"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Fabric is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel htmlFor="fabric" className="text-xs">
                                Fabric <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                  field.handleBlur();
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select fabric" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cotton">Cotton</SelectItem>
                                  <SelectItem value="silk">Silk</SelectItem>
                                  <SelectItem value="georgette">
                                    Georgette
                                  </SelectItem>
                                  <SelectItem value="chiffon">
                                    Chiffon
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                    
                    {/* Neck Type - Hide for Saree category */}
                    {form.state.values.category !== "Saree" && (
                      <div className="space-y-1">
                        <form.Field
                          name="neckType"
                          validators={{
                            onChange: z
                              .string()
                              .min(1, "Neck Type is required")
                              .trim(),
                          }}
                        >
                          {(field) => {
                            const isInvalid =
                              field.state.meta.isTouched &&
                              field.state.meta.errors.length > 0;
                            return (
                              <Field data-invalid={isInvalid}>
                                <FieldLabel
                                  htmlFor="neckType"
                                  className="text-xs"
                                >
                                  Neck Type{" "}
                                  <span className="text-red-500">*</span>
                                </FieldLabel>
                                <Select
                                  value={field.state.value}
                                  onValueChange={(value) => {
                                    field.handleChange(value);
                                    field.handleBlur();
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Select neck type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="v-neck">V-Neck</SelectItem>
                                    <SelectItem value="round">Round</SelectItem>
                                    <SelectItem value="collar">Collar</SelectItem>
                                    <SelectItem value="boat">Boat</SelectItem>
                                  </SelectContent>
                                </Select>
                                {isInvalid && (
                                  <FieldError
                                    errors={field.state.meta.errors.map((err) =>
                                      typeof err === "string"
                                        ? { message: err }
                                        : err,
                                    )}
                                  />
                                )}
                              </Field>
                            );
                          }}
                        </form.Field>
                      </div>
                    )}
                  </div>

                  {/* Sleeve Type - Hide for Saree category */}
                  {form.state.values.category !== "Saree" && (
                    <div className="space-y-1">
                      <form.Field
                        name="sleeveType"
                        validators={{
                          onChange: z
                            .string()
                            .min(1, "Sleeve Type is required")
                            .trim(),
                        }}
                      >
                        {(field) => {
                          const isInvalid =
                            field.state.meta.isTouched &&
                            field.state.meta.errors.length > 0;
                          return (
                            <Field data-invalid={isInvalid}>
                              <FieldLabel
                                htmlFor="sleeveType"
                                className="text-xs"
                              >
                                Sleeve Type{" "}
                                <span className="text-red-500">*</span>
                              </FieldLabel>
                              <Select
                                value={field.state.value}
                                onValueChange={(value) => {
                                  field.handleChange(value);
                                  field.handleBlur();
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm">
                                  <SelectValue placeholder="Select sleeve type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="half-sleeve">
                                    Half Sleeve
                                  </SelectItem>
                                  <SelectItem value="full-sleeve">
                                    Full Sleeve
                                  </SelectItem>
                                  <SelectItem value="sleeveless">
                                    Sleeveless
                                  </SelectItem>
                                  <SelectItem value="3/4-sleeve">
                                    3/4 Sleeve
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              {isInvalid && (
                                <FieldError
                                  errors={field.state.meta.errors.map((err) =>
                                    typeof err === "string"
                                      ? { message: err }
                                      : err,
                                  )}
                                />
                              )}
                            </Field>
                          );
                        }}
                      </form.Field>
                    </div>
                  )}

                  {/* Description with CKEditor */}
                  <div className="space-y-1">
                    <FieldLabel htmlFor="description" className="text-xs">
                      Description <span className="text-red-500">*</span>
                    </FieldLabel>
                    <div
                      className={cn(
                        "border rounded-lg overflow-hidden min-h-[180px]",
                        descriptionError ? "border-red-500" : "border-gray-300",
                      )}
                    >
                      <CKEditor
                        editor={ClassicEditor}
                        config={{
                          licenseKey: "GPL",
                          plugins: [
                            Essentials,
                            Bold,
                            Italic,
                            Paragraph,
                            Link,
                            List,
                            Undo,
                            Underline,
                            Font
                          ],
                          toolbar: [
                            "undo",
                            "redo",
                            "|",
                            "bold",
                            "italic",
                            "underline",
                            "|",
                            "bulletedList",
                            "numberedList",
                            "|",
                            "link",
                            "fontColor",
                            "fontBackgroundColor"
                          ],
                          placeholder: "Enter product description...",
                        }}
                        data={description}
                        onChange={(
                          _event: unknown,
                          editor: { getData: () => string },
                        ) => {
                          const data = editor.getData();
                          setDescription(data);
                          if (data && data.trim()) {
                            setDescriptionError("");
                          }
                        }}
                      />
                    </div>
                    {descriptionError && (
                      <p className="text-xs text-red-500">{descriptionError}</p>
                    )}
                  </div>
                </FieldGroup>
              </form>
            </Card>

            {/* Variants Section - Only show after category selection */}
            {form.state.values.category && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Variants ({variants.length})
                  </h2>
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-white hover:bg-gray-50 text-pink-600 border-pink-300 h-8 text-sm"
                    onClick={addVariant}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Add Variant
                  </Button>
                </div>

                {variants.map((variant, index) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    index={index}
                    productName={form.state.values.productName}
                    category={form.state.values.category}
                    onUpdate={updateVariant}
                    onRemove={removeVariant}
                    onMultipleImagesUpload={handleMultipleImagesUpload}
                    onImageRemove={handleImageRemove}
                    uploadingImages={uploadingImages}
                  />
                ))}
              </div>
            )}

            {/* Show message when no category selected */}
            {!form.state.values.category && (
              <Card className="p-8 bg-gray-50 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Select a Category First
                  </h3>
                  <p className="text-xs text-gray-500">
                    Please select a category above to start adding product variants
                  </p>
                </div>
              </Card>
            )}

            {/* Save Product Button (bottom) */}
            <Card className="p-4 bg-white flex justify-end">
              <Button
                type="button"
                onClick={() => form.handleSubmit()}
                disabled={mutation.isPending}
                className="bg-pink-600 hover:bg-pink-700 text-white px-8 h-9 text-sm"
              >
                {mutation.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" />
                    Saving...
                  </>
                ) : (
                  "Save Product"
                )}
              </Button>
            </Card>
          </div>

          {/* Right Side - Live Preview */}
          <div className="hidden lg:block">
            <ProductPreview
              productName={form.state.values.productName}
              brand={form.state.values.brand}
              category={form.state.values.category}
              subCategory={form.state.values.subCategory}
              description={description}
              variants={variants}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditProductPage;
