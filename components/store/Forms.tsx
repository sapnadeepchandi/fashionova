'use client';
import { useEffect, useRef } from 'react';
import { PendingCtx, useAction, usePending } from '@/lib/useAction';
import { subscribe, sendContact, login, register, saveProfile, type Res } from '@/app/(store)/actions';
import { useStore } from './StoreProvider';

export function Submit({ children, className = 'btn btn-dark' }: { children: React.ReactNode; className?: string }) {
  const pending = usePending();
  return <button className={className} type="submit" disabled={pending}>{pending ? <span className="spinner" /> : children}</button>;
}

function useToastResult(state: Res | null, onOk?: () => void) {
  const { toast } = useStore();
  useEffect(() => { if (state?.message) toast(state.message); if (state?.ok) onOk?.(); }, [state]); // eslint-disable-line
}

export function NewsletterForm({ variant }: { variant: 'footer' | 'block' }) {
  const [state, onSubmit, pending] = useAction(subscribe);
  const formRef = useRef<HTMLFormElement>(null);
  useToastResult(state, () => formRef.current?.reset());
  if (variant === 'footer') return <PendingCtx.Provider value={pending}><form ref={formRef} onSubmit={onSubmit}><input type="email" name="email" required placeholder="Your email address" aria-label="Email address" /><Submit className="">Join</Submit></form></PendingCtx.Provider>;
  return <PendingCtx.Provider value={pending}><form ref={formRef} onSubmit={onSubmit}><input type="email" name="email" required placeholder="Enter your email address" aria-label="Email address" /><Submit>Subscribe</Submit></form></PendingCtx.Provider>;
}

export function Field({ label, name, type = 'text', errors, full, defaultValue, required = true, textarea, autoComplete }: any) {
  return <div className={'fld' + (full ? ' full' : '') + (errors?.[name] ? ' bad' : '')}>
    {textarea ? <textarea id={name} name={name} placeholder=" " required={required} defaultValue={defaultValue} />
      : <input id={name} name={name} type={type} placeholder=" " required={required} defaultValue={defaultValue} autoComplete={autoComplete} />}
    <label htmlFor={name}>{label}</label>
    {errors?.[name] && <small style={{ color: '#9B4A44', fontSize: 12 }}>{errors[name]}</small>}
  </div>;
}

export function ContactForm({ topics }: { topics: string[] }) {
  const [state, onSubmit, pending] = useAction(sendContact);
  const formRef = useRef<HTMLFormElement>(null);
  useToastResult(state, () => formRef.current?.reset());
  return <PendingCtx.Provider value={pending}><form ref={formRef} onSubmit={onSubmit}><div className="fields">
    <Field label="Your name" name="name" errors={state?.errors} />
    <Field label="Email address" name="email" type="email" errors={state?.errors} />
    <div className="fld full"><select id="topic" name="topic">{topics.map(t => <option key={t}>{t}</option>)}</select><label htmlFor="topic">Topic</label></div>
    <Field label="Your message" name="message" textarea full errors={state?.errors} />
    <div className="full"><Submit>Send Message</Submit></div>
  </div></form></PendingCtx.Provider>;
}

export function LoginForm() {
  const [state, onSubmit, pending] = useAction(login);
  return <PendingCtx.Provider value={pending}><form className="box" onSubmit={onSubmit}><h3>Sign In</h3><p>Welcome back. Sign in to view your orders.</p>
    {state && !state.ok && <div className="err-box">{state.message}</div>}
    <div className="fields"><Field label="Email address" name="email" type="email" full autoComplete="email" /><Field label="Password" name="password" type="password" full autoComplete="current-password" />
      <div className="full"><Submit className="btn btn-dark btn-block">Sign In</Submit></div></div></form></PendingCtx.Provider>;
}
export function RegisterForm() {
  const [state, onSubmit, pending] = useAction(register);
  return <PendingCtx.Provider value={pending}><form className="box" style={{ background: 'var(--cream)', borderColor: 'var(--cream)' }} onSubmit={onSubmit}><h3>Create an Account</h3><p>Track orders and check out faster.</p>
    {state && !state.ok && <div className="err-box">{state.message}</div>}
    <div className="fields"><Field label="Full name" name="name" full errors={state?.errors} autoComplete="name" /><Field label="Email address" name="email" type="email" full errors={state?.errors} autoComplete="email" />
      <Field label="Password (8+ characters)" name="password" type="password" full errors={state?.errors} autoComplete="new-password" />
      <div className="full"><Submit className="btn btn-line btn-block">Create Account</Submit></div></div></form></PendingCtx.Provider>;
}
export function ProfileForm({ c }: { c: any }) {
  const [state, onSubmit, pending] = useAction(saveProfile);
  useToastResult(state);
  return <PendingCtx.Provider value={pending}><form onSubmit={onSubmit}><div className="fields">
    <Field label="Full name" name="name" defaultValue={c.name} errors={state?.errors} /><Field label="Phone" name="phone" defaultValue={c.phone} required={false} />
    <Field label="Address" name="address_line1" defaultValue={c.address_line1} full required={false} /><Field label="Apartment, suite" name="address_line2" defaultValue={c.address_line2} full required={false} />
    <Field label="City" name="city" defaultValue={c.city} required={false} /><Field label="Postcode" name="postcode" defaultValue={c.postcode} required={false} />
    <Field label="Country" name="country" defaultValue={c.country || 'United Kingdom'} full required={false} />
    <div className="full"><Submit>Save Details</Submit></div></div></form></PendingCtx.Provider>;
}
