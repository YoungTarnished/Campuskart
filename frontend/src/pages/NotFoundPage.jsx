import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="card px-6 py-16 text-center">
      <h1 className="text-3xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-slate-600">That CampusKart page does not exist.</p>
      <Link className="btn-primary mt-6" to="/">Back home</Link>
    </div>
  )
}
