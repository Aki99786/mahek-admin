import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_OPTIONS,
  ROLES_PERMISSIONS,
  buildPermissionState,
  createPermission,
  createRbacPayload,
  hasAtLeastOnePermission,
  type Action,
  type Module,
  type PermissionState,
  type Role,
} from "@/rabc-control";

type FormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: Role | "";
  permissions: PermissionState;
};

type FormErrors = Partial<
  Record<"fullName" | "email" | "phoneNumber" | "role" | "image" | "permissions", string>
>;

const AddEditTeamMember = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<FormValues>({
    fullName: "",
    email: "",
    phoneNumber: "",
    role: "",
    permissions: buildPermissionState(ALL_PERMISSIONS, []),
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const headerTitle = isEditMode ? "Edit Team Member" : "Add Team Member";
  const submitLabel = isEditMode ? "Update Member" : "Save Member";

  const selectedRoleLabel = useMemo(() => {
    if (!values.role) return "";
    return ROLE_OPTIONS.find((item) => item.value === values.role)?.role ?? "";
  }, [values.role]);

  const handleRoleChange = (nextRole: Role) => {
    setValues((prev) => ({
      ...prev,
      role: nextRole,
      permissions: buildPermissionState(ALL_PERMISSIONS, ROLES_PERMISSIONS[nextRole]),
    }));
    setErrors((prev) => ({ ...prev, role: "", permissions: "" }));
  };

  const handleFieldChange = (
    key: keyof Pick<FormValues, "fullName" | "email" | "phoneNumber">,
    nextValue: string,
  ) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handlePhoneChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, "").slice(0, 15);
    handleFieldChange("phoneNumber", cleaned);
  };

  const handlePermissionToggle = (permission: ReturnType<typeof createPermission>, checked: boolean) => {
    setValues((prev) => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: checked },
    }));
    setErrors((prev) => ({ ...prev, permissions: "" }));
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, image: "Please select a valid image file." }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, image: "Image size must be less than 5 MB." }));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, image: "" }));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!values.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }
    if (!values.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!values.phoneNumber.trim()) {
      nextErrors.phoneNumber = "Phone number is required.";
    } else if (values.phoneNumber.length < 10) {
      nextErrors.phoneNumber = "Phone number must be at least 10 digits.";
    }
    if (!values.role) {
      nextErrors.role = "Role is required.";
    }
    if (!hasAtLeastOnePermission(values.permissions)) {
      nextErrors.permissions = "Select at least one permission.";
    }
    if (!imageFile && !isEditMode) {
      nextErrors.image = "User image is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    const payload = createRbacPayload({
      name: values.fullName.trim(),
      role: values.role as Role,
      permissions: values.permissions,
    });

    console.log("Team member payload:", payload);

    setIsSubmitting(true);
    // UI-only submission flow as requested.
    window.setTimeout(() => {
      setIsSubmitting(false);
      navigate("/team");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Link to="/team">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{headerTitle}</h1>
              <p className="text-sm text-gray-500">
                Configure member details and role-based permissions
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="p-4 bg-white">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Member Details</h2>
              <FieldGroup className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="fullName" className="text-xs">
                      Full Name <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      value={values.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      className={cn("h-9 text-sm", errors.fullName && "border-red-500")}
                    />
                    {errors.fullName && (
                      <p className="text-xs text-red-500">{errors.fullName}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email" className="text-xs">
                      Email <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="email"
                      placeholder="Enter email address"
                      value={values.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      className={cn("h-9 text-sm", errors.email && "border-red-500")}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="phoneNumber" className="text-xs">
                      Phone Number <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="phoneNumber"
                      placeholder="Enter phone number"
                      value={values.phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={cn("h-9 text-sm", errors.phoneNumber && "border-red-500")}
                    />
                    {errors.phoneNumber && (
                      <p className="text-xs text-red-500">{errors.phoneNumber}</p>
                    )}
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs">
                      Role <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Select
                      value={values.role}
                      onValueChange={(value) => handleRoleChange(value as Role)}
                    >
                      <SelectTrigger
                        className={cn("h-9 text-sm", errors.role && "border-red-500")}
                      >
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option._id} value={option.value}>
                            {option.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                  </Field>
                </div>

                <Field>
                  <FieldLabel className="text-xs">
                    Upload User Image <span className="text-red-500">*</span>
                  </FieldLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />

                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-28 w-28 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors inline-flex flex-col items-center justify-center"
                    >
                      <Upload className="h-5 w-5 text-gray-500" />
                      <span className="mt-1 text-xs text-gray-600">Upload</span>
                    </button>

                    {imagePreview && (
                      <div className="relative h-28 w-28 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={imagePreview}
                          alt="User preview"
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  {(imageFile || imagePreview) && (
                    <p className="text-xs text-gray-500 mt-2">{imageFile?.name}</p>
                  )}
                  {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
                </Field>
              </FieldGroup>
            </Card>

            <Card className="p-4 bg-white">
              <h2 className="text-base font-semibold text-gray-900 mb-1">Permissions</h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose module access for{" "}
                <span className="font-medium text-gray-700">
                  {selectedRoleLabel || "selected role"}
                </span>
              </p>

              <div className="space-y-4">
                {Object.entries(PERMISSIONS).map(([moduleName, actions]) => {
                  const moduleKey = moduleName as Module;
                  return (
                    <div key={moduleName} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <h3 className="text-sm font-semibold text-gray-800 capitalize mb-3">
                      {moduleName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-5">
                      {Object.entries(actions).map(([actionName]) => {
                        const permission = createPermission(moduleKey, actionName as Action);
                        return (
                          <label
                            key={actionName}
                            className="inline-flex items-center gap-2 text-sm text-gray-800 capitalize"
                          >
                            <Checkbox
                              checked={Boolean(values.permissions[permission])}
                              onCheckedChange={(nextChecked) =>
                                handlePermissionToggle(permission, Boolean(nextChecked))
                              }
                            />
                            {actionName}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  );
                })}
              </div>
              {errors.permissions && (
                <p className="text-xs text-red-500 mt-3">{errors.permissions}</p>
              )}
            </Card>

            <Card className="p-4 bg-white flex justify-end gap-2">
              <Link to="/team">
                <Button type="button" variant="outline" className="h-9 px-6 text-sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 text-white h-9 px-7 text-sm"
              >
                {isSubmitting ? "Saving..." : submitLabel}
              </Button>
            </Card>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditTeamMember;