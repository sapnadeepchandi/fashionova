'use client';
import { createContext, useContext, useState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * Runs a server action from a form without React's automatic form reset,
 * so whatever the user typed stays in place when validation fails.
 */
export function useAction<S>(action: (prev: S | null, fd: FormData) => Promise<S>, opts: { confirm?: string } = {}) {
  const [state, setState] = useState<S | null>(null);
  const [pending, start] = useTransition();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    const fd = new FormData(e.currentTarget);
    start(async () => { setState(await action(state, fd)); });
  };
  return [state, onSubmit, pending] as const;
}
export const PendingCtx = createContext(false);
export function usePending() { const ctx = useContext(PendingCtx); const fs = useFormStatus(); return ctx || fs.pending; }
