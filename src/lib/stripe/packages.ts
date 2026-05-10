export const creditPackages = {
  starter: {
    id: 'starter',
    name: 'Starter credits',
    description: '20 credits',
    amountCents: 200,
    credits: 20,
  },
  standard: {
    id: 'standard',
    name: 'Standard credits',
    description: '60 credits',
    amountCents: 500,
    credits: 60,
  },
  premium: {
    id: 'premium',
    name: 'Premium credits',
    description: '150 credits',
    amountCents: 1000,
    credits: 150,
  },
} as const;

export type CreditPackageId = keyof typeof creditPackages;

export function getCreditPackage(packageId: string) {
  return creditPackages[packageId as CreditPackageId];
}
