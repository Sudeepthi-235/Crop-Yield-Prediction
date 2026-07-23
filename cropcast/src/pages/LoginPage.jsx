import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Leaf, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { loginUser } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser(form)
      setUser(res.data?.user || res.data)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-sage-700 relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-2 h-2 bg-white rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() }} />
          ))}
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-white font-display text-2xl font-semibold">CropCast</span>
          </div>
          <h1 className="text-white text-5xl font-display font-bold leading-tight mb-6">
            Grow smarter<br />with AI forecasts
          </h1>
          <p className="text-forest-200 text-lg leading-relaxed max-w-sm">
            Precision agriculture powered by machine learning. Predict yields, manage risks, and optimise your harvest.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[['98%', 'Model Accuracy'], ['2.4x', 'Avg Yield Gain'], ['12K+', 'Farmers']].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-white text-2xl font-display font-bold">{v}</div>
              <div className="text-forest-200 text-xs mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-sage-50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-forest-800 font-display text-2xl font-semibold">CropCast</span>
          </div>

          <h2 className="text-3xl font-display font-bold text-forest-900 mb-1">Welcome back</h2>
          <p className="text-sage-500 mb-8 text-sm">Sign in to your farm dashboard</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" />
                <input name="email" type="email" value={form.email} onChange={handle}
                  placeholder="farmer@example.com"
                  className="input-field pl-11" required />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400" />
                <input name="password" type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={handle} placeholder="••••••••"
                  className="input-field pl-11 pr-11" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sage-400 hover:text-forest-600 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-sage-500 mt-8">
            New to CropCast?{' '}
            <Link to="/signup" className="text-forest-700 font-semibold hover:text-forest-800 transition-colors">
              Create account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
