export function money(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function when(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function countdown(end, offset = 0) {
  const ms = new Date(end).getTime() - (Date.now() + offset)
  if (ms <= 0) return 'Ended'
  const total = Math.floor(ms / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
}

export const conditionTone = {
  New: 'bg-emerald-50 text-emerald-700',
  'Like New': 'bg-sky-50 text-sky-700',
  Good: 'bg-indigo-50 text-indigo-700',
  Fair: 'bg-amber-50 text-amber-800',
}

export function statusTone(status) {
  if (['completed', 'sold', 'active', 'accepted'].includes(status)) return 'bg-emerald-50 text-emerald-700'
  if (['pending', 'scheduled', 'reserved'].includes(status)) return 'bg-amber-50 text-amber-800'
  if (['cancelled', 'rejected', 'unsold', 'removed', 'disputed'].includes(status)) return 'bg-rose-50 text-rose-700'
  return 'bg-slate-100 text-slate-700'
}
