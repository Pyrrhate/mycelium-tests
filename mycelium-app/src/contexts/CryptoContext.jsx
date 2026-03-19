import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';
import { deriveAesKeyFromPassword, randomSaltB64 } from '../utils/e2eeCrypto';

const CryptoContext = createContext(null);

export function CryptoProvider({ userId, children }) {
  const [salt, setSalt] = useState(null);
  const [unlockedKey, setUnlockedKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!userId || !supabase) return;
      const { data, error: selErr } = await supabase.from('profiles').select('encryption_salt').eq('id', userId).maybeSingle();
      if (selErr && String(selErr.message || '').includes("encryption_salt")) {
        if (mounted) {
          setSalt(null);
          setError("La colonne profiles.encryption_salt n'existe pas encore. Exécutez la migration SQL de chiffrement.");
        }
        return;
      }
      if (mounted) setSalt(data?.encryption_salt || null);
    };
    load();
    return () => { mounted = false; };
  }, [userId]);

  const activateVault = async (password) => {
    if (!userId || !supabase) return false;
    if (!password || password.length < 8) {
      setError('La clé maîtresse doit faire au moins 8 caractères.');
      return false;
    }
    setBusy(true);
    setError('');
    try {
      const nextSalt = salt || randomSaltB64();
      if (!salt) {
        const { error: upErr } = await supabase.from('profiles').update({ encryption_salt: nextSalt }).eq('id', userId);
        if (upErr && String(upErr.message || '').includes("encryption_salt")) {
          setError("La colonne profiles.encryption_salt n'existe pas encore. Exécutez la migration SQL de chiffrement.");
          return false;
        }
        if (upErr) throw upErr;
        setSalt(nextSalt);
      }
      const key = await deriveAesKeyFromPassword(password, nextSalt);
      setUnlockedKey(key);
      return true;
    } catch (e) {
      setError(e?.message || 'Impossible d’activer le coffre-fort.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const lock = () => {
    setUnlockedKey(null);
  };

  const value = useMemo(() => ({
    salt,
    hasVault: !!salt,
    unlocked: !!unlockedKey,
    key: unlockedKey,
    busy,
    error,
    activateVault,
    lock,
  }), [salt, unlockedKey, busy, error]);

  return <CryptoContext.Provider value={value}>{children}</CryptoContext.Provider>;
}

export function useCryptoVault() {
  const ctx = useContext(CryptoContext);
  if (!ctx) throw new Error('useCryptoVault must be used inside CryptoProvider');
  return ctx;
}
