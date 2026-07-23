import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Leaf, Home } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-sage-50 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md">
        <div className="text-8xl font-display font-bold text-forest-200 mb-4">404</div>
        <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Leaf size={28} className="text-forest-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-forest-900 mb-2">Field Not Found</h1>
        <p className="text-sage-500 mb-8 text-sm">This page doesn't exist. Let's get you back to your farm.</p>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <Home size={16} /> Back to Dashboard
        </Link>
      </motion.div>
    </div>
  )
}
