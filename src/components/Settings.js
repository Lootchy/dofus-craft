import styles from './Settings.module.css';

export default function Settings({ qty, setQty, tax, setTax, sellPrice, setSellPrice }) {
  return (
    <div className={styles.card}>
      <span className={styles.title}>Paramètres</span>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Quantité</label>
          <div className={styles.qtyWrap}>
            <button className={styles.btn} onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className={styles.numInput}
              style={{ width: 68 }}
            />
            <button className={styles.btn} onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Taxe HDV (%)</label>
          <input
            type="number"
            min={0}
            max={10}
            step={0.5}
            value={tax}
            onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
            className={styles.numInput}
            style={{ width: 72 }}
          />
        </div>

        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label className={styles.label}>Prix de vente unitaire (kamas)</label>
          <input
            type="number"
            min={0}
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="Prix HDV de l'item fini…"
            className={`${styles.sellInput} ${sellPrice ? styles.hasVal : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
