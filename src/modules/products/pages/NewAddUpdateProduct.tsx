import { lazy, memo, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Eye,
  CircleAlert,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "@/http/Services/all";
import { showError, showSuccess } from "@/utility/utility";
import { uploadImageToCloudinary } from "@/lib/cloudinary";
import ProductPreview from "./ProductPreview";

const ProductDescriptionEditor = lazy(
  () => import("@/components/editor/ProductDescriptionEditor"),
);

type CategorySlug =
  | "lehenga"
  | "saree"
  | "rajputi-poshak"
  | "bridal-lehenga"
  | "banarasi-saree";

const CATEGORY_OPTIONS: { value: CategorySlug; label: string }[] = [
  { value: "saree", label: "Saree" },
  { value: "banarasi-saree", label: "Banarasi Saree" },
  { value: "lehenga", label: "Lehenga" },
  { value: "bridal-lehenga", label: "Bridal Lehenga" },
  { value: "rajputi-poshak", label: "Rajputi Poshak" },
];

const LEHENGA_BRANDS = [
  "Sabyasachi",
  "Manish Malhotra",
  "Anita Dongre",
  "Tarun Tahiliani",
  "Falguni Shane Peacock",
  "Shyamal & Bhumika",
  "Seema Thukral",
  "Kalki Fashion",
  "Frontier Raas",
  "Aza Fashions",
] as const;

const SAREE_BRANDS = [
  "Sabyasachi",
  "Manish Malhotra",
  "Anita Dongre",
  "Tarun Tahiliani",
  "Raw Mango",
  "Ekaya",
  "Nalli",
  "Kalanjali",
  "Tilfi",
  "Katan Weaves",
  "Meena Bazaar",
  "Taneira",
  "Fabindia",
  "House of Masaba",
  "Good Earth",
] as const;

const FABRIC_OPTIONS = [
  "Banarasi Silk",
  "Kanjeevaram Silk",
  "Tussar Silk",
  "Raw Silk",
  "Art Silk",
  "Chanderi Silk",
  "Organza",
  "Organza Silk",
  "Georgette",
  "Chiffon",
  "Crepe",
  "Satin",
  "Net",
  "Tissue",
  "Velvet",
  "Brocade",
  "Jacquard",
  "Linen",
  "Cotton",
  "Chanderi",
  "Maheshwari",
  "Ikat",
  "Khadi",
  "Mulmul",
  "Dola Silk",
  "Mysore Silk",
  "Muga Silk",
  "Dupion Silk",
  "Silk Blend",
  "Cotton Silk",
  "Linen Silk",
  "Satin Georgette",
  "Silk Organza",
  "Taffeta",
  "Tulle",
  "Lace",
] as const;

const LEHENGA_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
const SAREE_SIZE = "Free Size";
const ERROR_COLOR_CLASS =
  "border-2 border-[#B42318] text-[#B42318] focus-visible:border-[#B42318] focus-visible:ring-[#B42318]/20";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"] as const;
const ALLOWED_IMAGE_ACCEPT = ".jpg,.jpeg,.png";

const HEX_PATTERN = /^#([0-9A-Fa-f]{6})$/;
const DEFAULT_PREVIEW_HEX = "#94A3B8";
const DEFAULT_PICKER_HEX = "#000000";

interface SizeRow {
  id: string;
  size: string;
  quantity: string;
  selling_price: string;
  mrp: string;
}

interface ColorVariant {
  id: string;
  color: string;
  images: string[];
  sizes: SizeRow[];
  expanded: boolean;
}

interface ImageUploadStatus {
  file: File;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface ProductSizePayload {
  size: string;
  quantity: number;
  selling_price: number;
  mrp: number;
}

interface ProductVariantPayload {
  color: string;
  images: string[];
  sizes: ProductSizePayload[];
}

interface ProductFormPayload {
  category: string;
  brand: string;
  product_name: string;
  fabric: string;
  description: string;
  is_sale: boolean;
  is_visible: boolean;
  status: "active" | "inactive";
  is_delete: false;
  product_variants: ProductVariantPayload[];
}

interface ProductApiResponse {
  _id?: string;
  name?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  fabric?: string;
  description?: string;
  is_sale?: boolean;
  is_visible?: boolean;
  isActive?: boolean;
  status?: string;
  product_variants?: Array<{
    color?: string;
    images?: string[];
    sizes?: Array<{
      size?: string;
      quantity?: number | string;
      selling_price?: number | string;
      mrp?: number | string;
    }>;
  }>;
  variants?: Array<{
    color?: string;
    images?: string[];
    sellingPrice?: number | string;
    mrp?: number | string;
    sizes?:
      | Array<{ size?: string; stock?: number | string; quantity?: number | string }>
      | Record<string, { stock?: number | string; selected?: boolean } | number | string>;
  }>;
}

const toStringValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value);
};

