import { useState } from 'react';
import { formatKamas } from '../utils';
import styles from './RecipeTable.module.css';

const FALLBACK = 'https://api.dofusdb.fr/img/items';

export default function RecipeTable({ ingredients, qty, prices, excluded, onPriceChange, onToggleExclude, totalCost }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Recette</span>
        <span className={styles.badge}>
          {ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}
        </span>
        {qty > 1 && <span className={styles.qtyHint}>pour {qty} crafts</span>}
      </div>

      <div className={styles.colHeaders}>
        <span className={styles.colCheck} />
        <span className={`${styles.col} ${styles.colResource}`}>Ressource</span>
        <span className={`${styles.col} ${styles.colQty}`}>Qté totale</span>
        <span className={`${styles.col} ${styles.colPrice}`}>Prix unitaire</span>
        <span className={`${styles.col} ${styles.colSub}`}>Sous-total</span>
      </div>

      {ingredients.map((ing, i) => {
        const key        = String(ing.itemId);
        const isExcluded = excluded.has(key);
        const totalQty   = ing.quantity * qty;
        const unitPrice  = parseFloat(prices[key] || 0);
        const sub        = isExcluded ? 0 : unitPrice * totalQty;
        const imgSrc     = ing.img || `${FALLBACK}/${ing.itemId}.png`;

        return (
          <IngredientRow
            key={key}
            ing={ing}
            i={i}
            imgSrc={imgSrc}
            totalQty={totalQty}
            qty={qty}
            priceValue={prices[key] || ''}
            sub={sub}
            isExcluded={isExcluded}
            onPriceChange={(val) => onPriceChange(ing.itemId, val)}
            onToggle={() => onToggleExclude(ing.itemId)}
          />
        );
      })}

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Coût total ingrédients (×{qty})</span>
        <span className={styles.totalVal}>{formatKamas(totalCost)} ₭</span>
      </div>
    </div>
  );
}

function IngredientRow({ ing, i, imgSrc, totalQty, qty, priceValue, sub, isExcluded, onPriceChange, onToggle }) {
  const [copied, setCopied] = useState(false);

  function handleCopyName() {
    navigator.clipboard.writeText(ing.name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={`${styles.row} ${i % 2 === 0 ? styles.rowEven : styles.rowOdd} ${isExcluded ? styles.excluded : ''}`}>
      {/* Checkbox */}
      <button
        className={`${styles.checkbox} ${isExcluded ? styles.checkboxOff : styles.checkboxOn}`}
        onClick={onToggle}
        title={isExcluded ? 'Inclure dans le calcul' : 'Exclure du calcul'}
      >
        {!isExcluded && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5 L4 7.5 L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Image + Nom cliquable */}
      <div className={styles.colResource}>
        <img
          className={styles.img}
          src={imgSrc}
          alt={ing.name}
          onError={(e) => { e.target.style.visibility = 'hidden'; }}
        />
        <button
          className={styles.nameBtn}
          onClick={handleCopyName}
          title="Cliquer pour copier le nom"
        >
          {ing.name}
          <span className={`${styles.copiedTag} ${copied ? styles.copiedVisible : ''}`}>
            copié !
          </span>
        </button>
      </div>

      {/* Quantité */}
      <span className={styles.colQty}>
        <strong>×{totalQty}</strong>
        {qty > 1 && <small>({ing.quantity}/craft)</small>}
      </span>

      {/* Prix */}
      <div className={styles.colPrice}>
        <input
          type="number"
          min={0}
          value={priceValue}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="0"
          disabled={isExcluded}
          className={`${styles.priceInput} ${priceValue && !isExcluded ? styles.filled : ''} ${isExcluded ? styles.disabledInput : ''}`}
        />
      </div>

      {/* Sous-total */}
      <span className={`${styles.colSub} ${sub > 0 ? styles.hasValue : ''}`}>
        {isExcluded ? <span className={styles.excludedLabel}>exclu</span> : sub > 0 ? `${formatKamas(sub)} ₭` : '—'}
      </span>
    </div>
  );
}
