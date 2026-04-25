const BASE = 'https://api.dofusdb.fr';

export async function searchItems(query) {
  const url = `${BASE}/items?name.fr[$regex]=${encodeURIComponent(query)}&name.fr[$options]=i&$limit=10&$sort[level]=-1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Search failed');
  const data = await res.json();
  return (data.data || []).filter((it) => it.name?.fr);
}

export async function fetchRecipe(itemId) {
  const res = await fetch(`${BASE}/recipes?resultId=${itemId}&$limit=1`);
  if (!res.ok) throw new Error('Recipe fetch failed');
  const data = await res.json();
  const rec = data.data?.[0];
  if (!rec) return null;

  // DofusDB: rec.ingredients = array of item objects OR raw IDs
  //          rec.quantities  = parallel array of quantities
  const rawIngredients = rec.ingredients || [];
  const quantities = rec.quantities || [];

  const normalizedIngredients = rawIngredients.map((ing, i) => {
    if (ing !== null && typeof ing === 'object') {
      // Full item object already embedded in recipe — use directly
      return {
        itemId: ing.id,
        quantity: quantities[i] ?? 1,
        name: ing.name?.fr || '?',
        img: resolveImg(ing.img, ing.id),
      };
    }
    // Raw numeric ID — needs a separate fetchItem call in App.js
    return {
      itemId: ing,
      quantity: quantities[i] ?? 1,
      name: null,
      img: null,
    };
  });

  return { ...rec, ingredients: normalizedIngredients };
}

export async function fetchItem(itemId) {
  const res = await fetch(`${BASE}/items/${itemId}`);
  if (!res.ok) throw new Error('Item fetch failed');
  return res.json();
}

// Handle img field: might be full URL, path, or just filename
function resolveImg(img, id) {
  if (!img) return `${BASE}/img/items/${id}.png`;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${BASE}${img}`;
  return `${BASE}/img/${img}`;
}

export { resolveImg };
