import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sprout, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/dashboard/Sidebar'
import CropDetails from '../components/dashboard/CropDetails'
import { usePredictionStore } from '../context/predictionStore'
import { useAuth } from '../context/AuthContext'

function EmptyState() {
  const { user } = useAuth()
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="w-24 h-24 bg-gradient-to-br from-forest-100 to-forest-200 rounded-full flex items-center justify-center mb-6">
        <Sprout size={40} className="text-forest-600" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-2xl font-display font-bold text-forest-900 mb-2">Welcome, {user?.email?.split('@')[0]}!</h2>
        <p className="text-sage-500 max-w-sm mb-8 text-sm leading-relaxed">
          Start by creating your first crop prediction. Upload your soil data and let AI forecast your yield.
        </p>
        <Link to="/onboarding" className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> Create First Prediction
        </Link>
      </motion.div>
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="flex-1 p-6 lg:p-8 space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <div className="skeleton w-32 h-5 rounded" />
          <div className="skeleton w-20 h-3 rounded" />
        </div>
      </div>
      <div className="skeleton w-full h-24 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="skeleton w-full h-32 rounded-2xl" />
    </div>
  )
}

export default function DashboardPage() {
  const { fetchAll, loading, getSelected } = usePredictionStore()

  useEffect(() => { fetchAll() }, [])

  const selected = getSelected()

  return (
    <div className="flex min-h-screen bg-sage-50">
      <Sidebar />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 bg-sage-50/80 backdrop-blur-md border-b border-sage-100 px-6 lg:px-8 py-4 z-10">
          <div className="flex items-center justify-between lg:pl-0 pl-12">
            <div>
              <h1 className="text-lg font-display font-semibold text-forest-900">Farm Dashboard</h1>
              <p className="text-xs text-sage-400">AI-powered crop analytics</p>
            </div>
            <Link to="/onboarding"
              className="flex items-center gap-2 bg-forest-700 hover:bg-forest-800 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all shadow-sm">
              <Plus size={14} /> New Analysis
            </Link>
          </div>
        </div>

        {loading ? (
          <SkeletonLoader />
        ) : !selected ? (
          <EmptyState />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-2xl">
            <CropDetails prediction={selected} />
          </div>
        )}
      </main>
    </div>
  )
}
