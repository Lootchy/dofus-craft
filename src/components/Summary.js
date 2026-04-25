import { formatKamas } from '../utils';
import styles from './Summary.module.css';

export default function Summary({ qty, tax, totalCost, totalSell, taxAmt, netRev, profit, marginPct, hasAllPrices }) {
  const state = !hasAllPrices ? 'neutral' : profit >= 0 ? 'win' : 'lose';

  const stats = [
    { label: `Coût ingrédients ×${qty}`, value: `${formatKamas(totalCost)} ₭` },
    { label: `Revenu brut ×${qty}`,       value: `${formatKamas(totalSell)} ₭` },
    { label: `Taxe HDV ${tax}%`,          value: `-${formatKamas(taxAmt)} ₭` },
    { label: 'Revenu net',                value: `${formatKamas(netRev)} ₭` },
  ];

  return (
    <div className={styles.card}>
      <span className={styles.title}>Résumé</span>

      <div className={styles.statsGrid}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statCard}>
            <p className={styles.statLabel}>{s.label}</p>
            <p className={styles.statVal}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className={`${styles.profitCard} ${styles[state]}`}>
        <div>
          <p className={styles.profitLabel}>Bénéfice net (×{qty})</p>
          <p className={`${styles.profitVal} ${styles[state]}`}>
            {hasAllPrices ? `${formatKamas(profit, true)} ₭` : '—'}
          </p>
          {hasAllPrices && qty > 1 && (
            <p className={styles.profitSub}>
              soit {formatKamas(profit / qty, true)} ₭ / craft
            </p>
          )}
        </div>
        <div className={styles.marginWrap}>
          <p className={styles.profitLabel}>Marge</p>
          <p className={`${styles.marginVal} ${styles[state]}`}>
            {hasAllPrices
              ? `${marginPct >= 0 ? '+' : ''}${marginPct.toFixed(1)}%`
              : '—'}
          </p>
        </div>
      </div>

      {!hasAllPrices && (
        <p className={styles.hint}>Remplissez tous les prix pour voir votre marge</p>
      )}
    </div>
  );
}
