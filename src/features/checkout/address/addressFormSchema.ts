import * as z from "zod";

/** India mobile: 10 digits, starts with 6–9 */
const mobileRegex = /^[6-9]\d{9}$/;

/** India pincode: 6 digits, first digit 1–9 */
const pincodeRegex = /^[1-9]\d{5}$/;

export const addressFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name must be at most 80 characters"),
  mobile: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .regex(mobileRegex, "Enter a valid 10-digit mobile number"),
  pincode: z
    .string()
    .trim()
    .min(1, "Pincode is required")
    .regex(pincodeRegex, "Enter a valid 6-digit pincode"),
  addressLine1: z
    .string()
    .trim()
    .min(1, "House No. / Building name is required")
    .max(200, "Maximum 200 characters"),
  addressLine2: z
    .string()
    .trim()
    .min(1, "Road / area / colony is required")
    .max(200, "Maximum 200 characters"),
  landmark: z.string().max(200, "Maximum 200 characters"),
  city: z
    .string()
    .trim()
    .min(1, "City / district is required")
    .max(80, "Maximum 80 characters"),
  state: z.string().trim().min(1, "Please select a state"),
  addressType: z.enum(["home", "work"]),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export const defaultAddressFormValues: AddressFormValues = {
  name: "",
  mobile: "",
  pincode: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  addressType: "home",
  isDefault: false,
};
