import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Leaf, LogOut, Plus, Trash2, ChevronRight, Menu, X, Sprout, TrendingUp } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { usePredictionStore } from '../../context/predictionStore'

const CROP_EMOJIS = {
  rice: '🌾', wheat: '🌿', maize: '🌽', cotton: '🌱', sugarcane: '🎋',
  soybean: '🫛', groundnut: '🥜', barley: '🌾', sorghum: '🌿', millet: '🌾'
}

function SidebarContent({ onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { predictions, selectedId, selectPrediction, removePrediction, loading } = usePredictionStore()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    try {
      await removePrediction(id)
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sage-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center">
            <Leaf size={16} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-forest-800">CropCast</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-sage-400 hover:text-forest-700 lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-5 py-4 border-b border-sage-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-forest-400 to-forest-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-forest-800 truncate">{user?.email}</p>
            <p className="text-xs text-sage-400">Farmer Account</p>
          </div>
        </div>
      </div>

      {/* New prediction */}
      <div className="px-4 pt-4">
        <Link to="/onboarding"
          className="flex items-center gap-2 w-full bg-forest-700 hover:bg-forest-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm">
          <Plus size={16} /> New Prediction
        </Link>
      </div>

      {/* Crops list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
        <p className="text-xs font-semibold text-sage-400 uppercase tracking-widest mb-3 px-1">Your Crops</p>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-14 rounded-xl" />
            ))}
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-8">
            <Sprout size={28} className="text-sage-300 mx-auto mb-2" />
            <p className="text-sage-400 text-xs">No predictions yet</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {predictions.map((pred) => {
              const crop = pred.crop || pred.result?.meta?.crop || 'crop'
              const isSelected = selectedId === pred._id || (!selectedId && predictions[0]?._id === pred._id)
              const confidence = pred.result?.yield_prediction?.confidence || 'medium'
              return (
                <motion.div key={pred._id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  onClick={() => { selectPrediction(pred._id); onClose?.() }}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all
                    ${isSelected ? 'bg-forest-50 border border-forest-200' : 'hover:bg-sage-50 border border-transparent'}`}>
                  <div className="text-xl flex-shrink-0">{CROP_EMOJIS[crop] || '🌿'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-800 capitalize truncate">{crop}</p>
                    <p className="text-xs text-sage-400 capitalize">{confidence} confidence</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={e => handleDelete(e, pred._id)}
                      className="opacity-0 group-hover:opacity-100 text-sage-300 hover:text-red-500 transition-all p-1 rounded">
                      <Trash2 size={12} />
                    </button>
                    {isSelected && <ChevronRight size={14} className="text-forest-500" />}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-sage-100">
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full text-sage-500 hover:text-red-600 text-sm px-3 py-2 rounded-xl hover:bg-red-50 transition-all">
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white shadow-md border border-sage-100 rounded-xl p-2.5">
        <Menu size={20} className="text-forest-700" />
      </button>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-2xl">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-sage-100 h-screen sticky top-0 flex-shrink-0">
        <SidebarContent />
      </aside>
    </>
  )
}
