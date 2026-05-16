export type MembershipPlan = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  priceLabel: string;
  tag?: string;
  perks: string[];
};

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: "glow",
    slug: "glow",
    name: "Glow",
    priceCents: 6000,
    priceLabel: "$60",
    perks: [
      "Choose 1 monthly: signature facial or brow tint & lami or lash lift & tint.",
      "Includes 10% off services & retail.",
      "Priority booking.",
      "Free birthday add-on."
    ]
  },
  {
    id: "radiance",
    slug: "radiance",
    name: "Radiance",
    priceCents: 13000,
    priceLabel: "$130",
    tag: "BEST VALUE",
    perks: [
      "Choose 2 monthly: customized facial plus brow or lash lift & tint every 6-8 weeks, rotated as needed.",
      "Includes 15% off services & retail.",
      "Priority booking.",
      "Upgraded birthday gift."
    ]
  },
  {
    id: "luminary",
    slug: "luminary",
    name: "Luminary",
    priceCents: 20000,
    priceLabel: "$200",
    perks: [
      "Monthly premium facial + add-on.",
      "Brow and lash lift & tint every 6-8 weeks, rotated as needed.",
      "Up to $75/month in waxing.",
      "20% off services & retail, priority booking, and a premium birthday gift."
    ]
  }
];

export function findMembershipPlan(idOrSlug: string) {
  return MEMBERSHIP_PLANS.find((plan) => plan.id === idOrSlug || plan.slug === idOrSlug || plan.name.toLowerCase() === idOrSlug.toLowerCase());
}
