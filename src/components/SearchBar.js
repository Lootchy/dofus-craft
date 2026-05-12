import { useState, useEffect, useRef } from 'react';
import { searchItems, resolveImg } from '../api';
import styles from './SearchBar.module.css';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (query.length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const items = await searchItems(query);
        setResults(items);
        setOpen(items.length > 0);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  function handleSelect(item) {
    setQuery(item.name?.fr || '');
    setResults([]); setOpen(false);
    onSelect(item);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inputWrap}>
        <svg className={styles.icon} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input className={styles.input} value={query}
          onChange={(e) => { setQuery(e.target.value); onSelect(null); }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder="Rechercher un item craftable… (ex: Cape du Comte, Dofus Ocre)"
          autoComplete="off"
        />
        {loading && <span className={styles.spinner} />}
      </div>
      {open && (
        <ul className={styles.dropdown}>
          {results.map((item) => (
            <li key={item.id} className={styles.item} onMouseDown={() => handleSelect(item)}>
              <img className={styles.img} src={resolveImg(item.img, item.id)} alt=""
                onError={(e) => { e.target.style.visibility = 'hidden'; }} />
              <span className={styles.name}>{item.name?.fr}</span>
              {item.level && <span className={styles.level}>Niv. {item.level}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
