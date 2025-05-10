# CTSR - Sistema di Gestione Turni

Sistema web per la gestione dei turni del personale delle stazioni, fermate e PL.

## Tecnologie Utilizzate

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase (Database e Autenticazione)

## Configurazione dell'Ambiente

1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```
3. Crea un file `.env.local` nella root del progetto con le seguenti variabili:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```

## Struttura del Progetto

- `/app` - Componenti e pagine dell'applicazione
- `/lib` - Utility e configurazioni
- `/public` - Asset statici

## Sviluppo

Per contribuire al progetto:

1. Crea un nuovo branch per le tue modifiche
2. Fai commit delle modifiche
3. Crea una Pull Request

## Licenza

Proprietario - CTSR

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