const sanitizeDigits = (raw: string): string => raw.replace(/\D/g, "");

const sanitizeDecimal = (raw: string): string => {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("")}`;
};

const isEmptyHtml = (html: string): boolean =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;

const isSareeCategory = (category: string): boolean =>
  category === "saree" || category === "banarasi-saree";

const isLehengaCategory = (category: string): boolean =>
  category === "lehenga" ||
  category === "bridal-lehenga" ||
  category === "rajputi-poshak";

const getBrandsForCategory = (category: string): readonly string[] => {
  if (isSareeCategory(category)) return SAREE_BRANDS;
  if (isLehengaCategory(category)) return LEHENGA_BRANDS;
  return [];
};

const getSizesForCategory = (category: string): readonly string[] => {
  if (isSareeCategory(category)) return [SAREE_SIZE];
  if (isLehengaCategory(category)) return LEHENGA_SIZES;
  return LEHENGA_SIZES;
};

const normalizeCategory = (value: string): CategorySlug | "" => {
  const key = value.trim().toLowerCase().replace(/\s+/g, "-");
  const aliases: Record<string, CategorySlug> = {
    saree: "saree",
    "banarasi-saree": "banarasi-saree",
    "banarasi-sarees": "banarasi-saree",
    lehenga: "lehenga",
    "bridal-lehenga": "bridal-lehenga",
    "rajputi-poshak": "rajputi-poshak",
  };
  return aliases[key] ?? "";
};

const createSizeRow = (size = ""): SizeRow => ({
  id: crypto.randomUUID(),
  size,
  quantity: "",
  selling_price: "",
  mrp: "",
});

const createColorVariant = (
  category = "",
  expanded = true,
): ColorVariant => ({
  id: crypto.randomUUID(),
  color: "",
  images: [],
  sizes: isSareeCategory(category) ? [createSizeRow(SAREE_SIZE)] : [],
  expanded,
});

const applyCategoryToVariant = (
  variant: ColorVariant,
  category: string,
): ColorVariant => {
  if (isSareeCategory(category)) {
    const existing = variant.sizes.find((row) => row.size === SAREE_SIZE);
    return {
      ...variant,
      sizes: [existing ?? createSizeRow(SAREE_SIZE)],
    };
  }

  return {
    ...variant,
    sizes: variant.sizes.filter((row) => row.size && row.size !== SAREE_SIZE),
  };
};

const FieldError = ({ message }: { message?: string }) => {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#B42318]">
      <CircleAlert className="size-3.5 shrink-0" />
      {message}
    </p>
  );
};

const isValidHex = (value: string): boolean => HEX_PATTERN.test(value.trim());

const normalizeHex = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!isValidHex(withHash)) return null;
  return withHash.toUpperCase();
};

const previewHex = (value: string): string =>
  normalizeHex(value) ?? DEFAULT_PREVIEW_HEX;

const pickerHex = (value: string): string =>
  normalizeHex(value) ?? DEFAULT_PICKER_HEX;

const sanitizeHexInput = (raw: string): string => {
  const withoutSpaces = raw.replace(/\s/g, "");
  if (withoutSpaces === "") return "";
  const body = withoutSpaces.startsWith("#")
    ? withoutSpaces.slice(1)
    : withoutSpaces;
  return `#${body.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6)}`;
};

const getColorError = (color: string, showErrors: boolean): string => {
  if (!showErrors) return "";
  if (!color.trim()) return "Color is required";
  if (!normalizeHex(color)) return "Enter a valid HEX color";
  return "";
};

const validateImageFile = (
  file: File,
): { valid: true } | { valid: false; error: string } => {
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
};

const sellingExceedsMrp = (sellingPrice: string, mrp: string): boolean => {
  if (!sellingPrice || !mrp) return false;
  return Number(sellingPrice) > Number(mrp);
};

const variantStock = (variant: ColorVariant): number =>
  variant.sizes.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

