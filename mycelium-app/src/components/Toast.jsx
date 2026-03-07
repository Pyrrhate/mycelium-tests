import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Toasts bioluminescents : succès (doré) ou erreur (rouge/ambre).
 */
export function Toast({ id, message, variant = 'success', onDismiss, duration = 4000 }) {
  useEffect(() => {
    if (!onDismiss || duration <= 0) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);

  const isSuccess = variant === 'success';
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      className={`
        rounded-xl border backdrop-blur-xl px-4 py-3 shadow-lg
        ${isSuccess
          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#D4AF37]'
          : 'bg-red-500/15 border-red-400/50 text-red-300'
        }
      `}
      style={{
        boxShadow: isSuccess
          ? '0 0 24px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.08)'
          : '0 0 24px rgba(248,113,113,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      role="alert"
    >
      <p className="text-sm font-medium">{message}</p>
    </motion.div>
  );
}

/**
 * Conteneur de toasts (fixe en haut au centre).
 */
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <Toast
              key={t.id}
              id={t.id}
              message={t.message}
              variant={t.variant}
              onDismiss={() => removeToast(t.id)}
              duration={t.duration}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
