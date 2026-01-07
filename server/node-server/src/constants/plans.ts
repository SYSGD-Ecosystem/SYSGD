// server/node-server/src/constants/plans.ts
export const PLANS = {
  free: {
    name: 'free',
    displayName: 'Gratis',
    limits: {
      projects: 3,
      documents: 10,
      tasks: 50,
      team: 1,
      aiCredits: 10
    }
  },
  pro: {
    name: 'pro',
    displayName: 'Profesional',
    limits: {
      projects: 20,
      documents: 100,
      tasks: 500,
      team: 10,
      aiCredits: 500
    }
  },
  vip: {
    name: 'vip',
    displayName: 'VIP',
    limits: {
      projects: 100,
      documents: 1000,
      tasks: 10000,
      team: 50,
      aiCredits: 5000
    }
  }
} as const;

export type PlanName = keyof typeof PLANS;
export type Plan = typeof PLANS[PlanName];