import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import api from "@/api/api";


/* ============================================================
   TYPES
============================================================ */

interface OrganizationContact {
  id?: string;

  firstName?: string;

  lastName?: string | null;

  designation?: string;

  email?: string;

  countryCode?: string;

  phoneNumber?: string;

  primary?: boolean;

  active?: boolean;

  effectiveFrom?: string;

  effectiveTo?: string | null;
}


interface Organization {
  id: string;

  orgName?: string;

  orgLogo?: string | null;

  country?: string;

  state?: string;

  city?: string;

  addressLine1?: string;

  addressLine2?: string | null;

  postalCode?: string;

  website?: string | null;

  businessType?: string;

  /*
   * IMPORTANT:
   *
   * Backend returns contacts as an ARRAY.
   */
  contacts?: OrganizationContact[];
}


/* ============================================================
   BUSINESS TYPE LABEL
============================================================ */

const BUSINESS_TYPE_LABELS: Record<
  string,
  string
> = {
  MANUFACTURER: "Manufacturer",
  SUPPLIER: "Supplier",
  DISTRIBUTOR: "Distributor",
  RETAILER: "Retailer",
  LOGISTICS: "Logistics",
  RECYCLER: "Recycler",
  OTHER: "Other",
};


/* ============================================================
   COMPONENT
============================================================ */

