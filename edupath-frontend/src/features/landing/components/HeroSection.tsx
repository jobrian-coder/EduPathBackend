import { Link } from 'react-router-dom'
import { Button } from '../../../components/common/Button'

export default function HeroSection() {
  return (
    <section className="text-center py-12 md:py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl border">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Discover Your Path in Kenya
        </h1>
        <p className="text-slate-600 text-lg">
          EduPath helps students explore careers, compare courses, and connect with professional societies.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/careers/compare"><Button size="lg">Explore Careers</Button></Link>
          <Link to="/societies"><Button variant="outline" size="lg">Browse Societies</Button></Link>
        </div>
        <div className="pt-4 text-slate-500">700,000+ students guided</div>
      </div>
    </section>
  )
}
