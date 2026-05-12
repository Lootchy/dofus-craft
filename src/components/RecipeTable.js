import { useState } from 'react';
import { formatKamas } from '../utils';
import styles from './RecipeTable.module.css';
const FB = 'https://api.dofusdb.fr/img/items';

export default function RecipeTable({ ingredients, qty, prices, qtyMode, excluded, expanded, subRecipes, subPrices, subQtyMode, loadingExpand, onPriceChange, onQtyModeChange, onSubPriceChange, onSubQtyModeChange, onToggleExclude, onToggleExpand, totalCost, getIngredientCost }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Recette</span>
        <span className={styles.badge}>{ingredients.length} ingrédient{ingredients.length > 1 ? 's' : ''}</span>
        {qty > 1 && <span className={styles.qtyHint}>pour {qty} crafts</span>}
      </div>
      <div className={styles.colHeaders}>
        <span className={styles.colCheck}/>
        <span className={`${styles.col} ${styles.colResource}`}>Ressource</span>
        <span className={`${styles.col} ${styles.colQty}`}>Qté</span>
        <span className={`${styles.col} ${styles.colPriceH}`}>Prix (kamas)</span>
        <span className={`${styles.col} ${styles.colSub}`}>Sous-total</span>
      </div>
      {ingredients.map((ing, i) => {
        const key = String(ing.itemId);
        const isExcluded = excluded.has(key);
        const isExpanded = expanded.has(key);
        const isLoadingExp = loadingExpand.has(key);
        return (
          <div key={key}>
            <IngRow ing={ing} i={i} qty={qty} priceValue={prices[key]||''} currentQtyMode={qtyMode[key]||1}
              subCost={getIngredientCost(ing)} isExcluded={isExcluded} isExpanded={isExpanded} isLoadingExpand={isLoadingExp}
              onPriceChange={(v) => onPriceChange(ing.itemId, v)} onQtyModeChange={(m) => onQtyModeChange(ing.itemId, m)}
              onToggleExclude={() => onToggleExclude(ing.itemId)}
              onToggleExpand={ing.craftable ? () => onToggleExpand(ing.itemId) : null}
            />
            {isExpanded && subRecipes[key] && (
              <div className={styles.subSection}>
                <div className={styles.subHeader}><span>↳ Sous-recette de <strong>{ing.name}</strong></span><span className={styles.subHint}>×{ing.quantity * qty} à fabriquer</span></div>
                {subRecipes[key].map((sub, si) => {
                  const sk = `${key}_${sub.itemId}`;
                  const mode = subQtyMode[sk]||1;
                  const rawP = parseFloat(subPrices[sk]||0);
                  const subTotal = (rawP/mode) * sub.quantity * ing.quantity * qty;
                  return <SubRow key={sk} sub={sub} si={si} subTotalQty={sub.quantity*ing.quantity*qty} priceValue={subPrices[sk]||''} currentQtyMode={mode} subTotal={subTotal} onPriceChange={(v) => onSubPriceChange(key, sub.itemId, v)} onQtyModeChange={(m) => onSubQtyModeChange(key, sub.itemId, m)}/>;
                })}
                <div className={styles.subTotal}><span>Coût sous-recette (×{ing.quantity*qty})</span><span className={styles.subTotalVal}>{formatKamas(getIngredientCost(ing))} ₭</span></div>
              </div>
            )}
          </div>
        );
      })}
      <div className={styles.totalRow}><span className={styles.totalLabel}>Coût total (×{qty})</span><span className={styles.totalVal}>{formatKamas(totalCost)} ₭</span></div>
    </div>
  );
}