export default function ViewOrganizationPage() {

  const navigate =
    useNavigate();


  const {
    id,
  } = useParams<{
    id: string;
  }>();


  /* ==========================================================
     STATE
  ========================================================== */

  const [
    organization,
    setOrganization,
  ] = useState<
    Organization | null
  >(null);


  const [
    isLoading,
    setIsLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);


  /* ==========================================================
     LOAD ORGANIZATION
  ========================================================== */

  useEffect(() => {

    if (!id) {

      setError(
        "Organization ID is missing."
      );

      setIsLoading(false);

      return;

    }


    const loadOrganization =
      async () => {

        try {

          setIsLoading(true);

          setError(null);


          const response =
            await api.get(
              `/api/v1/organizations/${id}`
            );


          console.log(
            "VIEW ORGANIZATION RESPONSE:",
            response.data
          );


          /*
           * Supports:
           *
           * {
           *   data: {...}
           * }
           *
           * OR
           *
           * {...}
           */

          const data:
            Organization =
            response.data?.data ??
            response.data;


          console.log(
            "VIEW ORGANIZATION DATA:",
            data
          );


          /*
           * IMPORTANT:
           *
           * Backend returns:
           *
           * contacts: [...]
           *
           * so make sure the page stores the
           * complete organization object.
           */

          setOrganization(data);

        } catch (
          error: any
        ) {

          console.error(
            "Failed to load organization:",
            error
          );


          setError(

            error
              ?.response
              ?.data
              ?.message ??

            error
              ?.response
              ?.data
              ?.error ??

            "Failed to load organization."

          );

        } finally {

          setIsLoading(false);

        }

      };


    loadOrganization();

  }, [id]);


  /* ============================================================
     LOGO
  ============================================================ */

  const getLogoUrl = (
    logo:
      string |
      null |
      undefined
  ) => {

    if (!logo) {
      return null;
    }


    /*
     * Already a complete data URL.
     */

    if (
      logo.startsWith(
        "data:"
      )
    ) {

      return logo;

    }


    /*
     * Backend returns raw Base64.
     */

    return `data:image/png;base64,${logo}`;

  };


  /* ============================================================
     PRIMARY CONTACT
  ============================================================ */

  const getPrimaryContact = (
    contacts?:
      OrganizationContact[]
  ): OrganizationContact | null => {

    if (
      !contacts ||
      contacts.length === 0
    ) {

      return null;

    }


    /*
     * First preference:
     * contact where primary === true
     */

    const primaryContact =
      contacts.find(
        (contact) =>
          contact.primary === true
      );


    if (primaryContact) {

      return primaryContact;

    }


    /*
     * Fallback:
     * first contact
     */

    return contacts[0];

  };


  /* ============================================================
     FULL CONTACT NAME
  ============================================================ */

  const getContactName = (
    contact?:
      OrganizationContact |
      null
  ) => {

    if (!contact) {

      return "Not available";

    }


    const fullName = [

      contact.firstName,

      contact.lastName,

    ]
      .filter(
        Boolean
      )
      .join(" ")
      .trim();


    return (
      fullName ||
      "Not available"
    );

  };


  /* ============================================================
     BUSINESS TYPE
  ============================================================ */

  const getBusinessTypeLabel = (
    businessType?: string
  ) => {

    if (!businessType) {

      return "Not available";

    }


    return (
      BUSINESS_TYPE_LABELS[
        businessType
      ] ??
      businessType
    );

  };


  /* ============================================================
     ADDRESS
  ============================================================ */

  const getAddress = () => {

    if (!organization) {

      return "";

    }


    return [

      organization.addressLine1,

      organization.addressLine2,

      organization.city,

      organization.state,

      organization.country,

      organization.postalCode,

    ]
      .filter(
        Boolean
      )
      .join(", ");

  };


  /* ============================================================
     LOADING
  ============================================================ */

  if (isLoading) {

    return (

      <div className="min-h-screen bg-muted/30">

        <div className="flex min-h-[60vh] items-center justify-center">

          <div className="flex flex-col items-center gap-3">

            <span
              className="
                h-7
                w-7
                animate-spin
                rounded-full
                border-2
                border-primary
                border-t-transparent
              "
            />

            <p className="text-sm text-muted-foreground">

              Loading organization...

            </p>

          </div>

        </div>

      </div>

    );

  }


  /* ============================================================
     ERROR
  ============================================================ */

  if (error) {

    return (

      <div className="min-h-screen bg-muted/30">

        <div className="w-full max-w-6xl p-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-4"
            onClick={() =>
              navigate(
                "/organizations"
              )
            }
          >

            <ArrowLeft
              className="mr-2 h-4 w-4"
            />

            Back to Organizations

          </Button>


          <div
            className="
              rounded-lg
              border
              border-destructive/30
              bg-destructive/5
              px-4
              py-4
              text-sm
              text-destructive
            "
          >

            {error}

          </div>

        </div>

      </div>

    );

  }


  /* ============================================================
     NOT FOUND
  ============================================================ */

  if (!organization) {

    return (

      <div className="min-h-screen bg-muted/30">

        <div className="w-full max-w-6xl p-6">

          <Button
            type="button"
            variant="ghost"
            className="-ml-2 mb-4"
            onClick={() =>
              navigate(
                "/organizations"
              )
            }
          >

            <ArrowLeft
              className="mr-2 h-4 w-4"
            />

            Back to Organizations

          </Button>


          <div
            className="
              rounded-lg
              border
              bg-background
              p-6
            "
          >

            <p
              className="
                text-sm
                text-muted-foreground
              "
            >

              Organization not found.

            </p>

          </div>

        </div>

      </div>

    );

  }


  /* ============================================================
     DATA
  ============================================================ */

  /*
   * IMPORTANT FIX
   *
   * Backend:
   *
   * contacts: [...]
   *
   * Frontend:
   *
   * Find primary contact.
   */

  const contact =
    getPrimaryContact(
      organization.contacts
    );


  console.log(
    "VIEW PRIMARY CONTACT:",
    contact
  );


  const logoUrl =
    getLogoUrl(
      organization.orgLogo
    );


  const contactName =
    getContactName(
      contact
    );


  /* ============================================================
     RENDER
  ============================================================ */

  return (

    <div className="min-h-screen bg-muted/30">

      <div className="w-full max-w-6xl p-6">

        {/* ======================================================
            HEADER
        ====================================================== */}

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
          >

            <ArrowLeft
              className="mr-2 h-4 w-4"
            />

            Back to Organizations

          </Button>


          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >

            <div>

              <h1
                className="
                  text-2xl
                  font-semibold
                  tracking-tight
                "
              >

                Organization Details

              </h1>


              <p
                className="
                  mt-1
                  text-sm
                  text-muted-foreground
                "
              >

                View organization information and
                current primary contact.

              </p>

            </div>


            <Button
              type="button"
              onClick={() =>
                navigate(
                  `/organizations/${organization.id}/edit`
                )
              }
            >

              <Pencil
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Edit Organization

            </Button>

          </div>

        </div>


        {/* ======================================================
            ORGANIZATION OVERVIEW
        ====================================================== */}

        <Card className="mb-6">

          <CardContent className="p-6">

            <div
              className="
                flex
                flex-col
                gap-6
                sm:flex-row
                sm:items-center
              "
            >

              {/* LOGO */}

              <div className="shrink-0">

                {logoUrl ? (

                  <img
                    src={logoUrl}
                    alt={`${organization.orgName ?? "Organization"} logo`}
                    className="
                      h-28
                      w-28
                      rounded-xl
                      border
                      bg-background
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      flex
                      h-28
                      w-28
                      items-center
                      justify-center
                      rounded-xl
                      border
                      bg-muted/50
                    "
                  >

                    <Building2
                      className="
                        h-10
                        w-10
                        text-muted-foreground
                      "
                    />

                  </div>

                )}

              </div>


              {/* BASIC INFORMATION */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >

                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-3
                  "
                >

                  <h2
                    className="
                      text-xl
                      font-semibold
                    "
                  >

                    {organization.orgName ||
                      "Unnamed Organization"}

                  </h2>


                  {organization.businessType && (

                    <span
                      className="
                        rounded-full
                        border
                        bg-muted
                        px-3
                        py-1
                        text-xs
                        font-medium
                      "
                    >

                      {getBusinessTypeLabel(
                        organization.businessType
                      )}

                    </span>

                  )}

                </div>


                <p
                  className="
                    mt-2
                    text-sm
                    text-muted-foreground
                  "
                >

                  Organization ID

                </p>


                <p
                  className="
                    mt-0.5
                    break-all
                    font-mono
                    text-xs
                    text-muted-foreground
                  "
                >

                  {organization.id}

                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* ======================================================
            ORGANIZATION INFORMATION
        ====================================================== */}

        <Card className="mb-6">

          <CardHeader>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-primary/10
                "
              >

                <Building2
                  className="
                    h-5
                    w-5
                    text-primary
                  "
                />

              </div>


              <div>

                <CardTitle>
                  Organization Information
                </CardTitle>


                <CardDescription>

                  Permanent business information
                  registered on the platform.

                </CardDescription>

              </div>

            </div>

          </CardHeader>


          <CardContent>

            <div
              className="
                grid
                gap-6
                md:grid-cols-2
              "
            >

              <InfoItem
                label="Organization Name"
                value={
                  organization.orgName
                }
              />


              <InfoItem
                label="Business Type"
                value={
                  getBusinessTypeLabel(
                    organization.businessType
                  )
                }
              />


              <div
                className="
                  md:col-span-2
                "
              >

                <div
                  className="
                    mb-1.5
                    flex
                    items-center
                    gap-2
                    text-xs
                    font-medium
                    text-muted-foreground
                  "
                >

                  <Globe
                    className="
                      h-3.5
                      w-3.5
                    "
                  />

                  Website

                </div>


                {organization.website ? (

                  <a
                    href={
                      organization.website
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="
                      break-all
                      text-sm
                      text-primary
                      underline-offset-4
                      hover:underline
                    "
                  >

                    {organization.website}

                  </a>

                ) : (

                  <p
                    className="
                      text-sm
                      text-muted-foreground
                    "
                  >

                    Not provided

                  </p>

                )}

              </div>

            </div>

          </CardContent>

        </Card>


        {/* ======================================================
            BUSINESS ADDRESS
        ====================================================== */}

        <Card className="mb-6">

          <CardHeader>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-primary/10
                "
              >

                <MapPin
                  className="
                    h-5
                    w-5
                    text-primary
                  "
                />

              </div>


              <div>

                <CardTitle>
                  Business Address
                </CardTitle>


                <CardDescription>

                  Registered organization address.

                </CardDescription>

              </div>

            </div>

          </CardHeader>


          <CardContent>

            <div
              className="
                grid
                gap-6
                md:grid-cols-2
              "
            >

              <InfoItem
                label="Country"
                value={
                  organization.country
                }
              />


              <InfoItem
                label="State"
                value={
                  organization.state
                }
              />


              <InfoItem
                label="City"
                value={
                  organization.city
                }
              />


              <InfoItem
                label="Postal Code"
                value={
                  organization.postalCode
                }
              />


              <InfoItem
                label="Address Line 1"
                value={
                  organization.addressLine1
                }
                className="
                  md:col-span-2
                "
              />


              <InfoItem
                label="Address Line 2"
                value={
                  organization.addressLine2
                }
                optional
                className="
                  md:col-span-2
                "
              />


              <div
                className="
                  md:col-span-2
                "
              >

                <div
                  className="
                    mb-1.5
                    text-xs
                    font-medium
                    text-muted-foreground
                  "
                >

                  Complete Address

                </div>


                <p
                  className="
                    text-sm
                    leading-6
                  "
                >

                  {getAddress() ||
                    "Address not available"}

                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* ======================================================
            PRIMARY CONTACT
        ====================================================== */}

        <Card className="mb-6">

          <CardHeader>

            <div
              className="
                flex
                items-center
                gap-3
              "
            >

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-primary/10
                "
              >

                <UserRound
                  className="
                    h-5
                    w-5
                    text-primary
                  "
                />

              </div>


              <div>

                <CardTitle>
                  Primary Contact Person
                </CardTitle>


                <CardDescription>

                  Current contact person representing
                  the organization.

                </CardDescription>

              </div>

            </div>

          </CardHeader>


          <CardContent>

            {contact ? (

              <div
                className="
                  space-y-6
                "
              >

                {/* NAME + DESIGNATION */}

                <div
                  className="
                    grid
                    gap-6
                    md:grid-cols-2
                  "
                >

                  <InfoItem
                    label="Full Name"
                    value={
                      contactName
                    }
                  />


                  <InfoItem
                    label="Designation"
                    value={
                      contact.designation
                    }
                  />

                </div>


                {/* FIRST NAME + LAST NAME */}

                <div
                  className="
                    grid
                    gap-6
                    md:grid-cols-2
                  "
                >

                  <InfoItem
                    label="First Name"
                    value={
                      contact.firstName
                    }
                  />


                  <InfoItem
                    label="Last Name"
                    value={
                      contact.lastName
                    }
                    optional
                  />

                </div>


                {/* EMAIL + PHONE */}

                <div
                  className="
                    grid
                    gap-6
                    md:grid-cols-2
                  "
                >

                  <div>

                    <div
                      className="
                        mb-1.5
                        flex
                        items-center
                        gap-2
                        text-xs
                        font-medium
                        text-muted-foreground
                      "
                    >

                      <Mail
                        className="
                          h-3.5
                          w-3.5
                        "
                      />

                      Email Address

                    </div>


                    {contact.email ? (

                      <a
                        href={`mailto:${contact.email}`}
                        className="
                          break-all
                          text-sm
                          text-primary
                          underline-offset-4
                          hover:underline
                        "
                      >

                        {contact.email}

                      </a>

                    ) : (

                      <p
                        className="
                          text-sm
                          text-muted-foreground
                        "
                      >

                        Not provided

                      </p>

                    )}

                  </div>


                  <div>

                    <div
                      className="
                        mb-1.5
                        flex
                        items-center
                        gap-2
                        text-xs
                        font-medium
                        text-muted-foreground
                      "
                    >

                      <Phone
                        className="
                          h-3.5
                          w-3.5
                        "
                      />

                      Phone Number

                    </div>


                    {contact.phoneNumber ? (

                      <a
                        href={`tel:${contact.countryCode ?? ""}${contact.phoneNumber}`}
                        className="
                          text-sm
                          text-primary
                          underline-offset-4
                          hover:underline
                        "
                      >

                        {contact.countryCode}{" "}

                        {contact.phoneNumber}

                      </a>

                    ) : (

                      <p
                        className="
                          text-sm
                          text-muted-foreground
                        "
                      >

                        Not provided

                      </p>

                    )}

                  </div>

                </div>


                {/* PRIMARY STATUS */}

                <div
                  className="
                    rounded-lg
                    border
                    bg-muted/30
                    px-4
                    py-3
                  "
                >

                  <p
                    className="
                      text-sm
                      font-medium
                    "
                  >

                    Primary Contact

                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      text-muted-foreground
                    "
                  >

                    This person is currently stored
                    as the organization's primary
                    contact.

                  </p>

                </div>

              </div>

            ) : (

              <div
                className="
                  rounded-lg
                  border
                  border-dashed
                  p-6
                  text-center
                "
              >

                <UserRound
                  className="
                    mx-auto
                    h-8
                    w-8
                    text-muted-foreground
                  "
                />


                <p
                  className="
                    mt-2
                    text-sm
                    font-medium
                  "
                >

                  No contact information

                </p>


                <p
                  className="
                    mt-1
                    text-xs
                    text-muted-foreground
                  "
                >

                  No primary contact is currently
                  associated with this organization.

                </p>

              </div>

            )}

          </CardContent>

        </Card>


      </div>

    </div>

  );

}


/* ============================================================
   INFO ITEM
============================================================ */

interface InfoItemProps {

  label: string;

  value?:
    string |
    null;

  optional?: boolean;

  className?: string;

}


function InfoItem({

  label,

  value,

  optional = false,

  className = "",

}: InfoItemProps) {

  return (

    <div
      className={
        className
      }
    >

      <div
        className="
          mb-1.5
          text-xs
          font-medium
          text-muted-foreground
        "
      >

        {label}


        {optional && (

          <span
            className="
              ml-2
              font-normal
            "
          >

            Optional

          </span>

        )}

      </div>


      <p
        className={
          value
            ? "text-sm"
            : "text-sm text-muted-foreground"
        }
      >

        {value ||
          "Not provided"}

      </p>

    </div>

  );

}