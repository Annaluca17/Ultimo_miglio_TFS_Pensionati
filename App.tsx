import { useState, useCallback } from 'react';
import type { Anagrafica, VoceRetributiva, Step, RisultatoCalcolo } from './types';
import { VOCI_RETRIBUTIVE, MESI_LABELS, calcolaRisultato } from './types';
import { exportToExcel } from './exportExcel';
import { exportToPDF } from './exportPDF';
import styles from './App.module.css';

const fmtEuro = (n: number) =>
  n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STEPS: { id: Step; label: string; num: number }[] = [
  { id: 'anagrafica', label: 'Anagrafica', num: 1 },
  { id: 'voci', label: 'Voci Retributive', num: 2 },
  { id: 'stipendi', label: 'Stipendi 12 Mesi', num: 3 },
  { id: 'risultato', label: 'Risultato', num: 4 },
];

const emptyAnagrafica = (): Anagrafica => ({
  cognomeNome: '', matricola: '', qualifica: '', dataPensione: '', ente: ''
});

const emptyVoci = (): VoceRetributiva[] =>
  VOCI_RETRIBUTIVE.map(v => ({ ...v, importoMensile: 0 }));

export default function App() {
  const [step, setStep] = useState<Step>('anagrafica');
  const [anagrafica, setAnagrafica] = useState<Anagrafica>(emptyAnagrafica());
  const [voci, setVoci] = useState<VoceRetributiva[]>(emptyVoci());
  const [importoBase, setImportoBase] = useState<number>(0);
  const [stipendiMensili, setStipendiMensili] = useState<number[]>(Array(12).fill(0));
  const [eccezioni, setEccezioni] = useState<boolean[]>(Array(12).fill(false));
  const [risultato, setRisultato] = useState<RisultatoCalcolo | null>(null);
  const [calcolato, setCalcolato] = useState(false);

  const currentStepIdx = STEPS.findIndex(s => s.id === step);

  const go = (s: Step) => setStep(s);

  const applicaBase = useCallback(() => {
    setStipendiMensili(prev =>
      prev.map((v, i) => eccezioni[i] ? v : importoBase)
    );
  }, [importoBase, eccezioni]);

  const calcola = () => {
    const res = calcolaRisultato(voci, stipendiMensili);
    setRisultato(res);
    setCalcolato(true);
    setStep('risultato');
  };

  const reset = () => {
    setStep('anagrafica');
    setAnagrafica(emptyAnagrafica());
    setVoci(emptyVoci());
    setImportoBase(0);
    setStipendiMensili(Array(12).fill(0));
    setEccezioni(Array(12).fill(false));
    setRisultato(null);
    setCalcolato(false);
  };

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoText}>Immedia</span>
          <span className={styles.logoSub}>S.p.A.</span>
        </div>
        <div className={styles.appTitle}>
          <span>Calcolo</span>
          <span className={styles.highlight}>Ultimo Miglio</span>
          <span>TFS</span>
        </div>
        <nav className={styles.nav}>
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`${styles.navItem} ${step === s.id ? styles.navActive : ''} ${i < currentStepIdx ? styles.navDone : ''}`}
              onClick={() => i <= currentStepIdx ? go(s.id) : undefined}
              disabled={i > currentStepIdx}
            >
              <span className={styles.navNum}>{i < currentStepIdx ? '✓' : s.num}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <span>Enti Locali – INPS</span>
          <span>Pensionati in essere</span>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              {step === 'anagrafica' && 'Dati Anagrafici'}
              {step === 'voci' && 'Voci Retributive Annualizzate'}
              {step === 'stipendi' && 'Stipendi Ultimi 12 Mesi'}
              {step === 'risultato' && 'Risultato Calcolo'}
            </h1>
            <p className={styles.pageDesc}>
              {step === 'anagrafica' && 'Inserire i dati identificativi del dipendente pensionato'}
              {step === 'voci' && 'Inserire gli importi mensili per ciascuna voce retributiva (a tempo pieno, anche in caso di part-time)'}
              {step === 'stipendi' && 'Definire gli stipendi effettivi degli ultimi 12 mesi'}
              {step === 'risultato' && 'Risultato non modificabile – generato automaticamente dal calcolo'}
            </p>
          </div>
          <div className={styles.stepBadge}>Step {currentStepIdx + 1} / {STEPS.length}</div>
        </header>

        {/* Content */}
        <div className={styles.content}>

          {/* ─── STEP 1: Anagrafica ─────────────────────────────────────────── */}
          {step === 'anagrafica' && (
            <div className={styles.card}>
              <div className={styles.grid2}>
                <FormField label="Cognome e Nome" required>
                  <input
                    className={styles.input}
                    type="text"
                    value={anagrafica.cognomeNome}
                    onChange={e => setAnagrafica(a => ({ ...a, cognomeNome: e.target.value }))}
                    placeholder="es. Rossi Mario"
                  />
                </FormField>
                <FormField label="Matricola">
                  <input
                    className={styles.input}
                    type="text"
                    value={anagrafica.matricola}
                    onChange={e => setAnagrafica(a => ({ ...a, matricola: e.target.value }))}
                    placeholder="es. 00123"
                  />
                </FormField>
                <FormField label="Qualifica / Profilo">
                  <input
                    className={styles.input}
                    type="text"
                    value={anagrafica.qualifica}
                    onChange={e => setAnagrafica(a => ({ ...a, qualifica: e.target.value }))}
                    placeholder="es. Istruttore Cat. C"
                  />
                </FormField>
                <FormField label="Data Pensionamento">
                  <input
                    className={styles.input}
                    type="date"
                    value={anagrafica.dataPensione}
                    onChange={e => setAnagrafica(a => ({ ...a, dataPensione: e.target.value }))}
                  />
                </FormField>
                <FormField label="Ente di appartenenza" wide>
                  <input
                    className={styles.input}
                    type="text"
                    value={anagrafica.ente}
                    onChange={e => setAnagrafica(a => ({ ...a, ente: e.target.value }))}
                    placeholder="es. Comune di Roma"
                  />
                </FormField>
              </div>
              <div className={styles.actions}>
                <button className={styles.btnPrimary} onClick={() => go('voci')}>
                  Continua →
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Voci Retributive ───────────────────────────────────── */}
          {step === 'voci' && (
            <div className={styles.card}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '55%' }}>Voce Retributiva</th>
                      <th style={{ width: '8%' }}>Valido 13^</th>
                      <th style={{ width: '20%' }}>Importo Mensile (€)</th>
                      <th style={{ width: '17%' }}>Importo Annuo (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voci.map((v, i) => (
                      <tr key={v.id} className={i % 2 === 0 ? styles.rowEven : ''}>
                        <td className={styles.tdLabel}>{v.label}</td>
                        <td className={styles.tdCenter}>
                          <span className={v.valido13 ? styles.badgeSi : styles.badgeNo}>
                            {v.valido13 ? 'SI' : 'NO'}
                          </span>
                        </td>
                        <td>
                          <input
                            className={styles.inputNum}
                            type="number"
                            min={0}
                            step="0.01"
                            value={v.importoMensile || ''}
                            placeholder="0,00"
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setVoci(prev => prev.map((x, j) => j === i ? { ...x, importoMensile: val } : x));
                            }}
                          />
                        </td>
                        <td className={styles.tdAnnuo}>
                          {v.id === 'stip_tab' || v.id === 'tredicesima'
                            ? <span className={styles.calcNote}>da 12 mesi</span>
                            : fmtEuro(v.importoMensile * 12)
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.infoIcon}>ℹ</span>
                Gli importi devono essere <strong>annualizzati e a tempo pieno</strong>, anche in caso di dipendente part-time.
                Le voci <em>Stipendio tabellare</em> e <em>13^ Mensilità</em> vengono calcolate automaticamente dagli stipendi degli ultimi 12 mesi.
              </div>
              <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => go('anagrafica')}>← Indietro</button>
                <button className={styles.btnPrimary} onClick={() => go('stipendi')}>Continua →</button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: Stipendi 12 mesi ──────────────────────────────────── */}
          {step === 'stipendi' && (
            <div className={styles.card}>
              <div className={styles.baseImportoRow}>
                <div className={styles.baseImportoLabel}>
                  <strong>Importo base mensile</strong>
                  <span>Verrà applicato a tutti i mesi senza eccezione</span>
                </div>
                <input
                  className={styles.inputNumLarge}
                  type="number"
                  min={0}
                  step="0.01"
                  value={importoBase || ''}
                  placeholder="0,00"
                  onChange={e => setImportoBase(parseFloat(e.target.value) || 0)}
                />
                <button className={styles.btnApply} onClick={applicaBase}>
                  Applica a tutti
                </button>
              </div>

              <div className={styles.mesiGrid}>
                {MESI_LABELS.map((mese, i) => (
                  <div key={mese} className={`${styles.meseCard} ${eccezioni[i] ? styles.meseEccezione : ''}`}>
                    <div className={styles.meseHeader}>
                      <span className={styles.meseName}>{mese}</span>
                      <label className={styles.eccezioneToggle}>
                        <input
                          type="checkbox"
                          checked={eccezioni[i]}
                          onChange={e => {
                            const checked = e.target.checked;
                            setEccezioni(prev => prev.map((x, j) => j === i ? checked : x));
                          }}
                        />
                        <span>Eccezione</span>
                      </label>
                    </div>
                    <input
                      className={styles.inputNum}
                      type="number"
                      min={0}
                      step="0.01"
                      value={stipendiMensili[i] || ''}
                      placeholder="0,00"
                      onChange={e => {
                        const val = parseFloat(e.target.value) || 0;
                        setStipendiMensili(prev => prev.map((x, j) => j === i ? val : x));
                        if (!eccezioni[i]) {
                          setEccezioni(prev => prev.map((x, j) => j === i ? true : x));
                        }
                      }}
                    />
                    <div className={styles.mese13}>
                      13^ pro-rata: <strong>€ {fmtEuro((stipendiMensili[i] ?? 0) / 12)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.totaleMesiRow}>
                <span>Totale 12 mesi:</span>
                <strong>€ {fmtEuro(stipendiMensili.reduce((s, v) => s + v, 0))}</strong>
                <span style={{ marginLeft: 24 }}>Totale 13^:</span>
                <strong>€ {fmtEuro(stipendiMensili.reduce((s, v) => s + v / 12, 0))}</strong>
              </div>

              <div className={styles.actions}>
                <button className={styles.btnSecondary} onClick={() => go('voci')}>← Indietro</button>
                <button className={styles.btnCalcola} onClick={calcola}>
                  🧮 Calcola Risultato
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Risultato ─────────────────────────────────────────── */}
          {step === 'risultato' && risultato && calcolato && (
            <div>
              <div className={styles.risultatoLock}>
                <span className={styles.lockIcon}>🔒</span>
                Risultato calcolato il {new Date().toLocaleString('it-IT')} – non modificabile
              </div>

              {/* Anagrafica riepilogo */}
              <div className={styles.card} style={{ marginBottom: 16 }}>
                <div className={styles.anagraficaRiepilogo}>
                  <div><label>Nominativo</label><span>{anagrafica.cognomeNome || '–'}</span></div>
                  <div><label>Matricola</label><span>{anagrafica.matricola || '–'}</span></div>
                  <div><label>Qualifica</label><span>{anagrafica.qualifica || '–'}</span></div>
                  <div><label>Pensionamento</label><span>{anagrafica.dataPensione || '–'}</span></div>
                  <div><label>Ente</label><span>{anagrafica.ente || '–'}</span></div>
                </div>
              </div>

              {/* Ultimo Miglio TFS – tabella principale */}
              <div className={styles.card}>
                <h2 className={styles.sectionTitle}>Ultimo Miglio TFS</h2>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Componente</th>
                      <th style={{ textAlign: 'right' }}>Importo (€)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Retribuzione Ind. di Anzianità (R.I.A.)', val: risultato.ria },
                      { label: 'Tredicesima mensilità', val: risultato.tredicesima },
                      { label: 'Stipendio tabellare TAB E (compreso Differenziali, Ass. IIS non riass., Ass. riassorbibile per prog. verticale, IVC)', val: risultato.stipTabellare },
                      { label: 'Indennità Aggiuntive personale asili nido e scolastico (voce 72 + voce 78)', val: risultato.indAsili },
                      { label: 'Indennità di EUR 64,56 annue lorde (ex 3^ e 4^ Qualifica)', val: risultato.ind6456 },
                      { label: 'Indennità di vigilanza', val: risultato.indVigilanza },
                    ].map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? styles.rowEven : ''}>
                        <td className={styles.tdLabel}>{r.label}</td>
                        <td className={styles.tdRight}>{fmtEuro(r.val)}</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td><strong>TOTALE ULTIMO MIGLIO TFS</strong></td>
                      <td className={styles.tdRight}><strong>{fmtEuro(risultato.totaleUltimoMiglio)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dettaglio voci */}
              <div className={styles.card} style={{ marginTop: 16 }}>
                <h2 className={styles.sectionTitle}>Dettaglio Voci Retributive</h2>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Voce</th>
                        <th style={{ textAlign: 'center' }}>13^</th>
                        <th style={{ textAlign: 'right' }}>Mensile (€)</th>
                        <th style={{ textAlign: 'right' }}>Annuo (€)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {risultato.vociAnnualizzate.map((v, i) => (
                        <tr key={v.id} className={i % 2 === 0 ? styles.rowEven : ''}>
                          <td className={styles.tdLabel}>{v.label}</td>
                          <td className={styles.tdCenter}>
                            <span className={v.valido13 ? styles.badgeSi : styles.badgeNo}>
                              {v.valido13 ? 'SI' : 'NO'}
                            </span>
                          </td>
                          <td className={styles.tdRight}>{fmtEuro(v.importoMensile)}</td>
                          <td className={styles.tdRight}>{fmtEuro(v.importoAnnuo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actions} style={{ marginTop: 24 }}>
                <button
                  className={styles.btnSecondary}
                  onClick={reset}
                >
                  ↺ Nuovo Calcolo
                </button>
                <button
                  className={styles.btnExport}
                  onClick={() => exportToExcel(anagrafica, risultato)}
                >
                  📊 Esporta Excel
                </button>
                <button
                  className={styles.btnPdf}
                  onClick={() => exportToPDF(anagrafica, risultato)}
                >
                  📄 Stampa / PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helper component ────────────────────────────────────────────────────────
function FormField({ label, children, required, wide }: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? styles.fieldWide : styles.field}>
      <label className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      {children}
    </div>
  );
}
