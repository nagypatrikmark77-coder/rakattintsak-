# Rákattintsak?

Magyar nyelvű PWA: gyanús SMS, e-mail, link vagy screenshot ellenőrzése, bizonyítékkal alátámasztott ítélettel.

## Futtatás

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tesztek
npm run eval       # kiértékelés a tests/fixtures mintákon
npm run build
```

## Környezeti változók (`.env.local`)

- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

(Részletek és a költségkeret-figyelmeztetés az M5-ben kerülnek ide.)
