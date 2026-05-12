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

  const rawIngredients = rec.ingredients || [];
  const quantities = rec.quantities || [];

  const normalizedIngredients = rawIngredients.map((ing, i) => {
    if (ing !== null && typeof ing === 'object') {
      return {
        itemId: ing.id,
        quantity: quantities[i] ?? 1,
        name: ing.name?.fr || '?',
        img: resolveImg(ing.img, ing.id),
      };
    }
    return { itemId: ing, quantity: quantities[i] ?? 1, name: null, img: null };
  });

  return { ...rec, ingredients: normalizedIngredients };
}

export async function fetchItem(itemId) {
  const res = await fetch(`${BASE}/items/${itemId}`);
  if (!res.ok) throw new Error('Item fetch failed');
  return res.json();
}

export async function checkCraftable(itemId) {
  try {
    const res = await fetch(`${BASE}/recipes?resultId=${itemId}&$limit=1`);
    if (!res.ok) return false;
    const data = await res.json();
    return (data.data?.length ?? 0) > 0;
  } catch { return false; }
}

// Recherche toutes les recettes contenant un ingrédient donné
// Essaie plusieurs formats de query FeathersJS jusqu'à en trouver un qui marche
export async function fetchRecipesByIngredient(itemId) {
  // Tentative 1 : ingredientIds (tableau brut d'IDs)
  try {
    const url = `${BASE}/recipes?ingredientIds=${itemId}&$limit=100`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return data.data;
    }
  } catch {}

  // Tentative 2 : ingredientIds[$in][]
  try {
    const url = `${BASE}/recipes?ingredientIds[$in][]=${itemId}&$limit=100`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return data.data;
    }
  } catch {}

  // Tentative 3 : ingredients (objet avec id)
  try {
    const url = `${BASE}/recipes?ingredients.id=${itemId}&$limit=100`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) return data.data;
    }
  } catch {}

  return [];
}

export async function fetchResultItem(resultId) {
  const res = await fetch(`${BASE}/items/${resultId}`);
  if (!res.ok) throw new Error('Item fetch failed');
  return res.json();
}

export function resolveImg(img, id) {
  if (!img) return `${BASE}/img/items/${id}.png`;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `${BASE}${img}`;
  return `${BASE}/img/${img}`;
}