const mapApiProductToVariants = (product: ProductApiResponse): ColorVariant[] => {
  if (Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    return product.product_variants.map((variant, index) => ({
      id: `variant-${index}-${crypto.randomUUID()}`,
      color: toStringValue(variant.color),
      images: Array.isArray(variant.images) ? variant.images : [],
      expanded: index === 0,
      sizes: (variant.sizes ?? []).map((size) => ({
        id: crypto.randomUUID(),
        size: toStringValue(size.size),
        quantity: toStringValue(size.quantity),
        selling_price: toStringValue(size.selling_price),
        mrp: toStringValue(size.mrp),
      })),
    }));
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    return product.variants.map((variant, index) => {
      const sellingPrice = toStringValue(variant.sellingPrice);
      const mrp = toStringValue(variant.mrp);
      let sizeRows: SizeRow[] = [];

      if (Array.isArray(variant.sizes)) {
        sizeRows = variant.sizes
          .map((item) => ({
            id: crypto.randomUUID(),
            size: toStringValue(item.size),
            quantity: toStringValue(item.quantity ?? item.stock),
            selling_price: sellingPrice,
            mrp,
          }))
          .filter((row) => row.size);
      } else if (variant.sizes && typeof variant.sizes === "object") {
        sizeRows = Object.entries(variant.sizes)
          .map(([size, value]) => {
            const quantity =
              value && typeof value === "object"
                ? toStringValue((value as { stock?: unknown }).stock)
                : toStringValue(value);
            return {
              id: crypto.randomUUID(),
              size,
              quantity,
              selling_price: sellingPrice,
              mrp,
            };
          })
          .map((row) =>
            row.size === "ONE_SIZE" ? { ...row, size: SAREE_SIZE } : row,
          )
          .filter((row) => row.size);
      }

      return {
        id: `variant-${index}-${crypto.randomUUID()}`,
        color: toStringValue(variant.color),
        images: Array.isArray(variant.images) ? variant.images : [],
        expanded: index === 0,
        sizes: sizeRows,
      };
    });
  }

  return [createColorVariant(normalizeCategory(product.category ?? ""), true)];
};

const toApiPayload = ({
  category,
  brand,
  product_name,
  fabric,
  description,
  is_sale,
  is_visible,
  variants,
}: {
  category: string;
  brand: string;
  product_name: string;
  fabric: string;
  description: string;
  is_sale: boolean;
  is_visible: boolean;
  variants: ColorVariant[];
}): ProductFormPayload => ({
  category,
  brand,
  product_name,
  fabric,
  description,
  is_sale,
  is_visible,
  status: is_sale ? "active" : "inactive",
  is_delete: false,
  product_variants: variants.map((variant) => ({
    color: normalizeHex(variant.color) ?? variant.color.trim().toUpperCase(),
    images: variant.images,
    sizes: variant.sizes.map((row) => ({
      size: row.size,
      quantity: Number(row.quantity),
      selling_price: Number(row.selling_price),
      mrp: Number(row.mrp),
    })),
  })),
});

const ToggleSwitch = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="inline-flex items-center gap-2"
  >
    <span
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[#6D5EF5]" : "bg-gray-300",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </span>
    <span className="text-sm font-medium text-gray-800">{label}</span>
  </button>
);

