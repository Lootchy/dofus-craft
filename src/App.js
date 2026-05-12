import { useState, useCallback } from 'react';
import { fetchRecipe, fetchItem, resolveImg, checkCraftable } from './api';
import SearchBar from './components/SearchBar';
import Settings from './components/Settings';
import RecipeTable from './components/RecipeTable';
import Summary from './components/Summary';
import CompareCard from './components/CompareCard';
import ResourceSearch from './components/ResourceSearch';
import styles from './App.module.css';

export default function App() {
  const [tab, setTab] = useState('craft'); // 'craft' | 'resources'

  // ── État outil Craft ──
  const [recipe, setRecipe]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [noRecipe, setNoRecipe]     = useState(false);
  const [qty, setQty]               = useState(1);
  const [tax, setTax]               = useState(2);
  const [hdvPrice, setHdvPrice]     = useState('');
  const [prices, setPrices]         = useState({});
  const [qtyMode, setQtyMode]       = useState({});
  const [excluded, setExcluded]     = useState(new Set());
  const [expanded, setExpanded]           = useState(new Set());
  const [subRecipes, setSubRecipes]       = useState({});
  const [subPrices, setSubPrices]         = useState({});
  const [subQtyMode, setSubQtyMode]       = useState({});
  const [loadingExpand, setLoadingExpand] = useState(new Set());

  const handleSelect = useCallback(async (item) => {
    if (!item) { setRecipe(null); setNoRecipe(false); return; }
    setRecipe(null); setNoRecipe(false);
    setPrices({}); setQtyMode({}); setHdvPrice('');
    setExcluded(new Set()); setExpanded(new Set());
    setSubRecipes({}); setSubPrices({}); setSubQtyMode({});
    setLoading(true);
    try {
      const rec = await fetchRecipe(item.id);
      if (!rec) { setNoRecipe(true); return; }
      const withMeta = await Promise.all(
        rec.ingredients.map(async (ing) => {
          if (ing.name !== null) return { ...ing, craftable: false };
          try {
            const data = await fetchItem(ing.itemId);
            return { ...ing, name: data.name?.fr || '?', img: resolveImg(data.img, ing.itemId), craftable: false };
          } catch { return { ...ing, name: '?', img: null, craftable: false }; }
        })
      );
      const craftChecks = await Promise.all(withMeta.map((ing) => checkCraftable(ing.itemId)));
      setRecipe({ ...rec, ingredients: withMeta.map((ing, i) => ({ ...ing, craftable: craftChecks[i] })) });
    } catch { setNoRecipe(true); }
    finally { setLoading(false); }
  }, []);

  const handlePriceChange    = (id, val) => setPrices((p)  => ({ ...p, [String(id)]: val }));
  const handleQtyModeChange  = (id, m)   => setQtyMode((p) => ({ ...p, [String(id)]: m }));
  const handleSubPriceChange    = (pid, cid, val) => setSubPrices((p)  => ({ ...p, [`${pid}_${cid}`]: val }));
  const handleSubQtyModeChange  = (pid, cid, m)   => setSubQtyMode((p) => ({ ...p, [`${pid}_${cid}`]: m }));
  const handleToggleExclude = (id) => {
    const k = String(id);
    setExcluded((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  };
  const handleToggleExpand = async (id) => {
    const k = String(id);
    if (expanded.has(k)) { setExpanded((p) => { const n = new Set(p); n.delete(k); return n; }); return; }
    if (subRecipes[k])   { setExpanded((p) => new Set([...p, k])); return; }
    setLoadingExpand((p) => new Set([...p, k]));
    try {
      const rec = await fetchRecipe(id);
      if (!rec) return;
      const ings = await Promise.all(rec.ingredients.map(async (ing) => {
        if (ing.name !== null) return ing;
        try {
          const data = await fetchItem(ing.itemId);
          return { ...ing, name: data.name?.fr || '?', img: resolveImg(data.img, ing.itemId) };
        } catch { return { ...ing, name: '?', img: null }; }
      }));
      setSubRecipes((p) => ({ ...p, [k]: ings }));
      setExpanded((p) => new Set([...p, k]));
    } catch {}
    finally { setLoadingExpand((p) => { const n = new Set(p); n.delete(k); return n; }); }
  };

  const getUnitCost = (raw, mode) => parseFloat(raw || 0) / (mode || 1);
  const getIngredientCost = (ing) => {
    const k = String(ing.itemId);
    if (excluded.has(k)) return 0;
    if (expanded.has(k) && subRecipes[k]) {
      return subRecipes[k].reduce((s, sub) => {
        const sk = `${k}_${sub.itemId}`;
        return s + getUnitCost(subPrices[sk], subQtyMode[sk]) * sub.quantity * ing.quantity * qty;
      }, 0);
    }
    return getUnitCost(prices[k], qtyMode[k]) * ing.quantity * qty;
  };

  const totalCost  = recipe?.ingredients.reduce((s, ing) => s + getIngredientCost(ing), 0) ?? 0;
  const totalSell  = parseFloat(hdvPrice || 0) * qty;
  const taxAmt     = totalSell * (tax / 100);
  const netRev     = totalSell - taxAmt;
  const profit     = netRev - totalCost;
  const marginPct  = totalSell > 0 ? (profit / totalSell) * 100 : 0;
  const hasAllPrices = !!recipe &&
    recipe.ingredients.filter((ing) => !excluded.has(String(ing.itemId))).every((ing) => {
      const k = String(ing.itemId);
      if (expanded.has(k) && subRecipes[k]) return subRecipes[k].every((s) => parseFloat(subPrices[`${k}_${s.itemId}`] || 0) > 0);
      return parseFloat(prices[k] || 0) > 0;
    }) && parseFloat(hdvPrice || 0) > 0;

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <img src="https://www.ankama.com/img/layout/logo-ankama-white.svg" alt="Ankama"
            className={styles.ankamaLogo} onError={(e) => { e.target.style.display = 'none'; }} />
          <div className={styles.divider} />
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="15" stroke="#166534" strokeWidth="1.5" />
            <path d="M16 6L16 26M6 16L26 16" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="16" r="5" fill="#22c55e" opacity="0.15" />
            <circle cx="16" cy="16" r="2.5" fill="#4ade80" />
          </svg>
          <h1 className={styles.title}>CraftCalc</h1>
        </div>
        <p className={styles.subtitle}>Calculateur de rentabilité craft · données DofusDB en temps réel</p>
      </header>

      {/* Navigation tabs */}
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'craft' ? styles.tabActive : ''}`}
          onClick={() => setTab('craft')}
        >
          <IconHammer />
          Calculateur de craft
        </button>
        <button
          className={`${styles.tab} ${tab === 'resources' ? styles.tabActive : ''}`}
          onClick={() => setTab('resources')}
        >
          <IconSearch />
          Recherche par ressources
        </button>
      </nav>

      {/* Tab : Calculateur */}
      {tab === 'craft' && (
        <div className={styles.tabContent}>
          <SearchBar onSelect={handleSelect} />
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Chargement de la recette…</p>
            </div>
          )}
          {!loading && noRecipe && (
            <div className={`${styles.emptyCard} ${styles.fadeIn}`}>
              Aucune recette trouvée — cet item n'est peut-être pas craftable.
            </div>
          )}
          {!loading && recipe && (
            <div className={styles.fadeIn}>
              <Settings qty={qty} setQty={setQty} tax={tax} setTax={setTax} hdvPrice={hdvPrice} setHdvPrice={setHdvPrice} />
              <RecipeTable
                ingredients={recipe.ingredients} qty={qty}
                prices={prices} qtyMode={qtyMode} excluded={excluded}
                expanded={expanded} subRecipes={subRecipes} subPrices={subPrices} subQtyMode={subQtyMode}
                loadingExpand={loadingExpand}
                onPriceChange={handlePriceChange} onQtyModeChange={handleQtyModeChange}
                onSubPriceChange={handleSubPriceChange} onSubQtyModeChange={handleSubQtyModeChange}
                onToggleExclude={handleToggleExclude} onToggleExpand={handleToggleExpand}
                totalCost={totalCost} getIngredientCost={getIngredientCost}
              />
              <CompareCard craftCost={totalCost} hdvPrice={hdvPrice} qty={qty} />
              <Summary
                qty={qty} tax={tax} totalCost={totalCost} totalSell={totalSell}
                taxAmt={taxAmt} netRev={netRev} profit={profit} marginPct={marginPct}
                hasAllPrices={hasAllPrices}
              />
            </div>
          )}
          {!loading && !recipe && !noRecipe && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚒</div>
              <p>Recherchez un item pour afficher sa recette et calculer votre marge</p>
            </div>
          )}
        </div>
      )}

      {/* Tab : Recherche par ressources */}
      {tab === 'resources' && (
        <div className={styles.tabContent}>
          <ResourceSearch />
        </div>
      )}
    </div>
  );
}

function IconHammer() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 12L7 7M9 2L12 5L8.5 8.5L5.5 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="10.5" width="3" height="2" rx="0.5" fill="currentColor" opacity="0.5" transform="rotate(-45 2 12)" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
