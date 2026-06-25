// Single source of truth for which intake/consent forms a service category requires.
// Used by the booking flow UI (to render the right form sequence) and by the
// bookings API (to gate booking on forms actually being on file).

export const FORM_SEQUENCES: Record<string, string[]> = {
  "Permanent Makeup": ["pmu_intake", "informed_consent", "liability_waiver"],
  "Facials":          ["confidential_intake", "liability_waiver"],
  "Waxing":           ["confidential_intake", "liability_waiver"],
  "Lifts & Tints":    ["confidential_intake", "liability_waiver"],
  "Formal Makeup":    ["confidential_intake", "liability_waiver"],
};

export const DEFAULT_FORM_SEQUENCE = ["confidential_intake", "liability_waiver"];

export function requiredFormsForCategory(category?: string | null): string[] {
  if (category && FORM_SEQUENCES[category]) return FORM_SEQUENCES[category];
  return DEFAULT_FORM_SEQUENCE;
}

/**
 * Given the form types a user has on file, returns the required types still missing
 * for a service category. Empty array means intake is complete.
 */
export function missingForms(category: string | null | undefined, onFileFormTypes: string[]): string[] {
  const required = requiredFormsForCategory(category);
  const onFile = new Set(onFileFormTypes);
  return required.filter((ft) => !onFile.has(ft));
}

export type IntakeStatus = "missing" | "incomplete" | "current" | "outdated";

type IntakeFormRow = { form_type: string; submitted_at?: string | null; last_reviewed_at?: string | null };

/**
 * Classifies a client's intake state for a service category given their forms and
 * the studio's expiration window (months). "current" means all required forms are
 * present and the most recent submit/review is within the window.
 */
export function intakeStatus(
  category: string | null | undefined,
  forms: IntakeFormRow[],
  expirationMonths: number
): IntakeStatus {
  const required = requiredFormsForCategory(category);
  const onFile = new Set(forms.map((f) => f.form_type));
  const present = required.filter((ft) => onFile.has(ft));
  if (present.length === 0) return "missing";
  if (present.length < required.length) return "incomplete";

  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - Math.max(0, expirationMonths));
  const freshest = forms
    .filter((f) => required.includes(f.form_type))
    .reduce((best, f) => {
      const t = Math.max(
        f.submitted_at ? new Date(f.submitted_at).getTime() : 0,
        f.last_reviewed_at ? new Date(f.last_reviewed_at).getTime() : 0
      );
      return Math.max(best, t);
    }, 0);
  if (freshest > 0 && freshest < cutoff.getTime()) return "outdated";
  return "current";
}