const VariantCard = memo(function VariantCard({
  variant,
  category,
  canRemove,
  showErrors,
  sizeDraft,
  uploadingImages,
  onUpdate,
  onRemove,
  onAddSize,
  onSizeDraftChange,
  onUpdateSize,
  onRemoveSize,
  onImagesUpload,
  onImageRemove,
}: {
  variant: ColorVariant;
  category: string;
  canRemove: boolean;
  showErrors: boolean;
  sizeDraft: string;
  uploadingImages: ImageUploadStatus[];
  onUpdate: (id: string, updates: Partial<ColorVariant>) => void;
  onRemove: (id: string) => void;
  onAddSize: (variantId: string, size: string) => void;
  onSizeDraftChange: (variantId: string, size: string) => void;
  onUpdateSize: (variantId: string, sizeId: string, updates: Partial<SizeRow>) => void;
  onRemoveSize: (variantId: string, sizeId: string) => void;
  onImagesUpload: (variantId: string, files: FileList) => Promise<void>;
  onImageRemove: (variantId: string, imageIndex: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);
  const usedSizes = new Set(variant.sizes.map((row) => row.size));
  const remainingSizes = getSizesForCategory(category).filter(
    (size) => !usedSizes.has(size),
  );
  const hasUploadingImages = uploadingImages.some((item) => item.status === "uploading");
  const isSaree = isSareeCategory(category);
  const colorError = getColorError(variant.color, showErrors);
  const previewColor = previewHex(variant.color);
  const imagesError =
    showErrors && variant.images.length === 0 ? "At least one image is required" : "";

  if (!variant.expanded) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="size-8 shrink-0 rounded-md border border-gray-200"
              style={{ backgroundColor: previewColor }}
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-gray-900">
                {normalizeHex(variant.color) ?? (variant.color || "Untitled color")}
              </p>
              <p className="text-sm text-gray-500">
                {variant.sizes.length} Sizes · {variantStock(variant)} Units
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRemove(variant.id)}
              disabled={!canRemove}
              className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label="Delete color variant"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onUpdate(variant.id, { expanded: true })}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Expand color variant"
            >
              <ChevronDown className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-[220px] max-w-sm flex-1">
            <p className="mb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">
              COLOR DETAILS
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => colorPickerRef.current?.click()}
                className="size-10 shrink-0 cursor-pointer rounded-lg border border-gray-200"
                style={{ backgroundColor: previewColor }}
                aria-label="Open color picker"
                title="Choose color"
              />
              <input
                ref={colorPickerRef}
                type="color"
                value={pickerHex(variant.color)}
                onChange={(event) =>
                  onUpdate(variant.id, {
                    color: event.target.value.toUpperCase(),
                  })
                }
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
              <Input
                value={variant.color}
                placeholder="Enter color"
                onChange={(event) =>
                  onUpdate(variant.id, {
                    color: sanitizeHexInput(event.target.value),
                  })
                }
                onBlur={() => {
                  const normalized = normalizeHex(variant.color);
                  if (normalized) {
                    onUpdate(variant.id, { color: normalized });
                  }
                }}
                className={cn("h-10 bg-white", colorError && ERROR_COLOR_CLASS)}
              />
            </div>
            <FieldError message={colorError} />
          </div>
          <div className="mt-6 hidden items-center gap-8 sm:flex">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-gray-400">
                SIZES
              </p>
              <p className="text-sm font-medium text-gray-800">
                {variant.sizes.length} Available
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.08em] text-gray-400">
                STOCK
              </p>
              <p className="text-sm font-medium text-gray-800">
                {variantStock(variant)} Units
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRemove(variant.id)}
            disabled={!canRemove}
            className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            aria-label="Delete color variant"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onUpdate(variant.id, { expanded: false })}
            className="flex size-8 items-center justify-center rounded-full bg-[#5B8DEF] text-white"
            aria-label="Collapse color variant"
          >
            <ChevronUp className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-gray-400">
          VARIANT IMAGES
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
              void onImagesUpload(variant.id, files);
            }
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
        <div className="flex flex-wrap gap-3">
          {variant.images.map((image, imageIndex) => (
            <div
              key={`${image}-${imageIndex}`}
              className="group relative size-[92px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            >
              <img
                src={image}
                alt={`${variant.color || "Variant"} image ${imageIndex + 1}`}
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => onImageRemove(variant.id, imageIndex)}
                className="absolute top-1 right-1 rounded-full bg-red-600 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove image"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {uploadingImages.map((item, index) => (
            <div
              key={`${item.file.name}-${index}`}
              className="flex size-[92px] items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
            >
              {item.status === "uploading" ? (
                <div className="flex flex-col items-center gap-1">
                  <Spinner className="size-5 text-blue-600" />
                  <span className="text-[10px] text-gray-500">Uploading...</span>
                </div>
              ) : (
                <div className="px-1 text-center">
                  <X className="mx-auto mb-0.5 size-4 text-red-600" />
                  <span className="line-clamp-2 text-[10px] text-red-600">
                    {item.error}
                  </span>
                </div>
              )}
            </div>
          ))}
          <button
            type="button"
            disabled={hasUploadingImages}
            onClick={() => fileInputRef.current?.click()}
            className="flex size-[92px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-[#F7F7F8] text-gray-500 transition-colors hover:border-pink-400 hover:bg-pink-50 disabled:opacity-50"
          >
            <Camera className="mb-1 size-5" />
            <span className="text-xs font-medium">Add Image</span>
          </button>
        </div>
        <FieldError message={imagesError} />
      </div>

      <div>
        <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-gray-400">
          INVENTORY & PRICING
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <div className="grid min-w-[640px] grid-cols-[80px_1fr_1fr_1fr_56px] bg-[#F3F4F6] px-4 py-2.5 text-xs font-semibold text-gray-600">
            <span>Size</span>
            <span>Quantity</span>
            <span>Selling Price</span>
            <span>MRP</span>
            <span className="text-right">Action</span>
          </div>
          {variant.sizes.map((row) => {
            const quantityError =
              showErrors && row.quantity === "" ? "Quantity is required" : "";
            const sellingEmpty =
              showErrors && row.selling_price === "" ? "Selling price is required" : "";
            const mrpError = showErrors && row.mrp === "" ? "MRP is required" : "";
            const priceError = sellingExceedsMrp(row.selling_price, row.mrp)
              ? "Price > MRP"
              : sellingEmpty;
            return (
              <div
                key={row.id}
                className="grid min-w-[640px] grid-cols-[80px_1fr_1fr_1fr_56px] items-start gap-2 border-t border-gray-100 px-4 py-3"
              >
                <div className="flex h-10 items-center text-sm font-medium text-gray-800">
                  {row.size}
                </div>
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={row.quantity}
                    placeholder="0"
                    onChange={(event) =>
                      onUpdateSize(variant.id, row.id, {
                        quantity: sanitizeDigits(event.target.value),
                      })
                    }
                    className={cn("h-10 bg-white", quantityError && ERROR_COLOR_CLASS)}
                  />
                  <FieldError message={quantityError} />
                </div>
                <div>
                  <div className="relative">
                    <span
                      className={cn(
                        "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm",
                        priceError ? "text-[#B42318]" : "text-gray-500",
                      )}
                    >
                      ₹
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={row.selling_price}
                      placeholder="0"
                      onChange={(event) =>
                        onUpdateSize(variant.id, row.id, {
                          selling_price: sanitizeDecimal(event.target.value),
                        })
                      }
                      className={cn(
                        "h-10 bg-white pl-7",
                        priceError && ERROR_COLOR_CLASS,
                      )}
                    />
                  </div>
                  <FieldError message={priceError} />
                </div>
                <div>
                  <div className="relative">
                    <span
                      className={cn(
                        "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm",
                        mrpError ? "text-[#B42318]" : "text-gray-500",
                      )}
                    >
                      ₹
                    </span>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={row.mrp}
                      placeholder="0"
                      onChange={(event) =>
                        onUpdateSize(variant.id, row.id, {
                          mrp: sanitizeDecimal(event.target.value),
                        })
                      }
                      className={cn("h-10 bg-white pl-7", mrpError && ERROR_COLOR_CLASS)}
                    />
                  </div>
                  <FieldError message={mrpError} />
                </div>
                <div className="flex h-10 items-center justify-end">
                  {!isSaree && (
                    <button
                      type="button"
                      onClick={() => onRemoveSize(variant.id, row.id)}
                      className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove size ${row.size}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isSaree && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Select
              value={sizeDraft || undefined}
              onValueChange={(value) => onSizeDraftChange(variant.id, value)}
            >
              <SelectTrigger className="h-10 w-[160px] bg-white">
                <SelectValue placeholder="Select Size" />
              </SelectTrigger>
              <SelectContent>
                {remainingSizes.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    All sizes added
                  </SelectItem>
                ) : (
                  remainingSizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={() => onAddSize(variant.id, sizeDraft)}
              className="h-10 bg-[#EDE7F6] text-[#5B3A9E] hover:bg-[#E4D7F5] hover:text-[#4A2F84]"
            >
              + Add Size
            </Button>
            <span className="ml-auto text-sm text-gray-500">
              {variant.sizes.length} size{variant.sizes.length === 1 ? "" : "s"} added
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

const NewAddUpdateProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [hasPopulatedForm, setHasPopulatedForm] = useState(false);
  const [description, setDescription] = useState("");
  const [isSale, setIsSale] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [sizeDrafts, setSizeDrafts] = useState<Record<string, string>>({});
  const [variants, setVariants] = useState<ColorVariant[]>([
    createColorVariant("", true),
  ]);
  const [uploadingImages, setUploadingImages] = useState<
    Record<string, ImageUploadStatus[]>
  >({});

  const {
    data: productResponse,
    isLoading: isLoadingProduct,
    isError: isProductError,
    error: productError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await getProductById(id!);
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
      productId,
      payload,
    }: {
      productId: string;
      payload: ProductFormPayload;
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
      category: "",
      brand: "",
      product_name: "",
      fabric: "",
    },
    onSubmit: async ({ value }) => {
      setAttemptedSubmit(true);

      if (!value.category) {
        showError("Category is required");
        return;
      }
      if (!value.brand) {
        showError("Brand is required");
        return;
      }
      if (!value.product_name.trim()) {
        showError("Product name is required");
        return;
      }
      if (!value.fabric) {
        showError("Fabric is required");
        return;
      }
      if (isEmptyHtml(description)) {
        showError("Description is required");
        return;
      }
      if (variants.length === 0) {
        showError("At least one color variant is required");
        return;
      }

      const hasUploadsInProgress = Object.values(uploadingImages).some((items) =>
        items.some((item) => item.status === "uploading"),
      );
      if (hasUploadsInProgress) {
        showError("Please wait for image uploads to finish");
        return;
      }

      const usedColors = new Set<string>();
      for (const variant of variants) {
        const hex = normalizeHex(variant.color);
        if (!hex) {
          showError("Each variant must have a valid HEX color");
          return;
        }
        if (usedColors.has(hex)) {
          showError(`Color ${hex} is already used on another variant`);
          return;
        }
        usedColors.add(hex);
        if (variant.images.length === 0) {
          showError(`Variant "${variant.color}" must have at least one image`);
          return;
        }
        if (variant.sizes.length === 0) {
          showError(`Variant "${variant.color}" must have at least one size`);
          return;
        }

        for (const row of variant.sizes) {
          if (!row.size) {
            showError(`Variant "${variant.color}" has an incomplete size`);
            return;
          }
          if (row.quantity === "" || Number(row.quantity) < 0) {
            showError(
              `Variant "${variant.color}" size ${row.size} must have a valid quantity`,
            );
            return;
          }
          if (row.selling_price === "" || Number(row.selling_price) < 0) {
            showError(
              `Variant "${variant.color}" size ${row.size} must have a valid selling price`,
            );
            return;
          }
          if (row.mrp === "" || Number(row.mrp) < 0) {
            showError(
              `Variant "${variant.color}" size ${row.size} must have a valid MRP`,
            );
            return;
          }
          if (sellingExceedsMrp(row.selling_price, row.mrp)) {
            showError(
              `Variant "${variant.color}" size ${row.size}: selling price cannot exceed MRP`,
            );
            return;
          }
        }
      }

      const payload = toApiPayload({
        category: value.category,
        brand: value.brand,
        product_name: value.product_name.trim(),
        fabric: value.fabric,
        description,
        is_sale: isSale,
        is_visible: isVisible,
        variants,
      });

      if (isEditMode && id) {
        updateMutation.mutate({ productId: id, payload });
        return;
      }

      createMutation.mutate(payload);
    },
  });

  const selectedCategory = form.state.values.category;
  const brandOptions = useMemo(() => {
    const options = [...getBrandsForCategory(selectedCategory)];
    if (selectedCategory && form.state.values.brand && !options.includes(form.state.values.brand)) {
      options.unshift(form.state.values.brand);
    }
    return options;
  }, [selectedCategory, form.state.values.brand]);

  const handleCategoryChange = (nextCategory: string) => {
    const currentBrand = form.state.values.brand;
    form.setFieldValue("category", nextCategory);
    const nextBrands = getBrandsForCategory(nextCategory);
    if (currentBrand && !nextBrands.includes(currentBrand)) {
      form.setFieldValue("brand", "");
    }
    setVariants((prev) =>
      prev.map((variant) => applyCategoryToVariant(variant, nextCategory)),
    );
  };

  const updateVariant = (variantId: string, updates: Partial<ColorVariant>) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId ? { ...variant, ...updates } : variant,
      ),
    );
  };

  const addColorVariant = () => {
    setVariants((prev) => {
      const next = createColorVariant(form.state.values.category, true);
      return [...prev.map((variant) => ({ ...variant, expanded: false })), next];
    });
  };

  const removeColorVariant = (variantId: string) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((variant) => variant.id !== variantId);
    });
  };

  const addSize = (variantId: string, size: string) => {
    if (isSareeCategory(form.state.values.category)) return;
    const allowedSizes = getSizesForCategory(form.state.values.category);
    if (!size || size === "__none" || !allowedSizes.includes(size)) {
      showError("Select a size before adding");
      return;
    }

    setVariants((prev) =>
      prev.map((variant) => {
        if (variant.id !== variantId) return variant;
        if (variant.sizes.some((row) => row.size === size)) {
          showError(`Size ${size} is already added`);
          return variant;
        }
        return {
          ...variant,
          sizes: [...variant.sizes, { ...createSizeRow(), size }],
        };
      }),
    );
    setSizeDrafts((prev) => ({ ...prev, [variantId]: "" }));
  };

  const updateSize = (
    variantId: string,
    sizeId: string,
    updates: Partial<SizeRow>,
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              sizes: variant.sizes.map((row) =>
                row.id === sizeId ? { ...row, ...updates } : row,
              ),
            }
          : variant,
      ),
    );
  };

  const removeSize = (variantId: string, sizeId: string) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? { ...variant, sizes: variant.sizes.filter((row) => row.id !== sizeId) }
          : variant,
      ),
    );
  };

  const handleMultipleImagesUpload = async (
    variantId: string,
    files: FileList,
  ) => {
    const filesArray = Array.from(files);
    const initialStatuses: ImageUploadStatus[] = filesArray.map((file) => ({
      file,
      status: "uploading",
    }));

    setUploadingImages((prev) => ({
      ...prev,
      [variantId]: [...(prev[variantId] || []), ...initialStatuses],
    }));

    for (const file of filesArray) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadingImages((prev) => {
          const updated = [...(prev[variantId] || [])];
          const statusIndex = updated.findIndex(
            (item) => item.file === file && item.status === "uploading",
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
        showError(validation.error);
        setTimeout(() => {
          setUploadingImages((prev) => ({
            ...prev,
            [variantId]: (prev[variantId] || []).filter((item) => item.file !== file),
          }));
        }, 5000);
        continue;
      }

      try {
        const data = await uploadImageToCloudinary(file);
        setVariants((prev) =>
          prev.map((variant) =>
            variant.id === variantId
              ? { ...variant, images: [...variant.images, data.secure_url] }
              : variant,
          ),
        );
        setUploadingImages((prev) => ({
          ...prev,
          [variantId]: (prev[variantId] || []).filter((item) => item.file !== file),
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Image upload failed";
        setUploadingImages((prev) => {
          const updated = [...(prev[variantId] || [])];
          const statusIndex = updated.findIndex(
            (item) => item.file === file && item.status === "uploading",
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
        showError(message);
        setTimeout(() => {
          setUploadingImages((prev) => ({
            ...prev,
            [variantId]: (prev[variantId] || []).filter((item) => item.file !== file),
          }));
        }, 5000);
      }
    }
  };

  const handleImageRemove = (variantId: string, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.id === variantId
          ? {
              ...variant,
              images: variant.images.filter((_, index) => index !== imageIndex),
            }
          : variant,
      ),
    );
  };

  useEffect(() => {
    if (!product || hasPopulatedForm || !isEditMode) return;

    const nextCategory = normalizeCategory(product.category ?? "");
    form.setFieldValue("category", nextCategory);
    form.setFieldValue("brand", product.brand ?? "");
    form.setFieldValue(
      "product_name",
      product.product_name ?? product.name ?? "",
    );
    form.setFieldValue("fabric", product.fabric ?? "");
    setDescription(product.description ?? "");
    setIsSale(product.is_sale ?? product.isActive ?? true);
    setIsVisible(product.is_visible ?? true);
    setVariants(
      mapApiProductToVariants(product).map((variant) =>
        applyCategoryToVariant(variant, nextCategory),
      ),
    );
    setHasPopulatedForm(true);
  }, [product, hasPopulatedForm, isEditMode, form]);

  const previewVariants = useMemo(
    () =>
      variants.map((variant) => ({
        id: variant.id,
        color: variant.color,
        sellingPrice: variant.sizes[0]?.selling_price ?? "",
        mrp: variant.sizes[0]?.mrp ?? "",
        images: variant.images,
        sizes: Object.fromEntries(
          variant.sizes.map((row) => [
            row.size || "Size",
            { selected: true, stock: row.quantity },
          ]),
        ),
      })),
    [variants],
  );

  if (isEditMode && (isLoadingProduct || (product && !hasPopulatedForm))) {
    return (
      <div className="flex h-full items-center justify-center bg-[#F5F6F8]">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="size-8" />
          <p className="text-sm text-gray-600">Loading product data...</p>
        </div>
      </div>
    );
  }

  if (isEditMode && isProductError) {
    return (
      <div className="h-full overflow-y-auto bg-[#F5F6F8] p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="mb-1 font-semibold text-red-800">Failed to Load Product</h3>
            <p className="text-sm text-red-600">
              {(productError as { response?: { data?: { message?: string } } })
                ?.response?.data?.message ??
                "Unable to fetch product data. The product may not exist or there was a network error."}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/products")}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[980px] px-6 pt-6 pb-8">
          <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
            {isEditMode ? "Update Product" : "Create New Product"}
          </h1>
          <div className="mt-4 border-b border-gray-200" />

          <form
            className="mt-6 space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              void form.handleSubmit();
            }}
          >
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-5 text-lg font-semibold text-gray-900">
                Product Information
              </h2>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                <form.Field
                  name="category"
                  validators={{
                    onChange: z.string().min(1, "Category is required"),
                  }}
                >
                  {(field) => {
                    const error =
                      (attemptedSubmit || field.state.meta.isTouched) &&
                      !field.state.value
                        ? "Category is required"
                        : "";
                    return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel className="mb-1.5 text-sm font-medium text-gray-800">
                        Category <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(value) => {
                          handleCategoryChange(value);
                          field.handleBlur();
                        }}
                      >
                        <SelectTrigger className={cn("h-11 bg-white", error && ERROR_COLOR_CLASS)}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={error} />
                    </Field>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="brand"
                  validators={{
                    onChange: z.string().min(1, "Brand is required"),
                  }}
                >
                  {(field) => {
                    const error =
                      (attemptedSubmit || field.state.meta.isTouched) &&
                      !field.state.value
                        ? "Brand is required"
                        : "";
                    return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel className="mb-1.5 text-sm font-medium text-gray-800">
                        Brand <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(value) => field.handleChange(value)}
                        disabled={!selectedCategory}
                      >
                        <SelectTrigger className={cn("h-11 bg-white", error && ERROR_COLOR_CLASS)}>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brandOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={error} />
                    </Field>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="product_name"
                  validators={{
                    onChange: z.string().min(1, "Product name is required").trim(),
                  }}
                >
                  {(field) => {
                    const error =
                      (attemptedSubmit || field.state.meta.isTouched) &&
                      !field.state.value.trim()
                        ? "Product name is required"
                        : "";
                    return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel className="mb-1.5 text-sm font-medium text-gray-800">
                        Product Name <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Input
                        value={field.state.value}
                        placeholder="Enter product name"
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        className={cn("h-11 bg-white", error && ERROR_COLOR_CLASS)}
                      />
                      <FieldError message={error} />
                    </Field>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="fabric"
                  validators={{
                    onChange: z.string().min(1, "Fabric is required"),
                  }}
                >
                  {(field) => {
                    const error =
                      (attemptedSubmit || field.state.meta.isTouched) &&
                      !field.state.value
                        ? "Fabric is required"
                        : "";
                    return (
                    <Field data-invalid={Boolean(error)}>
                      <FieldLabel className="mb-1.5 text-sm font-medium text-gray-800">
                        Fabric <span className="text-red-500">*</span>
                      </FieldLabel>
                      <Select
                        value={field.state.value || undefined}
                        onValueChange={(value) => field.handleChange(value)}
                      >
                        <SelectTrigger className={cn("h-11 bg-white", error && ERROR_COLOR_CLASS)}>
                          <SelectValue placeholder="Select fabric" />
                        </SelectTrigger>
                        <SelectContent>
                          {FABRIC_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={error} />
                    </Field>
                    );
                  }}
                </form.Field>
              </div>

              <div className="mt-5">
                <FieldLabel className="mb-1.5 text-sm font-medium text-gray-800">
                  Description
                </FieldLabel>
                <div
                  className={cn(
                    "overflow-hidden rounded-lg border bg-white",
                    attemptedSubmit && isEmptyHtml(description)
                      ? "border-2 border-[#B42318]"
                      : "border-gray-300",
                  )}
                >
                  <Suspense
                    fallback={
                      <div className="flex min-h-[180px] items-center justify-center">
                        <Spinner className="size-6" />
                      </div>
                    }
                  >
                    <ProductDescriptionEditor
                      value={description}
                      onChange={setDescription}
                    />
                  </Suspense>
                </div>
                <FieldError
                  message={
                    attemptedSubmit && isEmptyHtml(description)
                      ? "Description is required"
                      : ""
                  }
                />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900">
                Product Variants
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage images, pricing, and inventory for each color variant.
              </p>
              <div className="mt-4 space-y-4">
                {variants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    category={selectedCategory}
                    canRemove={variants.length > 1}
                    showErrors={attemptedSubmit}
                    sizeDraft={sizeDrafts[variant.id] ?? ""}
                    uploadingImages={uploadingImages[variant.id] || []}
                    onUpdate={updateVariant}
                    onRemove={removeColorVariant}
                    onAddSize={addSize}
                    onSizeDraftChange={(variantId, size) =>
                      setSizeDrafts((prev) => ({ ...prev, [variantId]: size }))
                    }
                    onUpdateSize={updateSize}
                    onRemoveSize={removeSize}
                    onImagesUpload={handleMultipleImagesUpload}
                    onImageRemove={handleImageRemove}
                  />
                ))}
              </div>
              <Button
                type="button"
                onClick={addColorVariant}
                className="mt-4 h-12 w-full bg-[#E91E63] text-base font-semibold text-white hover:bg-[#D81B60]"
              >
                <Plus className="size-4" />
                Add Color Variant
              </Button>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-[#F3F4F6] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      List for Sale
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Make this product available for purchase across all enabled
                      sales channels.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={isSale}
                    onChange={setIsSale}
                    label={isSale ? "Active" : "Inactive"}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-[#F3F4F6] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Website Visibility
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Control whether this product is visible to customers on your
                      storefront.
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={isVisible}
                    onChange={setIsVisible}
                    label={isVisible ? "Visible" : "Hidden"}
                  />
                </div>
              </div>
            </section>
          </form>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-3">
          <Button
            type="button"
            onClick={() => navigate("/products")}
            className="h-10 bg-[#2F2F2F] px-6 text-white hover:bg-black"
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="h-10 bg-[#2F2F2F] px-5 text-white hover:bg-black"
            >
              <Eye className="size-4" />
              Preview Product
            </Button>
            <Button
              type="button"
              disabled={mutation.isPending}
              onClick={() => void form.handleSubmit()}
              className="h-10 bg-[#E91E63] px-6 font-semibold text-white hover:bg-[#D81B60]"
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="size-4" />
                  Saving...
                </>
              ) : (
                "Save Product"
              )}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Product Preview</DialogTitle>
          </DialogHeader>
          <ProductPreview
            productName={form.state.values.product_name}
            brand={form.state.values.brand}
            category={form.state.values.category}
            description={description}
            variants={previewVariants}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NewAddUpdateProduct;