function IngRow({ ing, i, qty, priceValue, currentQtyMode, subCost, isExcluded, isExpanded, isLoadingExpand, onPriceChange, onQtyModeChange, onToggleExclude, onToggleExpand }) {
  const [copied, setCopied] = useState(false);
  const imgSrc = ing.img || `${FB}/${ing.itemId}.png`;
  const raw = parseFloat(priceValue||0); const sub = isExpanded ? subCost : (isExcluded ? 0 : (raw/currentQtyMode)*ing.quantity*qty);
  function copy() { navigator.clipboard.writeText(ing.name).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }
  return (
    <div className={`${styles.row} ${i%2===0?styles.rowEven:styles.rowOdd} ${isExcluded?styles.excluded:''}`}>
      <button className={`${styles.checkbox} ${isExcluded?styles.checkboxOff:styles.checkboxOn}`} onClick={onToggleExclude} title="Exclure">
        {!isExcluded && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </button>
      <div className={styles.colResource}>
        <img className={styles.img} src={imgSrc} alt={ing.name} onError={(e)=>{e.target.style.visibility='hidden';}}/>
        <button className={styles.nameBtn} onClick={copy} title="Copier">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{opacity:.35,flexShrink:0}}><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.2"/></svg>
          {ing.name}
          <span className={`${styles.copiedTag} ${copied?styles.copiedVisible:''}`}>copié !</span>
        </button>
        {onToggleExpand && (
          <button className={`${styles.expandBtn} ${isExpanded?styles.expandBtnActive:''}`} onClick={onToggleExpand} disabled={isLoadingExpand}>
            {isLoadingExpand ? <span className={styles.miniSpinner}/> : <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{transition:'transform .2s',transform:isExpanded?'rotate(180deg)':'none'}}><path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            <span>{isExpanded?'Replier':'Craftable'}</span>
          </button>
        )}
      </div>
      <span className={styles.colQty}><strong>×{ing.quantity*qty}</strong>{qty>1&&<small>({ing.quantity}/craft)</small>}</span>
      <div className={`${styles.colPrice} ${isExpanded?styles.colPriceDisabled:''}`}>
        {isExpanded ? <span className={styles.subRecipeLabel}>↳ sous-recette</span> : <>
          <input type="number" min={0} value={priceValue} onChange={(e)=>onPriceChange(e.target.value)} placeholder="0" disabled={isExcluded} className={`${styles.priceInput} ${priceValue&&!isExcluded?styles.filled:''} ${isExcluded?styles.inputDisabled:''}`}/>
          <QtyToggle mode={currentQtyMode} onChange={onQtyModeChange} disabled={isExcluded}/>
        </>}
      </div>
      <span className={`${styles.colSub} ${sub>0?styles.hasValue:''}`}>{isExcluded?<span className={styles.excludedLabel}>exclu</span>:sub>0?`${formatKamas(sub)} ₭`:'—'}</span>
    </div>
  );
}

function SubRow({ sub, si, subTotalQty, priceValue, currentQtyMode, subTotal, onPriceChange, onQtyModeChange }) {
  const [copied, setCopied] = useState(false);
  const imgSrc = sub.img || `${FB}/${sub.itemId}.png`;
  function copy() { navigator.clipboard.writeText(sub.name).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }
  return (
    <div className={`${styles.subRow} ${si%2===0?styles.subRowEven:styles.subRowOdd}`}>
      <span className={styles.subIndent}>└</span>
      <div className={styles.colResource}><img className={styles.imgSm} src={imgSrc} alt="" onError={(e)=>{e.target.style.visibility='hidden';}}/>
        <button className={styles.nameBtnSm} onClick={copy}>{sub.name}<span className={`${styles.copiedTag} ${copied?styles.copiedVisible:''}`}>copié !</span></button>
      </div>
      <span className={styles.colQty}><strong>×{subTotalQty}</strong></span>
      <div className={styles.colPrice}>
        <input type="number" min={0} value={priceValue} onChange={(e)=>onPriceChange(e.target.value)} placeholder="0" className={`${styles.priceInput} ${priceValue?styles.filled:''}`}/>
        <QtyToggle mode={currentQtyMode} onChange={onQtyModeChange}/>
      </div>
      <span className={`${styles.colSub} ${subTotal>0?styles.hasValue:''}`}>{subTotal>0?`${formatKamas(subTotal)} ₭`:'—'}</span>
    </div>
  );
}

function QtyToggle({ mode, onChange, disabled }) {
  return (
    <div className={`${styles.modeToggle} ${disabled?styles.modeToggleDisabled:''}`}>
      {[1,10,100].map((m) => <button key={m} className={`${styles.modeBtn} ${mode===m?styles.modeBtnActive:''}`} onClick={()=>onChange(m)} disabled={disabled}>×{m}</button>)}
    </div>
  );
}
