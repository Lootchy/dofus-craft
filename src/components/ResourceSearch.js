import { useState, useEffect, useRef } from 'react';
import { searchItems, fetchRecipesByIngredient, fetchResultItem, resolveImg } from '../api';
import styles from './ResourceSearch.module.css';

const BASE = 'https://api.dofusdb.fr';

export default function ResourceSearch() {
  const [query, setQuery]         = useState('');
  const [sugs, setSugs]           = useState([]);
  const [showSug, setShowSug]     = useState(false);
  const [resources, setResources] = useState([]); // items sélectionnés
  const [minLevel, setMinLevel]   = useState('');
  const [maxLevel, setMaxLevel]   = useState('');
  const [results, setResults]     = useState(null); // null = pas cherché, [] = vide
  const [loading, setLoading]     = useState(false);
  const [matchAll, setMatchAll]   = useState(true); // true = ET, false = OU
  const timerRef = useRef(null);

  // Autocomplete
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) { setSugs([]); setShowSug(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const items = await searchItems(query);
        setSugs(items);
        setShowSug(items.length > 0);
      } catch { setSugs([]); }
    }, 320);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  function addResource(item) {
    if (resources.find((r) => r.id === item.id)) return; // pas de doublon
    setResources((prev) => [...prev, item]);
    setQuery('');
    setSugs([]);
    setShowSug(false);
    setResults(null);
  }

  function removeResource(id) {
    setResources((prev) => prev.filter((r) => r.id !== id));
    setResults(null);
  }

  async function handleSearch() {
    if (resources.length === 0) return;
    setLoading(true);
    setResults(null);

    try {
      // Pour chaque ressource, récupérer les recettes qui la contiennent
      const recipeArrays = await Promise.all(
        resources.map((r) => fetchRecipesByIngredient(r.id))
      );

      // Construire un map resultId → { recipe, matchedIngredientIds }
      const recipeMap = new Map();

      recipeArrays.forEach((recipes, ri) => {
        const resourceId = resources[ri].id;
        recipes.forEach((rec) => {
          const key = rec.resultId;
          if (!recipeMap.has(key)) {
            recipeMap.set(key, { recipe: rec, matchedIds: new Set() });
          }
          recipeMap.get(key).matchedIds.add(resourceId);
        });
      });

      // Filtrer selon le mode ET/OU
      const filtered = [...recipeMap.values()].filter(({ matchedIds }) => {
        if (matchAll) return resources.every((r) => matchedIds.has(r.id));
        return matchedIds.size > 0;
      });

      // Trier : d'abord les recettes avec le plus de ressources matchées
      filtered.sort((a, b) => b.matchedIds.size - a.matchedIds.size);

      // Charger les items résultats (avec nom + image + niveau)
      const withItems = await Promise.all(
        filtered.slice(0, 50).map(async ({ recipe, matchedIds }) => {
          try {
            const item = await fetchResultItem(recipe.resultId);
            return { recipe, matchedIds, item };
          } catch {
            return { recipe, matchedIds, item: null };
          }
        })
      );

      // Filtrer par niveau si demandé
      const lvlMin = parseInt(minLevel) || 0;
      const lvlMax = parseInt(maxLevel) || 999;

      const final = withItems.filter(({ item }) => {
        if (!item) return false;
        const lvl = item.level ?? 0;
        return lvl >= lvlMin && lvl <= lvlMax;
      });

      setResults(final);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.intro}>
        <h2 className={styles.introTitle}>
          <IconSearch /> Recherche par ressources
        </h2>
        <p className={styles.introText}>
          Ajoutez les ressources que vous possédez — l'outil trouve tous les items craftables qui les utilisent.
        </p>
      </div>

      {/* Barre de recherche ressource */}
      <div className={styles.searchSection}>
        <label className={styles.sectionLabel}>Vos ressources</label>
        <div className={styles.searchWrap}>
          <IconIngredient className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => sugs.length > 0 && setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 160)}
            placeholder="Ajouter une ressource… (ex: Encre du Kralamoure)"
          />
          {showSug && (
            <ul className={styles.dropdown}>
              {sugs.map((it) => (
                <li key={it.id} className={styles.dropItem} onMouseDown={() => addResource(it)}>
                  <img
                    className={styles.dropImg}
                    src={resolveImg(it.img, it.id)}
                    alt=""
                    onError={(e) => { e.target.style.visibility = 'hidden'; }}
                  />
                  <span className={styles.dropName}>{it.name?.fr}</span>
                  {it.level && <span className={styles.dropLvl}>Niv. {it.level}</span>}
                  <span className={styles.dropAdd}>+ Ajouter</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chips des ressources sélectionnées */}
        {resources.length > 0 && (
          <div className={styles.chips}>
            {resources.map((r) => (
              <div key={r.id} className={styles.chip}>
                <img
                  className={styles.chipImg}
                  src={resolveImg(r.img, r.id)}
                  alt=""
                  onError={(e) => { e.target.style.visibility = 'hidden'; }}
                />
                <span className={styles.chipName}>{r.name?.fr}</span>
                <button className={styles.chipRemove} onClick={() => removeResource(r.id)} title="Retirer">
                  <IconX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.sectionLabel}>Niveau de l'item</label>
          <div className={styles.levelRow}>
            <input
              type="number" min={1} max={200}
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
              placeholder="Min"
              className={styles.lvlInput}
            />
            <span className={styles.lvlSep}>—</span>
            <input
              type="number" min={1} max={200}
              value={maxLevel}
              onChange={(e) => setMaxLevel(e.target.value)}
              placeholder="Max"
              className={styles.lvlInput}
            />
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.sectionLabel}>Mode de correspondance</label>
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${matchAll ? styles.modeBtnActive : ''}`}
              onClick={() => setMatchAll(true)}
            >
              <IconAll /> Toutes les ressources
            </button>
            <button
              className={`${styles.modeBtn} ${!matchAll ? styles.modeBtnActive : ''}`}
              onClick={() => setMatchAll(false)}
            >
              <IconAny /> Au moins une
            </button>
          </div>
        </div>

        <button
          className={`${styles.searchBtn} ${resources.length === 0 ? styles.searchBtnDisabled : ''}`}
          onClick={handleSearch}
          disabled={resources.length === 0 || loading}
        >
          {loading ? <span className={styles.btnSpinner} /> : <IconSearch />}
          {loading ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>

      {/* Résultats */}
      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Recherche des recettes en cours…</p>
        </div>
      )}

      {!loading && results !== null && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {results.length > 0
                ? `${results.length} item${results.length > 1 ? 's' : ''} craftable${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''}`
                : 'Aucun résultat'}
            </span>
            {results.length > 0 && (
              <span className={styles.resultsHint}>
                Cliquez sur un item pour ouvrir le calculateur
              </span>
            )}
          </div>

          {results.length === 0 && (
            <div className={styles.noResults}>
              <div className={styles.noResultsIcon}>🔍</div>
              <p>Aucun item craftable trouvé avec {matchAll ? 'toutes ces' : 'ces'} ressources.</p>
              <p className={styles.noResultsSub}>Essayez le mode "Au moins une" ou retirez certaines ressources.</p>
            </div>
          )}

          <div className={styles.grid}>
            {results.map(({ item, recipe, matchedIds }) => (
              <ResultCard
                key={recipe.resultId}
                item={item}
                recipe={recipe}
                matchedIds={matchedIds}
                resources={resources}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && results === null && resources.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎒</div>
          <p>Ajoutez des ressources ci-dessus pour trouver les items craftables</p>
        </div>
      )}
    </div>
  );
}

/* ─── Carte résultat ─── */
function ResultCard({ item, recipe, matchedIds, resources }) {
  const imgSrc = resolveImg(item.img, item.id);
  const matchCount = matchedIds.size;
  const totalNeeded = resources.length;
  const isFullMatch = matchCount === totalNeeded;

  // Extraire les ingrédients de la recette
  const rawIngs = recipe.ingredients || [];
  const quantities = recipe.quantities || [];
  const ingredients = rawIngs.map((ing, i) => ({
    id: typeof ing === 'object' ? ing.id : ing,
    name: typeof ing === 'object' ? (ing.name?.fr || '?') : null,
    img: typeof ing === 'object' ? resolveImg(ing.img, ing.id) : null,
    quantity: quantities[i] ?? 1,
  }));

  return (
    <div className={`${styles.resultCard} ${isFullMatch ? styles.resultCardFull : styles.resultCardPartial}`}>
      {/* Badge match */}
      <div className={`${styles.matchBadge} ${isFullMatch ? styles.matchBadgeFull : styles.matchBadgePartial}`}>
        {matchCount}/{totalNeeded} ressource{totalNeeded > 1 ? 's' : ''}
      </div>

      {/* Header item */}
      <div className={styles.itemHeader}>
        <img
          className={styles.itemImg}
          src={imgSrc}
          alt={item.name?.fr}
          onError={(e) => { e.target.style.visibility = 'hidden'; }}
        />
        <div className={styles.itemInfo}>
          <span className={styles.itemName}>{item.name?.fr || '?'}</span>
          {item.level && <span className={styles.itemLevel}>Niveau {item.level}</span>}
          {item.type?.name?.fr && <span className={styles.itemType}>{item.type.name.fr}</span>}
        </div>
      </div>

      {/* Ingrédients */}
      <div className={styles.ingList}>
        {ingredients.map((ing) => {
          const isOwned = resources.some((r) => r.id === ing.id);
          return (
            <div key={ing.id} className={`${styles.ingRow} ${isOwned ? styles.ingRowOwned : ''}`}>
              {ing.img ? (
                <img className={styles.ingImg} src={ing.img} alt=""
                  onError={(e) => { e.target.style.visibility = 'hidden'; }} />
              ) : (
                <div className={styles.ingImgPlaceholder} />
              )}
              <span className={styles.ingName}>{ing.name || `#${ing.id}`}</span>
              <span className={styles.ingQty}>×{ing.quantity}</span>
              {isOwned && <span className={styles.ownedDot} title="Vous possédez cet ingrédient" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Icônes ─── */
function IconSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconIngredient({ className }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2C5 2 2 5 2 8s3 6 6 6 6-3 6-6-3-6-6-6z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconAll() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconAny() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="4" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}
