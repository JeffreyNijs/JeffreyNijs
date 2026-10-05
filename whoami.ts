import { z } from 'zod';
import { fromZod } from '@mimlet/zod';

const Developer = z.object({
  name: z.string(),
  role: z.string(),
  basedIn: z.string(),
  stack: z.array(z.string()).min(1),
  building: z.string(),
  coffeesToday: z.number().int().min(1).max(9),
});

export const jeffrey = fromZod(Developer)
  .with({
    name: 'Jeffrey Nijs',
    role: 'Fullstack developer @ Wisemen',
    basedIn: 'Hasselt, BE',
    stack: ['TypeScript', 'Nuxt', 'NestJS', 'Bun + Elysia', 'Postgres'],
    building: 'Mimlet',
  }) // coffeesToday is left to Mimlet
  .buildValidated();

if (import.meta.main) console.log(jeffrey);
