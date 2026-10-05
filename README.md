<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/header-dark.svg">
  <img alt="A terminal runs bun whoami.ts and prints Jeffrey Nijs: fullstack developer at Wisemen in Hasselt, Belgium, working in TypeScript, Nuxt, NestJS, Bun with Elysia and Postgres, building Mimlet." src="assets/header-light.svg" width="100%">
</picture>

<details>
<summary><code>whoami.ts</code></summary>
<br>

```ts
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
  }) // coffeesToday: left to Mimlet (it's 6, every run)
  .buildValidated();
```

</details>

<br>

<a href="https://github.com/JeffreyNijs/mimlet">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/mimlet/wordmark-dark.svg">
    <img alt="Mimlet" src="assets/mimlet/wordmark.svg" height="44">
  </picture>
</a>

Typed test data from the schemas you already have. [Docs](https://jeffreynijs.github.io/mimlet/) · [Try it](https://jeffreynijs.github.io/mimlet/guide/try-it.html)

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/JeffreyNijs/JeffreyNijs/output/rhythm-dark.svg">
  <img alt="Contributions over the last 12 months: total, active days, streaks, and a breakdown by weekday." src="https://raw.githubusercontent.com/JeffreyNijs/JeffreyNijs/output/rhythm-light.svg" width="100%">
</picture>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/JeffreyNijs/JeffreyNijs/output/snake-dark.svg">
  <img alt="A coral snake eating the contribution graph." src="https://raw.githubusercontent.com/JeffreyNijs/JeffreyNijs/output/snake-light.svg" width="100%">
</picture>
