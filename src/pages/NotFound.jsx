import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
export default () => (
  <div className="grid min-h-screen place-items-center p-6 text-center">
    <div>
      <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-mint" />
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="muted mt-2">The page you're looking for doesn't exist in this demo.</p>
      <Link to="/" className="btn-m mt-5 inline-flex">
        Back to PathGuard
      </Link>
    </div>
  </div>
)
