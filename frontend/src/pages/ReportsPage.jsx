import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { PageHeader } from '../components/ui'
import { useToast } from '../context/ToastContext'

export default function ReportsPage() {
  const toast = useToast()
  const [params] = useSearchParams()
  const [reports, setReports] = useState([])
  const [disputes, setDisputes] = useState([])
  const [rating, setRating] = useState(5)
  const [feedback, setFeedback] = useState('')

  function load() {
    api('/api/reports').then((res) => setReports(res.data))
    api('/api/disputes').then((res) => setDisputes(res.data))
  }
  useEffect(() => { load() }, [])

  async function review(event) {
    event.preventDefault()
    try {
      await api('/api/reviews', {
        method: 'POST',
        body: {
          transactionType: params.get('type'),
          transactionId: params.get('review'),
          revieweeId: params.get('person'),
          rating: Number(rating),
          feedback,
        },
      })
      toast('Review published')
    } catch (err) { toast(err.message, 'error') }
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Reports and disputes" subtitle="Track what you reported and any disputes on your transactions." />
      {params.get('review') && (
        <form className="card space-y-3 p-4" onSubmit={review}>
          <h2 className="font-bold">Leave a review</h2>
          <select className="field" value={rating} onChange={(e) => setRating(e.target.value)}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
          <textarea className="field min-h-24" placeholder="Optional feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <button className="btn-primary" type="submit">Publish review</button>
        </form>
      )}
      <section className="space-y-2">
        <h2 className="text-xl font-bold">My reports</h2>
        {reports.map((report) => <article key={report._id} className="card p-4 text-sm"><p className="font-semibold">{report.reason}</p><p className="text-slate-500">{report.status} · {report.targetType}</p></article>)}
        {reports.length === 0 && <p className="text-sm text-slate-500">You have not filed a report.</p>}
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-bold">My disputes</h2>
        {disputes.map((dispute) => <article key={dispute._id} className="card p-4 text-sm"><p className="font-semibold">{dispute.reason}</p><p>{dispute.details}</p><p className="text-slate-500">{dispute.status}</p></article>)}
        {disputes.length === 0 && <p className="text-sm text-slate-500">No disputes.</p>}
      </section>
    </div>
  )
}
