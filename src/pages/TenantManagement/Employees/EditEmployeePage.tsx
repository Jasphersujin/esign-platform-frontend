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
  useParams,
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

interface EmployeeResponse {
  id: string;
  organizationId?: string | null;
  departmentId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  phoneNumber?: string | null;
  designation?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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

    active: z.boolean(),
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

export default function EditEmployeePage() {
  const navigate =
    useNavigate();

  const { id } =
    useParams<{
      id: string;
    }>();

  const [
    employeeCode,
    setEmployeeCode,
  ] = useState("");

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
    isLoading,
    setIsLoading,
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
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        designation: "",
        active: true,
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
     LOAD EMPLOYEE + ORGANIZATIONS
  ========================================================== */

  useEffect(() => {
    if (!id) {
      setSubmitError(
        "Employee ID is missing."
      );

      setIsLoading(false);

      return;
    }

    const load =
      async () => {
        try {
          setIsLoading(true);
          setSubmitError("");

          const [
            employeeResponse,
            organizationData,
          ] = await Promise.all([
            api.get(
              `/api/v1/employees/${id}`
            ),
            fetchOrganizations(),
          ]);

          const employee: EmployeeResponse =
            employeeResponse
              .data?.data ??
            employeeResponse.data;

          setOrganizations(
            organizationData.filter(
              (
                organization
              ) =>
                organization.deleted !==
                  true
            )
          );

          setEmployeeCode(
            employee.employeeCode
          );

          form.reset({
            organizationId:
              employee.organizationId ??
              "",

            departmentId:
              employee.departmentId ??
              "",

            firstName:
              employee.firstName ??
              "",

            lastName:
              employee.lastName ??
              "",

            email:
              employee.email ??
              "",

            phoneNumber:
              employee.phoneNumber ??
              "",

            designation:
              employee.designation ??
              "",

            active:
              employee.active,
          });

          if (
            employee.organizationId
          ) {
            const departmentData =
              await fetchDepartments(
                employee.organizationId
              );

            setDepartments(
              departmentData.filter(
                (
                  department
                ) =>
                  department.deleted !==
                    true
              )
            );
          }
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
              "Failed to load employee."
          );
        } finally {
          setIsLoading(false);
        }
      };

    void load();
  }, [
    id,
    form,
  ]);


  /* ==========================================================
     ORGANIZATION CHANGE
  ========================================================== */

  useEffect(() => {
    if (
      !organizationId ||
      !id
    ) {
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
    id,
  ]);


  /* ==========================================================
     SUBMIT
  ========================================================== */

  const onSubmit =
    async (
      values: EmployeeFormValues
    ) => {
      if (!id) {
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmitError("");

        const payload = {
          organizationId:
            values.organizationId,

          departmentId:
            values.departmentId ||
            null,

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

          active:
            values.active,
        };

        await api.put(
          `/api/v1/employees/${id}`,
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
            "Failed to update employee."
        );
      } finally {
        setIsSubmitting(false);
      }
    };


  /* ==========================================================
     LOADING
  ========================================================== */

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">
            Loading employee...
          </p>
        </div>
      </div>
    );
  }


  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="w-full min-w-0 bg-muted/20">
      <div className="w-full max-w-5xl p-4 sm:p-6">

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
            Edit Employee
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Update employee information and assignment.
          </p>
        </div>


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
                    Update the employee's organization and department.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">

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
                    ) => {
                      form.setValue(
                        "organizationId",
                        value,
                        {
                          shouldValidate:
                            true,
                        }
                      );

                      form.setValue(
                        "departmentId",
                        ""
                      );
                    }}
                    disabled={
                      isSubmitting
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>

                    <SelectContent>
                      {organizations
                        .filter(
                          (
                            organization
                          ) =>
                            organization.deleted !==
                              true &&
                            organization.active !==
                              false
                        )
                        .map(
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


          {/* EMPLOYEE */}

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
                    Update employee identity and professional information.
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
                    value={
                      employeeCode
                    }
                    disabled
                    className="bg-muted"
                  />

                  <p className="text-xs text-muted-foreground">
                    Employee code cannot be changed.
                  </p>
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


                {/* ACTIVE */}

                <Field>
                  <FieldLabel>
                    Status
                  </FieldLabel>

                  <Select
                    value={
                      form.watch(
                        "active"
                      )
                        ? "ACTIVE"
                        : "INACTIVE"
                    }
                    onValueChange={(
                      value
                    ) =>
                      form.setValue(
                        "active",
                        value ===
                          "ACTIVE"
                      )
                    }
                    disabled={
                      isSubmitting
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="ACTIVE">
                        Active
                      </SelectItem>

                      <SelectItem value="INACTIVE">
                        Inactive
                      </SelectItem>
                    </SelectContent>
                  </Select>
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

              Save Changes
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}