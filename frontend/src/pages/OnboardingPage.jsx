import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Leaf,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Calendar,
  Layers,
  Upload,
  CheckCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { runMLPrediction, savePrediction } from "../services/api";
import { usePredictionStore } from "../context/predictionStore";
import { extractSoilFromPDF } from "../services/pdfExtractor";

const STEPS = ["Farm Details", "Location", "Soil Report", "AI Analysis"];

const CROP_OPTIONS = [
  "rice",
  "wheat",
  "maize",
  "cotton",
  "sugarcane",
  "soybean",
  "groundnut",
  "barley",
  "sorghum",
  "millet",
];

const SOIL_TYPES = [
  "loamy",
  "sandy",
  "clay",
  "silt",
  "sandy loam",
  "clay loam",
  "peaty",
  "chalky",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const addPrediction = usePredictionStore((s) => s.addPrediction);

  const [step, setStep] = useState(0);
  const [farmData, setFarmData] = useState({
    crop: "",
    land_area: "",
    sowing_date: "",
  });
  const [location, setLocation] = useState({ lat: "", lon: "" });
  const [soil, setSoil] = useState({
    type: "",
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organic_carbon: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractedFields, setExtractedFields] = useState(null);
  const [analysing, setAnalysing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(6),
          lon: pos.coords.longitude.toFixed(6),
        });
        toast.success("Location detected!");
      },
      () => toast.error("Could not detect location"),
    );
  };

  const handlePDF = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }
    setPdfFile(file);
    setExtracting(true);
    try {
      const data = await extractSoilFromPDF(file);
      if (data) {
        setSoil((prev) => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(data).filter(([, v]) => v !== "" && v !== undefined),
          ),
        }));
        setExtractedFields(data);
        toast.success("Soil data extracted successfully!");
      } else {
        toast("Could not auto-extract. Fill fields manually.", { icon: "ℹ️" });
      }
    } catch {
      toast.error("Extraction failed. Fill manually.");
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePDF(file);
  };

  const runAnalysis = async () => {
    setAnalysing(true);
    const payload = {
      crop: farmData.crop,
      location: {
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
      },
      sowing_date: farmData.sowing_date,
      land_area: parseFloat(farmData.land_area),
      soil: {
        type: soil.type,
        ph: parseFloat(soil.ph) || 6.5,
        organic_carbon: parseFloat(soil.organic_carbon) || 0.5,
        nitrogen: parseFloat(soil.nitrogen) || 2,
        phosphorus: parseFloat(soil.phosphorus) || 2,
        potassium: parseFloat(soil.potassium) || 2,
      },
    };
    try {
      const res = await runMLPrediction(payload);
      const predData = res.data;
      const savePayload = {
        crop: payload.crop,
        location: payload.location,
        yield_prediction: predData.yield_prediction,
        current_stage: predData.current_stage,
        risks: predData.risks?.map((r) =>
          typeof r === "string" ? r : `${r.type}: ${r.message}`,
        ),
        stage_insights: predData.stage_insights,
        suggestions: predData.suggestions,
        meta: predData.meta,
      };
      const saveRes = await savePrediction(savePayload);
      const saved = saveRes.data?.prediction || saveRes.data;
      addPrediction(saved);
      setPrediction(saved);
      toast.success("Analysis complete!");
    } catch (err) {
      console.error("Analysis error:", err.response?.data || err);
      toast.error(
        "Analysis failed: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setAnalysing(false);
    }
  };

  const stepVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  const canNext = () => {
    if (step === 0)
      return farmData.crop && farmData.land_area && farmData.sowing_date;
    if (step === 1) return location.lat && location.lon;
    if (step === 2) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-forest-50 via-sage-50 to-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 bg-forest-700 rounded-xl flex items-center justify-center">
            <Leaf size={18} className="text-white" />
          </div>
          <span className="font-display text-xl font-semibold text-forest-800">
            CropCast Setup
          </span>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${i < step ? "bg-forest-600 text-white" : i === step ? "bg-forest-700 text-white ring-4 ring-forest-200" : "bg-sage-100 text-sage-400"}`}
                >
                  {i < step ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span
                  className={`text-[10px] font-medium hidden sm:block ${i === step ? "text-forest-700" : "text-sage-400"}`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 rounded transition-all duration-500 ${i < step ? "bg-forest-500" : "bg-sage-200"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-sage-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              {/* STEP 0 - Farm Details */}
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-forest-900">
                      Farm Details
                    </h2>
                    <p className="text-sage-500 text-sm mt-1">
                      Tell us about your crop and farm
                    </p>
                  </div>
                  <div>
                    <label className="label">Crop Type</label>
                    <select
                      value={farmData.crop}
                      onChange={(e) =>
                        setFarmData({ ...farmData, crop: e.target.value })
                      }
                      className="input-field"
                    >
                      <option value="">Select a crop</option>
                      {CROP_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Land Area (hectares)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      placeholder="e.g. 2.5"
                      value={farmData.land_area}
                      onChange={(e) =>
                        setFarmData({ ...farmData, land_area: e.target.value })
                      }
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Sowing Date</label>
                    <div className="relative">
                      <Calendar
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-sage-400"
                      />
                      <input
                        type="date"
                        value={farmData.sowing_date}
                        onChange={(e) =>
                          setFarmData({
                            ...farmData,
                            sowing_date: e.target.value,
                          })
                        }
                        className="input-field pl-11"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 1 - Location */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-forest-900">
                      Farm Location
                    </h2>
                    <p className="text-sage-500 text-sm mt-1">
                      Enter coordinates or detect automatically
                    </p>
                  </div>
                  <button
                    onClick={detectLocation}
                    className="w-full flex items-center justify-center gap-2 bg-forest-50 hover:bg-forest-100 text-forest-700 font-medium py-3 rounded-xl border border-forest-200 transition-all"
                  >
                    <Navigation size={16} /> Detect My Location
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-sage-200" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-3 text-sage-400 text-xs">
                        or enter manually
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Latitude</label>
                      <div className="relative">
                        <MapPin
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400"
                        />
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="17.3850"
                          value={location.lat}
                          onChange={(e) =>
                            setLocation({ ...location, lat: e.target.value })
                          }
                          className="input-field pl-9 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Longitude</label>
                      <div className="relative">
                        <MapPin
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400"
                        />
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="78.4867"
                          value={location.lon}
                          onChange={(e) =>
                            setLocation({ ...location, lon: e.target.value })
                          }
                          className="input-field pl-9 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  {location.lat && location.lon && (
                    <div className="bg-forest-50 rounded-xl p-3 flex items-center gap-2 text-forest-700 text-sm">
                      <CheckCircle size={16} /> Location set:{" "}
                      {parseFloat(location.lat).toFixed(4)},{" "}
                      {parseFloat(location.lon).toFixed(4)}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2 - Soil Report */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-forest-900">
                      Soil Report
                    </h2>
                    <p className="text-sage-500 text-sm mt-1">
                      Upload your soil test report PDF
                    </p>
                  </div>

                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                      ${dragOver ? "border-forest-500 bg-forest-50" : "border-sage-300 hover:border-forest-400 hover:bg-forest-50/50"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("pdf-input").click()}
                  >
                    <input
                      id="pdf-input"
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => handlePDF(e.target.files[0])}
                    />
                    {extracting ? (
                      <div className="flex flex-col items-center gap-3 text-forest-600">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-sm font-medium">
                          Extracting soil data…
                        </span>
                      </div>
                    ) : pdfFile ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle size={32} className="text-forest-600" />
                        <span className="text-forest-700 font-medium text-sm">
                          {pdfFile.name}
                        </span>
                        <span className="text-sage-400 text-xs">
                          Click to replace
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-sage-100 rounded-2xl flex items-center justify-center">
                          <Upload size={22} className="text-sage-400" />
                        </div>
                        <div>
                          <p className="text-forest-700 font-medium text-sm">
                            Drop PDF here or click to browse
                          </p>
                          <p className="text-sage-400 text-xs mt-1">
                            Soil test report PDF
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Soil Type</label>
                      <select
                        value={soil.type}
                        onChange={(e) =>
                          setSoil({ ...soil, type: e.target.value })
                        }
                        className="input-field"
                      >
                        <option value="">Select type</option>
                        {SOIL_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">pH Level</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="14"
                        placeholder="6.5"
                        value={soil.ph}
                        onChange={(e) =>
                          setSoil({ ...soil, ph: e.target.value })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Nitrogen (kg/ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        value={soil.nitrogen}
                        onChange={(e) =>
                          setSoil({ ...soil, nitrogen: e.target.value })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Phosphorus (kg/ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        value={soil.phosphorus}
                        onChange={(e) =>
                          setSoil({ ...soil, phosphorus: e.target.value })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Potassium (kg/ha)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2"
                        value={soil.potassium}
                        onChange={(e) =>
                          setSoil({ ...soil, potassium: e.target.value })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="label">Organic Carbon (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.6"
                        value={soil.organic_carbon}
                        onChange={(e) =>
                          setSoil({ ...soil, organic_carbon: e.target.value })
                        }
                        className="input-field"
                      />
                    </div>
                  </div>

                  {extractedFields && (
                    <div className="bg-forest-50 rounded-xl p-3 text-xs text-forest-700 border border-forest-100">
                      <span className="font-semibold">
                        ✓ Auto-extracted from PDF.
                      </span>{" "}
                      Review and adjust values above if needed.
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3 - Analysis */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-forest-900">
                      AI Analysis
                    </h2>
                    <p className="text-sage-500 text-sm mt-1">
                      Running your crop yield prediction
                    </p>
                  </div>

                  {!analysing && !prediction && (
                    <div className="space-y-4">
                      <div className="bg-sage-50 rounded-2xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-sage-500">Crop</span>
                          <span className="font-medium text-forest-800 capitalize">
                            {farmData.crop}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sage-500">Area</span>
                          <span className="font-medium text-forest-800">
                            {farmData.land_area} ha
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sage-500">Location</span>
                          <span className="font-medium text-forest-800">
                            {parseFloat(location.lat).toFixed(3)},{" "}
                            {parseFloat(location.lon).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sage-500">Soil</span>
                          <span className="font-medium text-forest-800 capitalize">
                            {soil.type || "Unspecified"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={runAnalysis}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        <Layers size={16} /> Run AI Prediction
                      </button>
                    </div>
                  )}

                  {analysing && (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 border-4 border-forest-200 border-t-forest-600 rounded-full animate-spin mx-auto" />
                      <div>
                        <p className="text-forest-800 font-medium">
                          Analysing crop data…
                        </p>
                        <p className="text-sage-400 text-sm mt-1">
                          Processing soil, weather, and location signals
                        </p>
                      </div>
                      <div className="space-y-2 text-left mt-4">
                        {[
                          "Fetching weather data",
                          "Processing soil profile",
                          "Running yield model",
                          "Generating insights",
                        ].map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 text-sm text-sage-500"
                          >
                            <div
                              className="w-2 h-2 rounded-full bg-forest-400 animate-pulse"
                              style={{ animationDelay: `${i * 0.3}s` }}
                            />
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {prediction && !analysing && (
                    <div className="text-center py-4 space-y-4">
                      <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-forest-600" />
                      </div>
                      <div>
                        <p className="text-forest-800 font-bold text-lg">
                          Prediction Complete!
                        </p>
                        <p className="text-sage-500 text-sm mt-1">
                          Your crop analysis is ready
                        </p>
                      </div>
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                      >
                        View Dashboard <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer nav */}
          {step < 3 && (
            <div className="px-8 pb-8 flex gap-3">
              {step > 0 && (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              )}
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canNext()}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === 2 ? "Continue to Analysis" : "Next Step"}{" "}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
