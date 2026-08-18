import {
  useEffect,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import * as z from "zod";

import {
  ArrowLeft,
  Building2,
  Loader2,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "@/api/api";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


/* ============================================================
   TYPES
============================================================ */

interface Organization {
  id: string;
  orgName?: string;
  active?: boolean;
  deleted?: boolean;
}

interface Department {
  id: string;
  organizationId: string;
  departmentName: string;
  departmentCode: string;
  active: boolean;
  deleted: boolean;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
}


/* ============================================================
   SCHEMA
============================================================ */

const employeeSchema =
  z.object({
    organizationId: z
      .string()
      .min(
        1,
        "Organization is required"
      ),

    departmentId: z
      .string()
      .optional(),

    employeeCode: z
      .string()
      .trim()
      .min(
        1,
        "Employee code is required"
      )
      .max(
        30,
        "Employee code cannot exceed 30 characters"
      )
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Employee code can contain only letters, numbers, _ and -"
      ),

    firstName: z
      .string()
      .trim()
      .min(
        2,
        "First name must be at least 2 characters"
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

    email: z
      .string()
      .trim()
      .email(
        "Enter a valid email address"
      )
      .max(
        150,
        "Email cannot exceed 150 characters"
      ),

    phoneNumber: z
      .string()
      .trim()
      .max(
        13,
        "Phone number cannot exceed 13 digits"
      )
      .regex(
        /^[0-9]*$/,
        "Phone number can contain only digits"
      ),

    designation: z
      .string()
      .trim()
      .max(
        100,
        "Designation cannot exceed 100 characters"
      ),
  });


type EmployeeFormValues =
  z.infer<
    typeof employeeSchema
  >;


/* ============================================================
   API
============================================================ */

async function fetchOrganizations(): Promise<
  Organization[]
> {
  const response =
    await api.get(
      "/api/v1/organizations?size=100"
    );

  const data =
    response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
}


async function fetchDepartments(
  organizationId: string
): Promise<Department[]> {
  const response =
    await api.get(
      `/api/v1/departments?organizationId=${encodeURIComponent(
        organizationId
      )}&size=100`
    );

  const data =
    response.data?.data ??
    response.data;

  return (
    data?.content ??
    data ??
    []
  );
}


/* ============================================================
   PAGE
============================================================ */

export default function AddEmployeePage() {
  const navigate =
    useNavigate();

  const [
    organizations,
    setOrganizations,
  ] = useState<
    Organization[]
  >([]);

  const [
    departments,
    setDepartments,
  ] = useState<
    Department[]
  >([]);

  const [
    isLoadingOrganizations,
    setIsLoadingOrganizations,
  ] = useState(true);

  const [
    isLoadingDepartments,
    setIsLoadingDepartments,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState("");


  const form =
    useForm<EmployeeFormValues>({
      resolver:
        zodResolver(
          employeeSchema
        ),

      defaultValues: {
        organizationId: "",
        departmentId: "",
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        designation: "",
      },

      mode: "onBlur",

      reValidateMode:
        "onChange",
    });


  const organizationId =
    form.watch(
      "organizationId"
    );


  /* ==========================================================
     LOAD ORGANIZATIONS
  ========================================================== */

  useEffect(() => {
    const load =
      async () => {
        try {
          setIsLoadingOrganizations(
            true
          );

          const data =
            await fetchOrganizations();

          setOrganizations(
            data.filter(
              (
                organization
              ) =>
                organization.deleted !==
                  true &&
                organization.active !==
                  false
            )
          );
        } catch (error) {
          const apiError =
            error as {
              response?: {
                data?: ApiErrorResponse;
              };
            };

          setSubmitError(
            apiError.response?.data
              ?.message ??
              apiError.response?.data
                ?.error ??
              "Failed to load organizations."
          );
        } finally {
          setIsLoadingOrganizations(
            false
          );
        }
      };

    void load();
  }, []);


  /* ==========================================================
     LOAD DEPARTMENTS
  ========================================================== */

  useEffect(() => {
    if (!organizationId) {
      setDepartments([]);
      form.setValue(
        "departmentId",
        ""
      );
      return;
    }

    const load =
      async () => {
        try {
          setIsLoadingDepartments(
            true
          );

          const data =
            await fetchDepartments(
              organizationId
            );

          setDepartments(
            data.filter(
              (
                department
              ) =>
                department.deleted !==
                  true &&
                department.active !==
                  false
            )
          );
        } catch (error) {
          const apiError =
            error as {
              response?: {
                data?: ApiErrorResponse;
              };
            };

          setSubmitError(
            apiError.response?.data
              ?.message ??
              apiError.response?.data
                ?.error ??
              "Failed to load departments."
          );
        } finally {
          setIsLoadingDepartments(
            false
          );
        }
      };

    void load();
  }, [
    organizationId,
    form,
  ]);


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit =
    async (
      values: EmployeeFormValues
    ) => {
      try {
        setIsSubmitting(true);
        setSubmitError("");

        const payload = {
          organizationId:
            values.organizationId,

          departmentId:
            values.departmentId ||
            null,

          employeeCode:
            values.employeeCode
              .trim()
              .toUpperCase(),

          firstName:
            values.firstName.trim(),

          lastName:
            values.lastName
              ?.trim() ||
            null,

          email:
            values.email
              .trim()
              .toLowerCase(),

          phoneNumber:
            values.phoneNumber
              ?.trim() ||
            null,

          designation:
            values.designation
              ?.trim() ||
            null,
        };

        await api.post(
          "/api/v1/employees",
          payload
        );

        navigate(
          "/employees"
        );
      } catch (error) {
        const apiError =
          error as {
            response?: {
              data?: ApiErrorResponse;
            };
            message?: string;
          };

        setSubmitError(
          apiError.response?.data
            ?.message ??
            apiError.response?.data
              ?.error ??
            apiError.message ??
            "Failed to create employee."
        );
      } finally {
        setIsSubmitting(false);
      }
    };


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">

        {/* HEADER */}

        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-3"
            onClick={() =>
              navigate(
                "/employees"
              )
            }
            disabled={
              isSubmitting
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>

          <h1 className="text-2xl font-semibold tracking-tight">
            Add Employee
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Create an employee and associate the employee with an organization and department.
          </p>
        </div>


        {/* ERROR */}

        {submitError && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}


        <form
          onSubmit={form.handleSubmit(
            onSubmit
          )}
          className="space-y-6"
        >

          {/* ORGANIZATION */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <CardTitle>
                    Organization Assignment
                  </CardTitle>

                  <CardDescription>
                    Select the organization and department for this employee.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">

                {/* ORGANIZATION */}

                <form.Field>
                  <Field>
                    <FieldLabel>
                      Organization
                    </FieldLabel>

                    <Select
                      value={
                        form.watch(
                          "organizationId"
                        )
                      }
                      onValueChange={(
                        value
                      ) =>
                        form.setValue(
                          "organizationId",
                          value,
                          {
                            shouldValidate:
                              true,
                          }
                        )
                      }
                      disabled={
                        isLoadingOrganizations ||
                        isSubmitting
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select organization" />
                      </SelectTrigger>

                      <SelectContent>
                        {organizations.map(
                          (
                            organization
                          ) => (
                            <SelectItem
                              key={
                                organization.id
                              }
                              value={
                                organization.id
                              }
                            >
                              {
                                organization.orgName
                              }
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>

                    {form.formState
                      .errors
                      .organizationId && (
                      <FieldError>
                        {
                          form.formState
                            .errors
                            .organizationId
                            .message
                        }
                      </FieldError>
                    )}
                  </Field>
                </form.Field>


                {/* DEPARTMENT */}

                <Field>
                  <FieldLabel>
                    Department
                  </FieldLabel>

                  <Select
                    value={
                      form.watch(
                        "departmentId"
                      ) ||
                      "NONE"
                    }
                    onValueChange={(
                      value
                    ) =>
                      form.setValue(
                        "departmentId",
                        value ===
                          "NONE"
                          ? ""
                          : value
                      )
                    }
                    disabled={
                      !organizationId ||
                      isLoadingDepartments ||
                      isSubmitting
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="NONE">
                        No Department
                      </SelectItem>

                      {departments.map(
                        (
                          department
                        ) => (
                          <SelectItem
                            key={
                              department.id
                            }
                            value={
                              department.id
                            }
                          >
                            {
                              department.departmentName
                            }
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </Field>

              </div>
            </CardContent>
          </Card>


          {/* EMPLOYEE DETAILS */}

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <UserRound className="h-5 w-5 text-primary" />
                </div>

                <div>
                  <CardTitle>
                    Employee Details
                  </CardTitle>

                  <CardDescription>
                    Enter the employee's identity and professional information.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">

                {/* EMPLOYEE CODE */}

                <Field>
                  <FieldLabel>
                    Employee Code
                  </FieldLabel>

                  <Input
                    placeholder="EMP001"
                    disabled={
                      isSubmitting
                    }
                    {...form.register(
                      "employeeCode"
                    )}
                  />

                  {form.formState
                    .errors
                    .employeeCode && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .employeeCode
                          .message
                      }
                    </FieldError>
                  )}
                </Field>


                {/* DESIGNATION */}

                <Field>
                  <FieldLabel>
                    Designation
                  </FieldLabel>

                  <Input
                    placeholder="Software Engineer"
                    disabled={
                      isSubmitting
                    }
                    {...form.register(
                      "designation"
                    )}
                  />

                  {form.formState
                    .errors
                    .designation && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .designation
                          .message
                      }
                    </FieldError>
                  )}
                </Field>


                {/* FIRST NAME */}

                <Field>
                  <FieldLabel>
                    First Name
                  </FieldLabel>

                  <Input
                    placeholder="John"
                    disabled={
                      isSubmitting
                    }
                    {...form.register(
                      "firstName"
                    )}
                  />

                  {form.formState
                    .errors
                    .firstName && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .firstName
                          .message
                      }
                    </FieldError>
                  )}
                </Field>


                {/* LAST NAME */}

                <Field>
                  <FieldLabel>
                    Last Name
                  </FieldLabel>

                  <Input
                    placeholder="Doe"
                    disabled={
                      isSubmitting
                    }
                    {...form.register(
                      "lastName"
                    )}
                  />

                  {form.formState
                    .errors
                    .lastName && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .lastName
                          .message
                      }
                    </FieldError>
                  )}
                </Field>


                {/* EMAIL */}

                <Field>
                  <FieldLabel>
                    Email
                  </FieldLabel>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      className="pl-9"
                      disabled={
                        isSubmitting
                      }
                      {...form.register(
                        "email"
                      )}
                    />
                  </div>

                  {form.formState
                    .errors
                    .email && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .email
                          .message
                      }
                    </FieldError>
                  )}
                </Field>


                {/* PHONE */}

                <Field>
                  <FieldLabel>
                    Phone Number
                  </FieldLabel>

                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      type="tel"
                      inputMode="numeric"
                      placeholder="9876543210"
                      className="pl-9"
                      disabled={
                        isSubmitting
                      }
                      {...form.register(
                        "phoneNumber"
                      )}
                    />
                  </div>

                  {form.formState
                    .errors
                    .phoneNumber && (
                    <FieldError>
                      {
                        form.formState
                          .errors
                          .phoneNumber
                          .message
                      }
                    </FieldError>
                  )}
                </Field>

              </div>
            </CardContent>
          </Card>


          {/* FOOTER */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  "/employees"
                )
              }
              disabled={
                isSubmitting
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}

              Create Employee
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}