import { z } from "zod";

const phone = z.string().trim().optional();
const email = z.string().trim().email("Enter a valid email.");
const honeypot = z.string().max(0, "Spam detected.").optional().or(z.literal(""));

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required."),
  email,
  phone,
  subject: z.string().trim().min(1, "Choose what you are inquiring about."),
  message: z.string().trim().min(8, "Please add a short message."),
  code: z.string().trim().optional(),
  website: honeypot
});

export const bookingStatusSchema = z.enum(["pending", "pending_admin_confirmation", "confirmed", "denied", "completed", "cancelled", "no-show"]);

export const bookingRequestSchema = z.object({
  service_id: z.string().uuid(),
  starts_at: z.string().trim().min(1),
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().optional(),
  email: z.string().trim().email(),
  phone: z.string().trim().optional(),
  gift_card_code: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  medications: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  skin_conditions: z.string().trim().optional(),
  previous_procedures: z.string().trim().optional(),
  consent_accuracy: z.coerce.boolean().optional(),
  consent_updates: z.coerce.boolean().optional(),
  consent_policy: z.coerce.boolean().optional(),
  signature: z.string().trim().optional(),
  website: z.string().max(0).optional().or(z.literal(""))
});

export const availabilityQuerySchema = z.object({
  service_id: z.string().uuid(),
  date: z.string().trim().min(1)
});

export const adminBookingUpdateSchema = z.object({
  booking_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  client_name: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  service_type: z.string().trim().optional(),
  starts_at: z.string().trim().optional(),
  ends_at: z.string().trim().optional(),
  status: bookingStatusSchema.optional(),
  internal_notes: z.string().trim().optional(),
  deposit_required: z.coerce.boolean().optional(),
  deposit_status: z.string().trim().optional(),
  deposit_amount_cents: z.coerce.number().int().nonnegative().optional()
});

export const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  duration_minutes: z.coerce.number().int().positive(),
  service_total: z.coerce.number().int().nonnegative().optional(),
  requires_intake: z.coerce.boolean().default(false),
  intake_type: z.string().trim().optional(),
  requires_deposit: z.coerce.boolean().default(false),
  deposit_amount_cents: z.coerce.number().int().nonnegative().optional(),
  is_active: z.coerce.boolean().default(true)
});

export const availabilityRuleSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().trim().min(1),
  end_time: z.string().trim().min(1),
  is_active: z.coerce.boolean().default(true)
});

export const blockedTimeSchema = z.object({
  starts_at: z.string().trim().min(1),
  ends_at: z.string().trim().min(1),
  reason: z.string().trim().optional()
});

export const adminClientSchema = z.object({
  first_name: z.string().trim().min(1),
  last_name: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional()
});

export const mergeClientsSchema = z.object({
  primary_client_id: z.string().uuid(),
  duplicate_client_id: z.string().uuid()
});

export const cmsContentSchema = z.object({
  key: z.string().trim().min(1),
  title: z.string().trim().optional(),
  body: z.string().trim().optional(),
  is_active: z.coerce.boolean().default(true)
});

export const serviceSettingSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().optional(),
  price_label: z.string().trim().optional(),
  duration_minutes: z.coerce.number().int().optional(),
  deposit_amount_cents: z.coerce.number().int().optional(),
  required_fields: z.string().trim().optional(),
  is_active: z.coerce.boolean().default(true)
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1),
  body: z.string().trim().optional(),
  starts_at: z.string().trim().optional(),
  ends_at: z.string().trim().optional(),
  is_active: z.coerce.boolean().default(true)
});

export const intakeTypeSchema = z.enum(["permanent_makeup", "facial", "waxing", "wedding_inquiry"]);

export const intakeFormSchema = z.object({
  type: intakeTypeSchema,
  first_name: z.string().trim().min(1, "First name is required."),
  last_name: z.string().trim().min(1, "Last name is required."),
  date_of_birth: z.string().trim().min(1, "Date of birth is required."),
  phone: z.string().trim().min(7, "Phone is required."),
  email,
  address: z.string().trim().optional(),
  emergency_contact_name: z.string().trim().optional(),
  emergency_contact_phone: phone,
  medications: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  skin_conditions: z.string().trim().optional(),
  previous_procedures: z.string().trim().optional(),
  health_conditions: z.array(z.string()).default([]),
  service_details: z.record(z.string(), z.string().optional()).default({}),
  consent_accuracy: z.boolean().refine(Boolean, "Consent is required."),
  consent_updates: z.boolean().refine(Boolean, "Consent is required."),
  consent_policy: z.boolean().refine(Boolean, "Consent is required."),
  signature: z.string().trim().min(2, "Digital signature is required."),
  signature_date: z.string().trim().min(1, "Date is required."),
  service_label: z.string().trim().min(1),
  website: honeypot
});

export const galleryItemSchema = z.object({
  title: z.string().trim().min(1),
  category: z.string().trim().min(1),
  image_url: z.string().trim().url(),
  alt_text: z.string().trim().optional(),
  sort_order: z.coerce.number().int().default(0),
  is_published: z.coerce.boolean().default(true)
});

export const membershipSchema = z.object({
  name: z.string().trim().optional(),
  client_id: z.string().trim().optional(),
  client_name: z.string().trim().optional(),
  email: z.string().trim().optional(),
  plan_name: z.string().trim().min(1),
  price_label: z.string().trim().optional(),
  perks: z.string().trim().optional(),
  status: z.string().trim().default("active"),
  start_date: z.string().trim().optional(),
  renewal_date: z.string().trim().optional(),
  payment_status: z.string().trim().optional(),
  is_featured: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true)
});

export const waiverCodeSchema = z.object({
  code: z.string().trim().min(2),
  description: z.string().trim().optional(),
  allow_reuse: z.coerce.boolean().default(false),
  is_active: z.coerce.boolean().default(true)
});

export const businessSettingsSchema = z.object({
  business_hours: z.string().trim().optional(),
  service_availability: z.string().trim().optional(),
  blocked_dates: z.string().trim().optional(),
  travel_wedding_availability: z.string().trim().optional(),
  service_durations: z.string().trim().optional(),
  deposit_amounts: z.string().trim().optional(),
  gift_card_auto_confirm: z.coerce.boolean().optional(),
  booking_minimum_notice_hours: z.coerce.number().int().min(0).max(720).optional(),
  intake_expiration_months: z.coerce.number().int().min(0).max(60).optional(),
  booking_url: z.string().trim().url().optional().or(z.literal("")),
  gift_card_url: z.string().trim().url().optional().or(z.literal(""))
});
