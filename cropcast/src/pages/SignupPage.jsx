import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Leaf,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sprout,
} from "lucide-react";
import { registerUser } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await registerUser({
        email: form.email,
        password: form.password,
      });
      setUser(res.data?.user || res.data);
      toast.success("Account created! Let's set up your farm.");
      navigate("/onboarding");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-earth-700 via-forest-700 to-forest-800 relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-white font-display text-2xl font-semibold">
              CropCast
            </span>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8">
            <Sprout size={32} className="text-white" />
          </div>
          <h1 className="text-white text-5xl font-display font-bold leading-tight mb-6">
            Start your AI
            <br />
            farming journey
          </h1>
          <p className="text-forest-200 text-lg leading-relaxed max-w-sm">
            Join thousands of farmers who trust CropCast for data-driven yield
            predictions and intelligent crop management.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {[
            "Upload your soil report",
            "Get AI-powered predictions",
            "Track seasonal progress",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3 text-forest-100">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-sage-50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-forest-800 font-display text-2xl font-semibold">
              CropCast
            </span>
          </div>

          <h2 className="text-3xl font-display font-bold text-forest-900 mb-1">
            Create account
          </h2>
          <p className="text-sage-500 mb-8 text-sm">
            Begin your precision farming experience
          </p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <Leaf
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                />
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handle}
                  placeholder="John Doe"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="farmer@example.com"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                />
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handle}
                  placeholder="Min. 6 characters"
                  className="input-field pl-11 pr-11"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sage-400 hover:text-forest-600 transition-colors"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm password</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                />
                <input
                  name="confirm"
                  type={showPw ? "text" : "password"}
                  value={form.confirm}
                  onChange={handle}
                  placeholder="Re-enter password"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Create Account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-sage-500 mt-8">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-forest-700 font-semibold hover:text-forest-800 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
