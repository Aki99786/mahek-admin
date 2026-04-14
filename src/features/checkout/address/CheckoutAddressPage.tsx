import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDIAN_STATES } from "@/features/checkout/constants/indianStates";
import {
  addressFormSchema,
  defaultAddressFormValues,
  type AddressFormValues,
} from "@/features/checkout/address/addressFormSchema";
import { useCheckoutStore } from "@/features/checkout/store/useCheckoutStore";
import { showError, showSuccess } from "@/utility/utility";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<Record<keyof AddressFormValues, string>>;

function digitsOnly(value: string, maxLen: number) {
  return value.replace(/\D/g, "").slice(0, maxLen);
}

function fieldLabel(
  text: string,
  required: boolean,
  className?: string,
) {
  return (
    <Label className={cn("text-xs font-semibold text-gray-700", className)}>
      {text}
      {required ? <span className="text-[#ff3f6c] ml-0.5">*</span> : null}
    </Label>
  );
}

/**
 * Delivery address step — layout inspired by Myntra checkout address.
 * Route: `/checkout/address`
 */
export default function CheckoutAddressPage() {
  const navigate = useNavigate();
  const setSavedDeliveryAddress = useCheckoutStore(
    (s) => s.setSavedDeliveryAddress,
  );

  const [values, setValues] = useState<AddressFormValues>(defaultAddressFormValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof AddressFormValues, boolean>>>(
    {},
  );

  const stateOptions = useMemo(() => [...INDIAN_STATES].sort(), []);

  const setField = <K extends keyof AddressFormValues>(
    key: K,
    value: AddressFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const markTouched = (key: keyof AddressFormValues) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const validate = (): boolean => {
    const result = addressFormSchema.safeParse(values);
    if (result.success) {
      setErrors({});
      return true;
    }
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const path = issue.path[0] as keyof AddressFormValues | undefined;
      if (path && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    setErrors(fieldErrors);
    setTouched({
      name: true,
      mobile: true,
      pincode: true,
      addressLine1: true,
      addressLine2: true,
      landmark: true,
      city: true,
      state: true,
      addressType: true,
      isDefault: true,
    });
    return false;
  };

  const handleSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) {
      showError("Please fix the errors in the form.");
      return;
    }
    const parsed = addressFormSchema.parse(values);
    setSavedDeliveryAddress(parsed);
    showSuccess("Delivery address saved.");
  };

  const handleCancel = () => {
    navigate("/cart");
  };

  const showErr = (key: keyof AddressFormValues) =>
    (touched[key] || errors[key]) && errors[key];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa]">
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-6 flex-wrap">
          <Link to="/dashboard" className="hover:text-gray-800">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link to="/cart" className="hover:text-gray-800">
            Bag
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <span className="text-gray-800 font-medium">Address</span>
        </nav>

        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">
          ADD NEW ADDRESS
        </h1>

        <form
          onSubmit={handleSave}
          className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 md:p-8 space-y-10"
          noValidate
        >
          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-gray-500">
              CONTACT DETAILS
            </h2>
            <div className="space-y-1.5">
              {fieldLabel("Name", true)}
              <Input
                id="addr-name"
                autoComplete="name"
                placeholder=""
                value={values.name}
                onBlur={() => markTouched("name")}
                onChange={(e) => setField("name", e.target.value)}
                className={cn(showErr("name") && "border-red-500")}
              />
              {showErr("name") && (
                <p className="text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel("Mobile No.", true)}
              <Input
                id="addr-mobile"
                type="text"
                inputMode="numeric"
                autoComplete="tel"
                placeholder=""
                value={values.mobile}
                onBlur={() => markTouched("mobile")}
                onChange={(e) =>
                  setField("mobile", digitsOnly(e.target.value, 10))
                }
                className={cn(showErr("mobile") && "border-red-500")}
              />
              {showErr("mobile") && (
                <p className="text-xs text-red-600">{errors.mobile}</p>
              )}
            </div>
          </section>

          {/* Address */}
          <section className="space-y-4">
            <h2 className="text-xs font-bold tracking-[0.12em] text-gray-500">
              ADDRESS
            </h2>
            <div className="space-y-1.5">
              {fieldLabel("Pincode", true)}
              <Input
                id="addr-pincode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder=""
                value={values.pincode}
                onBlur={() => markTouched("pincode")}
                onChange={(e) =>
                  setField("pincode", digitsOnly(e.target.value, 6))
                }
                className={cn(showErr("pincode") && "border-red-500")}
              />
              {showErr("pincode") && (
                <p className="text-xs text-red-600">{errors.pincode}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel("House No. / Building Name", true)}
              <Input
                id="addr-line1"
                autoComplete="address-line1"
                placeholder=""
                value={values.addressLine1}
                onBlur={() => markTouched("addressLine1")}
                onChange={(e) => setField("addressLine1", e.target.value)}
                className={cn(showErr("addressLine1") && "border-red-500")}
              />
              {showErr("addressLine1") && (
                <p className="text-xs text-red-600">{errors.addressLine1}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel("Road Name / Area / Colony", true)}
              <Input
                id="addr-line2"
                autoComplete="address-line2"
                placeholder=""
                value={values.addressLine2}
                onBlur={() => markTouched("addressLine2")}
                onChange={(e) => setField("addressLine2", e.target.value)}
                className={cn(showErr("addressLine2") && "border-red-500")}
              />
              {showErr("addressLine2") && (
                <p className="text-xs text-red-600">{errors.addressLine2}</p>
              )}
            </div>
            <div className="space-y-1.5">
              {fieldLabel("Landmark", false)}
              <Input
                id="addr-landmark"
                placeholder=""
                value={values.landmark}
                onChange={(e) => setField("landmark", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                {fieldLabel("City / District", true)}
                <Input
                  id="addr-city"
                  autoComplete="address-level2"
                  placeholder=""
                  value={values.city}
                  onBlur={() => markTouched("city")}
                  onChange={(e) => setField("city", e.target.value)}
                  className={cn(showErr("city") && "border-red-500")}
                />
                {showErr("city") && (
                  <p className="text-xs text-red-600">{errors.city}</p>
                )}
              </div>
              <div className="space-y-1.5">
                {fieldLabel("State", true)}
                <Select
                  value={values.state || undefined}
                  onValueChange={(v) => {
                    markTouched("state");
                    setField("state", v);
                  }}
                >
                  <SelectTrigger
                    id="addr-state"
                    className={cn("w-full", showErr("state") && "border-red-500")}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {stateOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showErr("state") && (
                  <p className="text-xs text-red-600">{errors.state}</p>
                )}
              </div>
            </div>
          </section>

          {/* Save as */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold tracking-[0.12em] text-gray-500">
              SAVE ADDRESS AS
            </h2>
            <RadioGroup
              value={values.addressType}
              onValueChange={(v) => {
                markTouched("addressType");
                setField("addressType", v as "home" | "work");
              }}
              className="flex gap-8"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="home" id="type-home" />
                <Label htmlFor="type-home" className="font-normal text-gray-800">
                  Home
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="work" id="type-work" />
                <Label htmlFor="type-work" className="font-normal text-gray-800">
                  Work
                </Label>
              </div>
            </RadioGroup>
            {showErr("addressType") && (
              <p className="text-xs text-red-600">{errors.addressType}</p>
            )}
          </section>

          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="addr-default"
              checked={values.isDefault}
              onCheckedChange={(c) =>
                setField("isDefault", c === true)
              }
            />
            <Label htmlFor="addr-default" className="font-normal text-sm text-gray-700 cursor-pointer">
              Make this my default address
            </Label>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              className="sm:min-w-[140px] h-11 border-gray-300"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="sm:min-w-[180px] h-11 bg-[#ff3f6c] hover:bg-[#e63661] text-white font-semibold rounded-sm"
            >
              Save Address
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
