import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

import { cn } from "@/lib/utils";
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface LoginFormProps extends React.ComponentProps<"div"> {}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export function LoginForm({
  className,
  ...props
}: LoginFormProps) {
  const { login } = useAuth();
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------------
  // EMAIL VALIDATION
  // ----------------------------------------------------------

  const validateEmail = (value: string): string => {
    const trimmedEmail = value.trim();

    if (!trimmedEmail) {
      return "Email is required.";
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  // ----------------------------------------------------------
  // PASSWORD VALIDATION
  // ----------------------------------------------------------

  const validatePassword = (value: string): string => {
    if (!value) {
      return "Password is required.";
    }

    return "";
  };

  // ----------------------------------------------------------
  // EMAIL CHANGE
  // ----------------------------------------------------------

  const handleEmailChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setEmail(value);

    // Remove backend error when user starts editing
    if (errors.general) {
      setErrors((previous) => ({
        ...previous,
        general: undefined,
      }));
    }

    // Validate only after field has been touched
    if (touched.email) {
      const emailError = validateEmail(value);

      setErrors((previous) => ({
        ...previous,
        email: emailError || undefined,
      }));
    }
  };

  // ----------------------------------------------------------
  // PASSWORD CHANGE
  // ----------------------------------------------------------

  const handlePasswordChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    setPassword(value);

    // Remove backend error when user starts editing
    if (errors.general) {
      setErrors((previous) => ({
        ...previous,
        general: undefined,
      }));
    }

    // Validate only after field has been touched
    if (touched.password) {
      const passwordError = validatePassword(value);

      setErrors((previous) => ({
        ...previous,
        password: passwordError || undefined,
      }));
    }
  };

  // ----------------------------------------------------------
  // EMAIL BLUR
  // ----------------------------------------------------------

  const handleEmailBlur = () => {
    setTouched((previous) => ({
      ...previous,
      email: true,
    }));

    const emailError = validateEmail(email);

    setErrors((previous) => ({
      ...previous,
      email: emailError || undefined,
    }));
  };

  // ----------------------------------------------------------
  // PASSWORD BLUR
  // ----------------------------------------------------------

  const handlePasswordBlur = () => {
    setTouched((previous) => ({
      ...previous,
      password: true,
    }));

    const passwordError = validatePassword(password);

    setErrors((previous) => ({
      ...previous,
      password: passwordError || undefined,
    }));
  };

  // ----------------------------------------------------------
  // FORM VALIDATION
  // ----------------------------------------------------------

  const validateForm = (): boolean => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const newErrors: FormErrors = {};

    if (emailError) {
      newErrors.email = emailError;
    }

    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------------------------------
  // SUBMIT
  // ----------------------------------------------------------

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrors({});

    const valid = validateForm();

    if (!valid) {
      setTouched({
        email: true,
        password: true,
      });

      return;
    }

    try {
      setLoading(true);

      await login(
        email.trim(),
        password
      );

      navigate("/");
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message;

      setErrors({
        general:
          backendMessage ||
          "Invalid email or password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        className
      )}
      {...props}
    >
      <Card>
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <CardHeader>
          <CardTitle>
            Login to your account
          </CardTitle>

          <CardDescription>
            Enter your email and password to continue
          </CardDescription>
        </CardHeader>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <CardContent>
          <form
            onSubmit={handleSubmit}
            noValidate
          >
            <FieldGroup>

              {/* ================================================= */}
              {/* EMAIL */}
              {/* ================================================= */}

              <Field>
                <FieldLabel htmlFor="email">
                  Email
                </FieldLabel>

                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={loading}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email
                      ? "email-error"
                      : undefined
                  }
                  className={cn(
                    errors.email &&
                      "border-red-500"
                  )}
                />

                {errors.email && (
                  <p
                    id="email-error"
                    className="text-xs text-red-500"
                  >
                    {errors.email}
                  </p>
                )}
              </Field>

              {/* ================================================= */}
              {/* PASSWORD */}
              {/* ================================================= */}

              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">
                    Password
                  </FieldLabel>

                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </a>
                </div>

                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={handlePasswordBlur}
                  disabled={loading}
                  autoComplete="current-password"
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : undefined
                  }
                  className={cn(
                    errors.password &&
                      "border-red-500"
                  )}
                />

                {errors.password && (
                  <p
                    id="password-error"
                    className="text-xs text-red-500"
                  >
                    {errors.password}
                  </p>
                )}
              </Field>

              {/* ================================================= */}
              {/* BACKEND / GENERAL ERROR */}
              {/* ================================================= */}

              {errors.general && (
                <div
                  role="alert"
                  className="text-sm text-red-500"
                >
                  {errors.general}
                </div>
              )}

              {/* ================================================= */}
              {/* LOGIN BUTTON */}
              {/* ================================================= */}

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </Button>

                <FieldDescription className="text-center">
                  Don&apos;t have an account?{" "}
                  <a
                    href="#"
                    className="underline underline-offset-4"
                  >
                    Contact Us
                  </a>
                </FieldDescription>
              </Field>

            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}