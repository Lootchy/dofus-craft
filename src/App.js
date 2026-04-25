import { useState, useCallback } from 'react';
import { fetchRecipe, fetchItem, resolveImg } from './api';
import SearchBar from './components/SearchBar';
import Settings from './components/Settings';
import RecipeTable from './components/RecipeTable';
import Summary from './components/Summary';
import styles from './App.module.css';

export default function App() {
  const [recipe, setRecipe]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [noRecipe, setNoRecipe] = useState(false);

  const [qty, setQty]             = useState(1);
  const [tax, setTax]             = useState(2);
  const [sellPrice, setSellPrice] = useState('');
  const [prices, setPrices]       = useState({});
  const [excluded, setExcluded]   = useState(new Set()); // Set of String(itemId)

  const handleSelect = useCallback(async (item) => {
    if (!item) { setRecipe(null); setNoRecipe(false); return; }

    setRecipe(null);
    setNoRecipe(false);
    setPrices({});
    setSellPrice('');
    setExcluded(new Set());
    setLoading(true);

    try {
      const rec = await fetchRecipe(item.id);
      if (!rec) { setNoRecipe(true); return; }

      const ingredients = await Promise.all(
        rec.ingredients.map(async (ing) => {
          if (ing.name !== null) return ing;
          try {
            const data = await fetchItem(ing.itemId);
            return { ...ing, name: data.name?.fr || '?', img: resolveImg(data.img, ing.itemId) };
          } catch {
            return { ...ing, name: '?', img: null };
          }
        })
      );

      setRecipe({ ...rec, ingredients });
    } catch {
      setNoRecipe(true);
    } finally {
      setLoading(false);
    }
  }, []);

  function handlePriceChange(itemId, value) {
    setPrices((prev) => ({ ...prev, [String(itemId)]: value }));
  }

  function handleToggleExclude(itemId) {
    const key = String(itemId);
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Only include non-excluded ingredients in cost
  const activeIngredients = recipe?.ingredients.filter(
    (ing) => !excluded.has(String(ing.itemId))
  ) ?? [];

  const totalCost = activeIngredients.reduce((sum, ing) => {
    const price = parseFloat(prices[String(ing.itemId)] || 0);
    return sum + price * ing.quantity * qty;
  }, 0);

  const totalSell = parseFloat(sellPrice || 0) * qty;
  const taxAmt    = totalSell * (tax / 100);
  const netRev    = totalSell - taxAmt;
  const profit    = netRev - totalCost;
  const marginPct = totalSell > 0 ? (profit / totalSell) * 100 : 0;

  const hasAllPrices = !!recipe &&
    activeIngredients.every((ing) => parseFloat(prices[String(ing.itemId)] || 0) > 0) &&
    parseFloat(sellPrice || 0) > 0;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <Logo />
          <h1 className={styles.title}>CraftCalc</h1>
        </div>
        <p className={styles.subtitle}>
          Calculateur de rentabilité craft · données DofusDB en temps réel
        </p>
      </header>

      <SearchBar onSelect={handleSelect} />

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Chargement de la recette…
        </div>
      )}

      {!loading && noRecipe && (
        <div className={styles.emptyCard}>
          Aucune recette trouvée — cet item n'est peut-être pas craftable.
        </div>
      )}

      {!loading && recipe && (
        <>
          <Settings
            qty={qty} setQty={setQty}
            tax={tax} setTax={setTax}
            sellPrice={sellPrice} setSellPrice={setSellPrice}
          />
          <RecipeTable
            ingredients={recipe.ingredients}
            qty={qty}
            prices={prices}
            excluded={excluded}
            onPriceChange={handlePriceChange}
            onToggleExclude={handleToggleExclude}
            totalCost={totalCost}
          />
          <Summary
            qty={qty}
            tax={tax}
            totalCost={totalCost}
            totalSell={totalSell}
            taxAmt={taxAmt}
            netRev={netRev}
            profit={profit}
            marginPct={marginPct}
            hasAllPrices={hasAllPrices}
          />
        </>
      )}

      {!loading && !recipe && !noRecipe && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚒</div>
          <p>Recherchez un item pour afficher sa recette et calculer votre marge</p>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="15" stroke="#166534" strokeWidth="1.5" />
      <path d="M16 6 L16 26 M6 16 L26 16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="4" fill="#22c55e" opacity="0.2" />
      <circle cx="16" cy="16" r="2" fill="#4ade80" />
    </svg>
  );
}
