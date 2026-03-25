# Immedia TFS – Calcolo Ultimo Miglio

App React/TypeScript per il calcolo dell'Ultimo Miglio TFS per ex dipendenti Enti Locali in pensione.

## Setup

```bash
npm install
npm run dev
```

## Build per produzione

```bash
npm run build
# output nella cartella /dist
```

## Deploy

La cartella `dist/` può essere deployata su qualsiasi hosting statico:
- **Vercel**: collega il repo GitHub, seleziona framework "Vite"
- **Netlify**: drag & drop della cartella `dist/`
- **Nginx/Apache**: copia `dist/` nella webroot

## Dipendenze principali

| Pacchetto | Scopo |
|-----------|-------|
| react 18 | UI framework |
| xlsx | Export Excel |
| jspdf + jspdf-autotable | Export PDF |
| vite | Build tool |

## Struttura

```
src/
  types.ts        → Tipi, definizione voci, engine di calcolo
  App.tsx         → Wizard a 4 step
  App.module.css  → Stili
  exportExcel.ts  → Export .xlsx
  exportPDF.ts    → Export .pdf con jsPDF
```

## Logica di calcolo

Replica fedelmente le formule del foglio Excel originale `ULTIMO_MIGLIO_TFS_PERS__IN_PENSIONE_TAB__E.xlsm`:

- **E3** (Stipendio tab. annuo) = somma stipendi 12 mesi (K27)
- **E4** (13^ annua) = somma tredicesime 12 mesi (L27 = Σ Ki/12)
- **I3** RIA = E9
- **I4** Tredicesima = E4 + D5 + D6 + D7 + D8 + D9 + D11
- **I5** Stip. TAB E = E3 + E5 + E6 + E7 + E8 + E11
- **I6** Ind. Asili = E13 + E14
- **I7** Ind. 64,56 = E10
- **I8** Ind. Vigilanza = E12
- **I9** TOTALE = Σ(I3:I8)
