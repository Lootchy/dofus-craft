import { formatKamas } from '../utils';
import styles from './CompareCard.module.css';
export default function CompareCard({ craftCost, hdvPrice, qty }) {
  const totalBuy = parseFloat(hdvPrice || 0) * qty;
  const hasBoth = craftCost > 0 && totalBuy > 0;
  const saving = totalBuy - craftCost;
  const craftWins = saving > 0;
  const pct = totalBuy > 0 ? Math.abs(saving / totalBuy) * 100 : 0;
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 14h12" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/><path d="M3 6L1 10h4L3 6zM13 6l-2 4h4L13 6z" fill="#22c55e" opacity="0.5"/></svg>
        <span className={styles.title}>Craft vs Achat HDV</span>
        {hasBoth && <span className={`${styles.verdict} ${craftWins ? styles.verdictGreen : styles.verdictRed}`}>{craftWins ? '⚒ Crafter est moins cher' : '🏪 Acheter est moins cher'}</span>}
      </div>
      {hasBoth ? (
        <div className={styles.comparison}>
          <div className={`${styles.option} ${craftWins ? styles.winner : styles.loser}`}>
            <div className={styles.optLabel}>⚒ Coût craft (×{qty})</div>
            <div className={styles.optVal}>{formatKamas(craftCost)} ₭</div>
            {craftWins && <span className={styles.winBadge}>✓ économie {formatKamas(saving)} ₭ ({pct.toFixed(1)}%)</span>}
          </div>
          <div className={styles.separator}><div className={styles.sepLine}/><span className={styles.vsText}>VS</span><div className={styles.sepLine}/></div>
          <div className={`${styles.option} ${!craftWins ? styles.winner : styles.loser}`}>
            <div className={styles.optLabel}>🏪 Achat HDV (×{qty})</div>
            <div className={styles.optVal}>{formatKamas(totalBuy)} ₭</div>
            {!craftWins && <span className={styles.winBadge}>✓ économie {formatKamas(-saving)} ₭ ({pct.toFixed(1)}%)</span>}
          </div>
        </div>
      ) : (
        <p className={styles.hint}>Renseignez le prix HDV dans les paramètres et les coûts des ingrédients pour comparer</p>
      )}
    </div>
  );
}
