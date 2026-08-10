import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  CountrySelect,
  StateSelect,
  CitySelect,
} from "react-country-state-city";

import "react-country-state-city/dist/react-country-state-city.css";

import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// ============================================================
// VALIDATION SCHEMA
// ============================================================

const organizationSchema = z.object({

  // ----------------------------------------------------------
  // ORGANIZATION
  // ----------------------------------------------------------

  orgName: z
    .string()
    .trim()
    .min(
      2,
      "Organization name must be at least 2 characters"
    )
    .max(
      255,
      "Organization name cannot exceed 255 characters"
    ),

  country: z
    .string()
    .trim()
    .min(
      1,
      "Country is required"
    )
    .max(
      100,
      "Country cannot exceed 100 characters"
    ),

  state: z
    .string()
    .trim()
    .min(
      1,
      "State is required"
    )
    .max(
      100,
      "State cannot exceed 100 characters"
    ),

  city: z
    .string()
    .trim()
    .min(
      1,
      "City is required"
    )
    .max(
      100,
      "City cannot exceed 100 characters"
    ),

  addressLine1: z
    .string()
    .trim()
    .min(
      5,
      "Address Line 1 is required"
    )
    .max(
      500,
      "Address Line 1 cannot exceed 500 characters"
    ),

  addressLine2: z
    .string()
    .trim()
    .max(
      500,
      "Address Line 2 cannot exceed 500 characters"
    )
    .optional()
    .or(z.literal("")),

  postalCode: z
    .string()
    .trim()
    .min(
      3,
      "Postal code is required"
    )
    .max(
      20,
      "Postal code cannot exceed 20 characters"
    )
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 -]*$/,
      "Enter a valid postal code"
    ),

  website: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          const url = new URL(value);

          return (
            url.protocol === "http:" ||
            url.protocol === "https:"
          );
        } catch {
          return false;
        }
      },
      {
        message:
          "Enter a valid website URL",
      }
    )
    .max(
      500,
      "Website cannot exceed 500 characters"
    )
    .optional()
    .or(z.literal("")),

  businessType: z
    .string()
    .min(
      1,
      "Business type is required"
    ),

  // ----------------------------------------------------------
  // CONTACT
  // ----------------------------------------------------------

  contact: z.object({

    firstName: z
      .string()
      .trim()
      .min(
        2,
        "First name is required"
      )
      .max(
        100,
        "First name cannot exceed 100 characters"
      )
      .regex(
        /^[A-Za-zÀ-ÿ\s'-]+$/,
        "First name can contain only letters"
      ),

    lastName: z
      .string()
      .trim()
      .max(
        100,
        "Last name cannot exceed 100 characters"
      )
      .regex(
        /^[A-Za-zÀ-ÿ\s'-]*$/,
        "Last name can contain only letters"
      )
      .optional()
      .or(z.literal("")),

    designation: z
      .string()
      .trim()
      .min(
        2,
        "Designation is required"
      )
      .max(
        150,
        "Designation cannot exceed 150 characters"
      ),

    email: z
      .string()
      .trim()
      .email(
        "Enter a valid email address"
      )
      .max(
        255,
        "Email cannot exceed 255 characters"
      ),

    countryCode: z
      .string()
      .min(
        1,
        "Country code is required"
      ),

    phoneNumber: z
      .string()
      .trim()
      .min(
        7,
        "Phone number must contain at least 7 digits"
      )
      .max(
        15,
        "Phone number cannot exceed 15 digits"
      )
      .regex(
        /^[0-9]+$/,
        "Phone number can contain only digits"
      ),

    primary: z.boolean(),
  }),
});


// ============================================================
// TYPE
// ============================================================

type OrganizationFormValues =
  z.infer<typeof organizationSchema>;


// ============================================================
// BUSINESS TYPES
// ============================================================

