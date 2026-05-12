import styles from './Settings.module.css';
export default function Settings({ qty, setQty, tax, setTax, hdvPrice, setHdvPrice }) {
  return (
    <div className={styles.card}>
      <div className={styles.titleRow}>
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="#22c55e" strokeWidth="1.3"/><path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.8 2.8l1.1 1.1M10.1 10.1l1.1 1.1M2.8 11.2l1.1-1.1M10.1 3.9l1.1-1.1" stroke="#22c55e" strokeWidth="1.3" strokeLinecap="round"/></svg>
        <span className={styles.title}>Paramètres</span>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Quantité</label>
          <div className={styles.qtyWrap}>
            <button className={styles.btn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} className={styles.numInput} style={{ width: 68 }} />
            <button className={styles.btn} onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Taxe HDV (%)</label>
          <input type="number" min={0} max={10} step={0.5} value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} className={styles.numInput} style={{ width: 72 }} />
        </div>
        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label className={styles.label}>Prix HDV de l'item fini (kamas / unité)</label>
          <input type="number" min={0} value={hdvPrice} onChange={(e) => setHdvPrice(e.target.value)}
            placeholder="Prix auquel vous vendez (ou achetez) cet item…"
            className={`${styles.sellInput} ${hdvPrice ? styles.hasVal : ''}`} />
        </div>
      </div>
    </div>
  );
}
