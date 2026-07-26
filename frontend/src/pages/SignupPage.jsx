import { SignUp } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { Leaf } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-forest-800 via-forest-700 to-sage-700 relative overflow-hidden flex-col justify-between p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-white font-display text-2xl font-semibold">CropCast</span>
          </div>
          <h1 className="text-white text-5xl font-display font-bold leading-tight mb-6">
            Join thousands of<br />smart farmers
          </h1>
          <p className="text-forest-200 text-lg leading-relaxed max-w-sm">
            Get instant AI insights for your fields, soil composition, weather risks, and yield forecasts.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[["Free", "Trial Available"], ["Instant", "AI Analysis"], ["24/7", "Monitoring"]].map(([v, l]) => (
            <div key={l} className="bg-white/10 rounded-2xl p-4 text-center">
              <div className="text-white text-2xl font-display font-bold">{v}</div>
              <div className="text-forest-200 text-xs mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel with Clerk SignUp */}
      <div className="flex-1 flex items-center justify-center p-6 bg-sage-50">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md flex flex-col items-center"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-forest-700 rounded-xl flex items-center justify-center">
              <Leaf className="text-white" size={20} />
            </div>
            <span className="text-forest-800 font-display text-2xl font-semibold">CropCast</span>
          </div>

          <SignUp
            path="/signup"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/onboarding"
          />
        </motion.div>
      </div>
    </div>
  );
}
