import { motion } from "framer-motion";
import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Layers,
  MapPin,
  BarChart2,
  Droplets,
  Calendar,
  Award,
  ChevronRight,
  Leaf,
} from "lucide-react";

const CONFIDENCE_COLORS = {
  high: "bg-forest-100 text-forest-700 border-forest-200",
  medium: "bg-earth-100 text-earth-700 border-earth-200",
  low: "bg-red-50 text-red-700 border-red-200",
};

function ProgressBar({ value, max = 100, color = "bg-forest-500" }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-sage-100 rounded-full h-2.5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${accent || "bg-white border-sage-100"}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-forest-100 rounded-lg flex items-center justify-center">
          <Icon size={15} className="text-forest-600" />
        </div>
        <span className="text-xs font-semibold text-sage-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-display font-bold text-forest-900">{value}</p>
      {sub && <p className="text-xs text-sage-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function CropDetails({ prediction }) {
  if (!prediction) return null;

  const result = prediction;
  const {
    yield_prediction = {},
    current_stage = {},
    risks = [],
    stage_insights = [],
    suggestions = [],
    meta = {},
  } = result;

  const crop = prediction.crop || meta.crop || "Crop";
  const confidence = yield_prediction.confidence || "medium";
  const totalYield =
    yield_prediction.total_yield ?? yield_prediction.value ?? 0;
  const unit = yield_prediction.unit || "tons/hectare";
  const landArea = yield_prediction.land_area_ha || prediction.land_area || 1;
  const stageProgress = current_stage.progress_percent || 0;
  const stageName = current_stage.name || "Unknown";
  const daysRemaining = current_stage.days_remaining ?? "—";

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-forest-400 to-forest-700 rounded-2xl flex items-center justify-center text-2xl">
            🌾
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-forest-900 capitalize">
              {crop}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {meta.location && (
                <span className="flex items-center gap-1 text-xs text-sage-400">
                  <MapPin size={11} /> {meta.location.lat?.toFixed(3)},{" "}
                  {meta.location.lon?.toFixed(3)}
                </span>
              )}
              {meta.days_since_sowing !== undefined && (
                <span className="flex items-center gap-1 text-xs text-sage-400">
                  <Calendar size={11} /> Day {meta.days_since_sowing}
                </span>
              )}
            </div>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${CONFIDENCE_COLORS[confidence] || CONFIDENCE_COLORS.medium}`}
        >
          {confidence} confidence
        </span>
      </div>

      {/* SUGGESTIONS - shown first */}
      {suggestions.length > 0 && (
        <motion.div
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="bg-gradient-to-r from-forest-700 to-forest-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={16} className="text-forest-200" />
            <span className="text-sm font-semibold text-forest-100 uppercase tracking-wide">
              AI Recommendations
            </span>
          </div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 text-sm text-forest-100"
              >
                <ChevronRight
                  size={14}
                  className="mt-0.5 text-forest-300 flex-shrink-0"
                />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3"
      >
        <StatCard
          icon={BarChart2}
          label="Total Yield"
          value={`${totalYield} t`}
          sub={unit}
        />
        <StatCard
          icon={Layers}
          label="Land Area"
          value={`${landArea} ha`}
          sub="hectares"
        />
        <StatCard
          icon={Award}
          label="Stage"
          value={stageName}
          sub={`${daysRemaining} days left`}
        />
        <StatCard
          icon={TrendingUp}
          label="Progress"
          value={`${stageProgress}%`}
          sub="stage complete"
        />
      </motion.div>

      {/* Stage progress */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-forest-800">Growth Stage</h3>
            <p className="text-xs text-sage-400 mt-0.5 capitalize">
              {stageName}
            </p>
          </div>
          <span className="text-xl font-display font-bold text-forest-700">
            {stageProgress}%
          </span>
        </div>
        <ProgressBar value={stageProgress} />
        <div className="flex justify-between text-xs text-sage-400 mt-2">
          <span>Sowing</span>
          <span>Harvest</span>
        </div>
      </motion.div>

      {/* Stage insights */}
      {stage_insights.length > 0 && (
        <motion.div
          custom={3}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Droplets size={16} className="text-forest-600" />
            <h3 className="font-semibold text-forest-800">Stage Insights</h3>
          </div>
          <div className="space-y-3">
            {stage_insights.map((insight, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-sage-50 rounded-xl"
              >
                <div className="w-2 h-2 rounded-full bg-forest-400 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-forest-700">
                    {insight.stage}
                  </p>
                  <p className="text-xs text-sage-500">{insight.status}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Risks */}
      {risks.length > 0 && (
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="card border-red-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-red-500" />
            <h3 className="font-semibold text-forest-800">Risk Alerts</h3>
          </div>
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-red-50 rounded-xl text-sm text-red-700"
              >
                <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                <span>
                  {typeof risk === "string"
                    ? risk
                    : risk.description || JSON.stringify(risk)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty risks */}
      {risks.length === 0 && (
        <motion.div
          custom={4}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="card flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center">
            <Leaf size={18} className="text-forest-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-forest-800">
              No active risks
            </p>
            <p className="text-xs text-sage-400">
              Crop is progressing without issues
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
