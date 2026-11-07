import { Link } from 'react-router-dom'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = { primary: 'btn-primary', secondary: 'btn-secondary', danger: 'btn-danger', ghost: 'btn-ghost' }
  return <button className={`${styles[variant]} ${className}`} {...props}>{children}</button>
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function PageHeader({ eyebrow, title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ title, body, action }) {
  return (
    <div className="card px-6 py-14 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden">
          <div className="h-40 animate-pulse bg-slate-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Badge({ children, className = '' }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>
}

export function Stars({ value = 0 }) {
  const rounded = Math.round(Number(value) || 0)
  return (
    <span className="text-amber-500" aria-label={`${value || 0} stars`}>
      {'★'.repeat(rounded)}
      <span className="text-slate-300">{'★'.repeat(5 - rounded)}</span>
    </span>
  )
}

export function Modal({ open, title, children, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="card w-full max-w-md p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="btn-ghost px-2" type="button" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', tone = 'primary', busy, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{body}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" type="button" onClick={onClose}>Back</Button>
        <Button variant={tone} type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Working...' : confirmLabel}</Button>
      </div>
    </Modal>
  )
}

export function TrustLine({ person }) {
  if (!person) return null
  return (
    <p className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
      {person.isVerified && <Badge className="bg-indigo-50 text-indigo-700">Verified student</Badge>}
      <Stars value={person.ratingAverage} />
      <span>{person.ratingCount || 0} reviews</span>
      <span>{person.completedTransactions || 0} deals</span>
    </p>
  )
}

export function Alert({ children }) {
  return <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">{children}</div>
}

export function TextLink({ to, children }) {
  return <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to={to}>{children}</Link>
}
