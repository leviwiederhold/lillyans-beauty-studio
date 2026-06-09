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