const BUSINESS_TYPES = [
  {
    value: "MANUFACTURER",
    label: "Manufacturer",
  },
  {
    value: "SUPPLIER",
    label: "Supplier",
  },
  {
    value: "DISTRIBUTOR",
    label: "Distributor",
  },
  {
    value: "RETAILER",
    label: "Retailer",
  },
  {
    value: "LOGISTICS",
    label: "Logistics",
  },
  {
    value: "RECYCLER",
    label: "Recycler",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];


// ============================================================
// COUNTRY CODES
// ============================================================

const COUNTRY_CODES = [
  {
    value: "+91",
    label: "+91 India",
  },
  {
    value: "+1",
    label: "+1 USA / Canada",
  },
  {
    value: "+44",
    label: "+44 United Kingdom",
  },
  {
    value: "+49",
    label: "+49 Germany",
  },
  {
    value: "+33",
    label: "+33 France",
  },
  {
    value: "+81",
    label: "+81 Japan",
  },
  {
    value: "+86",
    label: "+86 China",
  },
  {
    value: "+971",
    label: "+971 UAE",
  },
];


// ============================================================
// COMPONENT
// ============================================================

export default function AddOrganizationPage() {

  const navigate = useNavigate();

  const [logoPreview, setLogoPreview] =
    useState<string | null>(null);

  const [logoFile, setLogoFile] =
    useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [countryId, setCountryId] =
    useState<number | null>(null);

  const [stateId, setStateId] =
    useState<number | null>(null);

  const [submitError, setSubmitError] =
    useState<string | null>(null);


  // ==========================================================
  // FORM
  // ==========================================================

  const form =
    useForm<OrganizationFormValues>({
      resolver: zodResolver(
        organizationSchema
      ),

      defaultValues: {

        orgName: "",

        country: "",

        state: "",

        city: "",

        addressLine1: "",

        addressLine2: "",

        postalCode: "",

        website: "",

        businessType: "",

        contact: {

          firstName: "",

          lastName: "",

          designation: "",

          email: "",

          countryCode: "+91",

          phoneNumber: "",

          primary: true,
        },
      },

      mode: "onBlur",

      reValidateMode: "onChange",
    });


  // ==========================================================
  // LOGO SELECT
  // ==========================================================

  const handleLogoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    // --------------------------------------------------------
    // FILE SIZE
    // --------------------------------------------------------

    const maxSize =
      2 * 1024 * 1024;

    if (file.size > maxSize) {

      setSubmitError(
        "Organization logo must be smaller than 2 MB."
      );

      event.target.value = "";

      return;
    }


    // --------------------------------------------------------
    // FILE TYPE
    // --------------------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {

      setSubmitError(
        "Only JPG, PNG and WEBP images are allowed."
      );

      event.target.value = "";

      return;
    }


    setSubmitError(null);

    setLogoFile(file);


    // --------------------------------------------------------
    // PREVIEW
    // --------------------------------------------------------

    const reader =
      new FileReader();

    reader.onload = () => {

      setLogoPreview(
        reader.result as string
      );
    };

    reader.readAsDataURL(file);
  };


  // ==========================================================
  // REMOVE LOGO
  // ==========================================================

  const removeLogo = () => {

    setLogoFile(null);

    setLogoPreview(null);

    const input =
      document.getElementById(
        "organization-logo"
      ) as HTMLInputElement | null;

    if (input) {
      input.value = "";
    }
  };


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const onSubmit = async (
    values: OrganizationFormValues
  ) => {

    try {

      setIsSubmitting(true);

      setSubmitError(null);


      // ------------------------------------------------------
      // LOGO
      // ------------------------------------------------------

      let orgLogo: string | null = null;

      if (logoFile) {

        orgLogo =
          await fileToBase64(
            logoFile
          );
      }


      // ------------------------------------------------------
      // PAYLOAD
      // ------------------------------------------------------

      const payload = {

        orgName:
          values.orgName.trim(),

        orgLogo,

        country:
          values.country.trim(),

        state:
          values.state.trim(),

        city:
          values.city.trim(),

        addressLine1:
          values.addressLine1.trim(),

        addressLine2:
          values.addressLine2?.trim() || null,

        postalCode:
          values.postalCode.trim(),

        website:
          values.website?.trim() || null,

        businessType:
          values.businessType,

        contact: {

          firstName:
            values.contact.firstName.trim(),

          lastName:
            values.contact.lastName?.trim() || null,

          designation:
            values.contact.designation.trim(),

          email:
            values.contact.email.trim(),

          countryCode:
            values.contact.countryCode,

          phoneNumber:
            values.contact.phoneNumber.trim(),

          primary: true,
        },
      };


      console.log(
        "CREATE ORGANIZATION PAYLOAD",
        payload
      );


      // ------------------------------------------------------
      // API
      // ------------------------------------------------------

      const baseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8080";


      const token =
        localStorage.getItem(
          "accessToken"
        );


      const response =
        await fetch(
          `${baseUrl}/api/v1/organizations`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`,
                  }
                : {}),
            },

            body: JSON.stringify(
              payload
            ),
          }
        );


      // ------------------------------------------------------
      // API ERROR
      // ------------------------------------------------------

      if (!response.ok) {

        let errorMessage =
          "Failed to create organization.";

        try {

          const errorData =
            await response.json();

          errorMessage =
            errorData?.message ||
            errorData?.error ||
            errorMessage;

        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(
          errorMessage
        );
      }


      // ------------------------------------------------------
      // SUCCESS
      // ------------------------------------------------------

      const responseData =
        await response.json();

      console.log(
        "Organization created successfully:",
        responseData
      );


      navigate(
        "/organizations"
      );

    } catch (error) {

      console.error(
        "Create organization failed:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the organization."
      );

    } finally {

      setIsSubmitting(false);
    }
  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div className="min-h-screen bg-muted/30">

      <div className=" w-full max-w-6xl p-6">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() =>
              navigate(
                "/organizations"
              )
            }
            disabled={isSubmitting}
          >

            <ArrowLeft
              className="mr-2 h-4 w-4"
            />

            Back to Organizations

          </Button>


          <h1 className="text-2xl font-semibold tracking-tight">
            Add Organization
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create an organization and add its
            primary contact information.
          </p>

        </div>


        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {submitError && (

          <div
            className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {submitError}
          </div>

        )}


        {/* ================================================== */}
        {/* FORM */}
        {/* ================================================== */}

        <form
          onSubmit={
            form.handleSubmit(
              onSubmit
            )
          }
          className="space-y-6"
          noValidate
        >

          {/* ================================================= */}
          {/* ORGANIZATION INFORMATION */}
          {/* ================================================= */}

          <Card>

            <CardHeader>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">

                  <Building2
                    className="h-5 w-5 text-primary"
                  />

                </div>

                <div>

                  <CardTitle>
                    Organization Information
                  </CardTitle>

                  <CardDescription>
                    Enter the organization's
                    permanent business information.
                  </CardDescription>

                </div>

              </div>

            </CardHeader>


            <CardContent className="space-y-6">

              {/* ============================================ */}
              {/* LOGO + ORGANIZATION NAME */}
              {/* ============================================ */}

              <div className="grid gap-6 md:grid-cols-[140px_1fr]">

                {/* ------------------------------------------ */}
                {/* LOGO */}
                {/* ------------------------------------------ */}

                <div>

                  <FieldLabel>
                    Organization Logo
                  </FieldLabel>


                  <div className="mt-2">

                    {logoPreview ? (

                      <div className="relative h-28 w-28">

                        <img
                          src={logoPreview}
                          alt="Organization logo preview"
                          className="h-28 w-28 rounded-xl border object-cover"
                        />

                        <button
                          type="button"
                          onClick={
                            removeLogo
                          }
                          disabled={
                            isSubmitting
                          }
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-50"
                          aria-label="Remove organization logo"
                        >

                          <X className="h-3.5 w-3.5" />

                        </button>

                      </div>

                    ) : (

                      <label
                        htmlFor="organization-logo"
                        className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 transition-colors hover:bg-muted"
                      >

                        <Upload className="mb-2 h-5 w-5 text-muted-foreground" />

                        <span className="text-xs text-muted-foreground">
                          Upload
                        </span>

                        <input
                          id="organization-logo"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={
                            handleLogoChange
                          }
                          disabled={
                            isSubmitting
                          }
                        />

                      </label>

                    )}

                  </div>


                  <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
                    JPG, PNG or WEBP
                    <br />
                    Maximum 2 MB
                  </p>

                </div>


                {/* ------------------------------------------ */}
                {/* ORGANIZATION NAME */}
                {/* ------------------------------------------ */}

                <Controller
                  name="orgName"
                  control={
                    form.control
                  }
                  render={({
                    field,
                    fieldState,
                  }) => (

                    <Field
                      data-invalid={
                        fieldState.invalid
                      }
                    >

                      <FieldLabel htmlFor="orgName">

                        Organization Name

                        <span className="ml-1 text-destructive">
                          *
                        </span>

                      </FieldLabel>


                      <Input
                        {...field}
                        id="orgName"
                        placeholder="ABC Batteries Pvt Ltd"
                        aria-invalid={
                          fieldState.invalid
                        }
                        disabled={
                          isSubmitting
                        }
                      />


                      {fieldState.invalid && (

                        <FieldError
                          errors={[
                            fieldState.error,
                          ]}
                        />

                      )}

                    </Field>

                  )}
                />

              </div>


              {/* ============================================ */}
              {/* BUSINESS TYPE */}
              {/* ============================================ */}

              <Controller
                name="businessType"
                control={
                  form.control
                }
                render={({
                  field,
                  fieldState,
                }) => (

                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >

                    <FieldLabel htmlFor="businessType">

                      Business Type

                      <span className="ml-1 text-destructive">
                        *
                      </span>

                    </FieldLabel>


                    <Select
                      value={
                        field.value
                      }
                      onValueChange={
                        field.onChange
                      }
                      disabled={
                        isSubmitting
                      }
                    >

                      <SelectTrigger
                        id="businessType"
                        aria-invalid={
                          fieldState.invalid
                        }
                      >

                        <SelectValue
                          placeholder="Select business type"
                        />

                      </SelectTrigger>


                      <SelectContent>

                        {BUSINESS_TYPES.map(
                          (type) => (

                            <SelectItem
                              key={
                                type.value
                              }
                              value={
                                type.value
                              }
                            >

                              {
                                type.label
                              }

                            </SelectItem>

                          )
                        )}

                      </SelectContent>

                    </Select>


                    {fieldState.invalid && (

                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />

                    )}

                  </Field>

                )}
              />


              {/* ============================================ */}
              {/* ADDRESS */}
              {/* ============================================ */}

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <MapPin
                    className="h-4 w-4 text-muted-foreground"
                  />

                  <h3 className="text-sm font-medium">
                    Business Address
                  </h3>

                </div>


                <div className="grid gap-5 md:grid-cols-2">

                  {/* ---------------------------------------- */}
                  {/* COUNTRY */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="country"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <FieldLabel htmlFor="country">

                          Country

                          <span className="ml-1 text-destructive">
                            *
                          </span>

                        </FieldLabel>


                        <Input
                          {...field}
                          id="country"
                          placeholder="India"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* STATE */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="state"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <FieldLabel htmlFor="state">

                          State

                          <span className="ml-1 text-destructive">
                            *
                          </span>

                        </FieldLabel>


                        <Input
                          {...field}
                          id="state"
                          placeholder="Tamil Nadu"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* CITY */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="city"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <FieldLabel htmlFor="city">

                          City

                          <span className="ml-1 text-destructive">
                            *
                          </span>

                        </FieldLabel>


                        <Input
                          {...field}
                          id="city"
                          placeholder="Chennai"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* POSTAL CODE */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="postalCode"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <FieldLabel htmlFor="postalCode">

                          Postal Code

                          <span className="ml-1 text-destructive">
                            *
                          </span>

                        </FieldLabel>


                        <Input
                          {...field}
                          id="postalCode"
                          placeholder="600001"
                          autoComplete="postal-code"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* ADDRESS LINE 1 */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="addressLine1"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                        className="md:col-span-2"
                      >

                        <FieldLabel htmlFor="addressLine1">

                          Address Line 1

                          <span className="ml-1 text-destructive">
                            *
                          </span>

                        </FieldLabel>


                        <Textarea
                          {...field}
                          id="addressLine1"
                          placeholder="Building number, street, industrial area..."
                          className="min-h-[90px] resize-none"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* ADDRESS LINE 2 */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="addressLine2"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                        className="md:col-span-2"
                      >

                        <FieldLabel htmlFor="addressLine2">

                          Address Line 2

                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            Optional
                          </span>

                        </FieldLabel>


                        <Textarea
                          {...field}
                          id="addressLine2"
                          placeholder="Apartment, suite, landmark..."
                          className="min-h-[75px] resize-none"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />

                </div>

              </div>


              {/* ============================================ */}
              {/* WEBSITE */}
              {/* ============================================ */}

              <Controller
                name="website"
                control={
                  form.control
                }
                render={({
                  field,
                  fieldState,
                }) => (

                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >

                    <FieldLabel htmlFor="website">

                      <span className="flex items-center gap-2">

                        <Globe className="h-4 w-4" />

                        Website

                        <span className="text-xs font-normal text-muted-foreground">
                          Optional
                        </span>

                      </span>

                    </FieldLabel>


                    <Input
                      {...field}
                      id="website"
                      type="url"
                      placeholder="https://www.example.com"
                      aria-invalid={
                        fieldState.invalid
                      }
                      disabled={
                        isSubmitting
                      }
                    />


                    {fieldState.invalid && (

                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />

                    )}

                  </Field>

                )}
              />

            </CardContent>

          </Card>


          {/* ================================================= */}
          {/* CONTACT PERSON */}
          {/* ================================================= */}

          <Card>

            <CardHeader>

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">

                  <UserRound
                    className="h-5 w-5 text-primary"
                  />

                </div>

                <div>

                  <CardTitle>
                    Primary Contact Person
                  </CardTitle>

                  <CardDescription>
                    Add the current person responsible
                    for representing this organization.
                  </CardDescription>

                </div>

              </div>

            </CardHeader>


            <CardContent className="space-y-6">

              {/* ============================================ */}
              {/* FIRST + LAST NAME */}
              {/* ============================================ */}

              <div className="grid gap-5 md:grid-cols-2">

                {/* ------------------------------------------ */}
                {/* FIRST NAME */}
                {/* ------------------------------------------ */}

                <Controller
                  name="contact.firstName"
                  control={
                    form.control
                  }
                  render={({
                    field,
                    fieldState,
                  }) => (

                    <Field
                      data-invalid={
                        fieldState.invalid
                      }
                    >

                      <FieldLabel htmlFor="contact-firstName">

                        First Name

                        <span className="ml-1 text-destructive">
                          *
                        </span>

                      </FieldLabel>


                      <Input
                        {...field}
                        id="contact-firstName"
                        placeholder="John"
                        autoComplete="given-name"
                        aria-invalid={
                          fieldState.invalid
                        }
                        disabled={
                          isSubmitting
                        }
                      />


                      {fieldState.invalid && (

                        <FieldError
                          errors={[
                            fieldState.error,
                          ]}
                        />

                      )}

                    </Field>

                  )}
                />


                {/* ------------------------------------------ */}
                {/* LAST NAME */}
                {/* ------------------------------------------ */}

                <Controller
                  name="contact.lastName"
                  control={
                    form.control
                  }
                  render={({
                    field,
                    fieldState,
                  }) => (

                    <Field
                      data-invalid={
                        fieldState.invalid
                      }
                    >

                      <FieldLabel htmlFor="contact-lastName">

                        Last Name

                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Optional
                        </span>

                      </FieldLabel>


                      <Input
                        {...field}
                        id="contact-lastName"
                        placeholder="David"
                        autoComplete="family-name"
                        aria-invalid={
                          fieldState.invalid
                        }
                        disabled={
                          isSubmitting
                        }
                      />


                      {fieldState.invalid && (

                        <FieldError
                          errors={[
                            fieldState.error,
                          ]}
                        />

                      )}

                    </Field>

                  )}
                />

              </div>


              {/* ============================================ */}
              {/* DESIGNATION */}
              {/* ============================================ */}

              <Controller
                name="contact.designation"
                control={
                  form.control
                }
                render={({
                  field,
                  fieldState,
                }) => (

                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >

                    <FieldLabel htmlFor="contact-designation">

                      Designation

                      <span className="ml-1 text-destructive">
                        *
                      </span>

                    </FieldLabel>


                    <Input
                      {...field}
                      id="contact-designation"
                      placeholder="CEO / Managing Director / Plant Head"
                      aria-invalid={
                        fieldState.invalid
                      }
                      disabled={
                        isSubmitting
                      }
                    />


                    {fieldState.invalid && (

                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />

                    )}

                  </Field>

                )}
              />


              {/* ============================================ */}
              {/* EMAIL */}
              {/* ============================================ */}

              <Controller
                name="contact.email"
                control={
                  form.control
                }
                render={({
                  field,
                  fieldState,
                }) => (

                  <Field
                    data-invalid={
                      fieldState.invalid
                    }
                  >

                    <FieldLabel htmlFor="contact-email">

                      <span className="flex items-center gap-2">

                        <Mail className="h-4 w-4" />

                        Email Address

                        <span className="text-destructive">
                          *
                        </span>

                      </span>

                    </FieldLabel>


                    <Input
                      {...field}
                      id="contact-email"
                      type="email"
                      placeholder="john@example.com"
                      autoComplete="email"
                      aria-invalid={
                        fieldState.invalid
                      }
                      disabled={
                        isSubmitting
                      }
                    />


                    {fieldState.invalid && (

                      <FieldError
                        errors={[
                          fieldState.error,
                        ]}
                      />

                    )}

                  </Field>

                )}
              />


              {/* ============================================ */}
              {/* PHONE */}
              {/* ============================================ */}

              <div>

                <div className="mb-2">

                  <FieldLabel>

                    <span className="flex items-center gap-2">

                      <Phone className="h-4 w-4" />

                      Phone Number

                      <span className="text-destructive">
                        *
                      </span>

                    </span>

                  </FieldLabel>

                </div>


                <div className="grid grid-cols-[150px_1fr] gap-3">

                  {/* ---------------------------------------- */}
                  {/* COUNTRY CODE */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="contact.countryCode"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <Select
                          value={
                            field.value
                          }
                          onValueChange={
                            field.onChange
                          }
                          disabled={
                            isSubmitting
                          }
                        >

                          <SelectTrigger
                            aria-invalid={
                              fieldState.invalid
                            }
                          >

                            <SelectValue />

                          </SelectTrigger>


                          <SelectContent>

                            {COUNTRY_CODES.map(
                              (country) => (

                                <SelectItem
                                  key={
                                    country.value
                                  }
                                  value={
                                    country.value
                                  }
                                >

                                  {
                                    country.label
                                  }

                                </SelectItem>

                              )
                            )}

                          </SelectContent>

                        </Select>


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />


                  {/* ---------------------------------------- */}
                  {/* PHONE */}
                  {/* ---------------------------------------- */}

                  <Controller
                    name="contact.phoneNumber"
                    control={
                      form.control
                    }
                    render={({
                      field,
                      fieldState,
                    }) => (

                      <Field
                        data-invalid={
                          fieldState.invalid
                        }
                      >

                        <Input
                          {...field}
                          id="contact-phoneNumber"
                          type="tel"
                          inputMode="numeric"
                          placeholder="9876543210"
                          maxLength={15}
                          autoComplete="tel"
                          aria-invalid={
                            fieldState.invalid
                          }
                          disabled={
                            isSubmitting
                          }
                          onChange={(
                            event
                          ) => {

                            const value =
                              event.target.value
                                .replace(
                                  /\D/g,
                                  ""
                                );

                            field.onChange(
                              value
                            );
                          }}
                        />


                        {fieldState.invalid && (

                          <FieldError
                            errors={[
                              fieldState.error,
                            ]}
                          />

                        )}

                      </Field>

                    )}
                  />

                </div>

              </div>


              {/* ============================================ */}
              {/* PRIMARY INFORMATION */}
              {/* ============================================ */}

              <div className="rounded-lg border bg-muted/30 px-4 py-3">

                <p className="text-sm font-medium">
                  Primary Contact
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  This person will be stored as the
                  organization's current primary contact.
                </p>

              </div>

            </CardContent>

          </Card>


          {/* ================================================= */}
          {/* ACTION BUTTONS */}
          {/* ================================================= */}

          {/* <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <Button
              type="button"
              variant="outline"
              disabled={
                isSubmitting
              }
              onClick={() =>
                navigate(
                  "/organizations"
                )
              }
            >
              Cancel
            </Button>


            <Button
              type="submit"
              disabled={
                isSubmitting
              }
            >

              {isSubmitting ? (

                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

                  Creating...

                </>

              ) : (

                <>
                  <Save className="mr-2 h-4 w-4" />

                  Create Organization
                </>

              )}

            </Button>

          </div> */}
          {/* ================================================= */}
{/* STICKY ACTION BAR */}
{/* ================================================= */}

<div
  className="
    sticky
    bottom-0
    z-40
    -mx-6
    mt-6
    border-t
    bg-background/95
    px-6
    py-4
    backdrop-blur
    supports-[backdrop-filter]:bg-background/80
  "
>
  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

    <Button
      type="button"
      variant="outline"
      disabled={isSubmitting}
      onClick={() =>
        navigate("/organizations")
      }
    >
      Cancel
    </Button>

    <Button
      type="submit"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <>
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />

          Creating...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />

          Create Organization
        </>
      )}
    </Button>

  </div>
</div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// FILE → BASE64
// ============================================================

function fileToBase64(
  file: File
): Promise<string> {

  return new Promise(
    (resolve, reject) => {

      const reader =
        new FileReader();

      reader.onload = () => {

        const result =
          reader.result;

        if (
          typeof result !==
          "string"
        ) {
          reject(
            new Error(
              "Failed to read organization logo."
            )
          );

          return;
        }


        /*
         * Remove:
         *
         * data:image/png;base64,
         *
         * and return only the actual
         * Base64 content.
         *
         * This is appropriate when the
         * Spring Boot DTO uses byte[].
         */

        const base64 =
          result.includes(",")
            ? result.split(",")[1]
            : result;

        resolve(base64);
      };


      reader.onerror = () => {

        reject(
          new Error(
            "Failed to read organization logo."
          )
        );

      };


      reader.readAsDataURL(file);
    }
  );
}