import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'

export default function AdminPage() {
  const toast = useToast()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [reports, setReports] = useState([])
  const [disputes, setDisputes] = useState([])

  function load() {
    api('/api/admin/stats').then((res) => setStats(res.data))
    api('/api/admin/users?limit=20').then((res) => setUsers(res.data))
    api('/api/admin/reports').then((res) => setReports(res.data))
    api('/api/admin/disputes').then((res) => setDisputes(res.data))
  }
  useEffect(() => { load() }, [])

  async function run(path, method, body) {
    try { await api(path, { method, body }); toast('Updated'); load() }
    catch (err) { toast(err.message, 'error') }
  }

  const cards = stats ? [
    ['Students', stats.users],
    ['Verified', stats.verifiedUsers],
    ['Suspended', stats.suspendedUsers],
    ['Listings', stats.products],
    ['Live auctions', stats.activeAuctions],
    ['Completed orders', stats.completedTransactions],
    ['Service requests', stats.serviceRequests],
    ['Open reports', stats.openReports],
    ['Open disputes', stats.openDisputes],
    ['New users, 7 days', stats.recentUsers],
  ] : []

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Platform overview" subtitle="Moderate users, listings, reports, and disputes." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value]) => <article key={label} className="card p-4"><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-extrabold">{value}</p></article>)}
      </div>
      <section className="card overflow-auto">
        <h2 className="px-4 pt-4 font-bold">Users</h2>
        <table className="w-full text-left text-sm">
          <tbody>
            {users.map((person) => (
              <tr key={person._id} className="border-t border-slate-100">
                <td className="px-4 py-3">{person.name}<div className="text-xs text-slate-500">{person.email}</div></td>
                <td>{person.isVerified ? 'Verified' : 'Unverified'}</td>
                <td>{person.isSuspended ? 'Suspended' : person.role}</td>
                <td className="px-4 py-3 text-right">
                  {person.role !== 'admin' && (
                    <button className="btn-secondary" type="button" onClick={() => run(`/api/admin/users/${person._id}`, 'PATCH', { isSuspended: !person.isSuspended })}>
                      {person.isSuspended ? 'Reinstate' : 'Suspend'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Reports</h2>
        {reports.map((report) => (
          <article key={report._id} className="card flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div><p className="font-semibold">{report.reason}</p><p className="text-slate-500">{report.targetType} · {report.status} · {report.reporter?.name}</p></div>
            {report.status === 'open' && (
              <div className="flex gap-2">
                <button className="btn-secondary" type="button" onClick={() => run(`/api/admin/reports/${report._id}`, 'PATCH', { status: 'dismissed' })}>Dismiss</button>
                <button className="btn-danger" type="button" onClick={() => run(`/api/admin/reports/${report._id}`, 'PATCH', { status: 'action_taken' })}>Remove content</button>
              </div>
            )}
          </article>
        ))}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">Disputes</h2>
        {disputes.map((dispute) => (
          <article key={dispute._id} className="card space-y-2 p-4 text-sm">
            <p className="font-semibold">{dispute.reason} · {dispute.status}</p>
            <p>{dispute.details}</p>
            {dispute.status === 'open' && (
              <div className="flex gap-2">
                <button className="btn-primary" type="button" onClick={() => run(`/api/admin/disputes/${dispute._id}`, 'PATCH', { status: 'resolved', resolution: 'completed' })}>Resolve as completed</button>
                <button className="btn-secondary" type="button" onClick={() => run(`/api/admin/disputes/${dispute._id}`, 'PATCH', { status: 'resolved', resolution: 'cancelled' })}>Cancel transaction</button>
                <button className="btn-ghost" type="button" onClick={() => run(`/api/admin/disputes/${dispute._id}`, 'PATCH', { status: 'dismissed' })}>Dismiss</button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  )
}
