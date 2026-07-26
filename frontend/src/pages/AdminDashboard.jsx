import { useState, useEffect } from "react";
import { getAdminStats, getAdminPredictions } from "../services/api";
import Sidebar from "../components/dashboard/Sidebar";
import toast from "react-hot-toast";
import { ShieldCheck, Users, Database, Cpu, Activity, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await getAdminStats();
      setStats(statsRes.data?.metrics || statsRes.data);

      const predsRes = await getAdminPredictions();
      setPredictions(predsRes.data?.predictions || []);
    } catch (err) {
      toast.error("Failed to load admin metrics: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-sage-50/50 flex">
      <Sidebar activePage="admin" />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-forest-700 font-semibold text-sm mb-1">
                <ShieldCheck size={18} /> Admin Control Portal
              </div>
              <h1 className="text-3xl font-display font-bold text-forest-900">System Management</h1>
            </div>
            <button
              onClick={loadAdminData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-sage-200 text-forest-700 font-medium rounded-xl hover:bg-forest-50 transition-all shadow-sm"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-sage-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-forest-100 text-forest-700 rounded-xl flex items-center justify-center">
                <Database size={24} />
              </div>
              <div>
                <p className="text-xs text-sage-500 font-medium uppercase">Total Predictions</p>
                <p className="text-2xl font-bold text-forest-900">{stats?.total_predictions ?? 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sage-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-sage-100 text-forest-700 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <p className="text-xs text-sage-500 font-medium uppercase">Active Users</p>
                <p className="text-2xl font-bold text-forest-900">{stats?.active_users ?? 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sage-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <Cpu size={24} />
              </div>
              <div>
                <p className="text-xs text-sage-500 font-medium uppercase">ML Model Engine</p>
                <p className="text-base font-bold text-forest-900">{stats?.ml_model ?? "XGBoost"}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sage-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs text-sage-500 font-medium uppercase">Service Status</p>
                <p className="text-base font-bold text-emerald-600 capitalize">{stats?.status ?? "Healthy"}</p>
              </div>
            </div>
          </div>

          {/* Predictions Table */}
          <div className="bg-white rounded-2xl border border-sage-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-forest-900 mb-4">Recent Predictions Across System</h2>

            {loading ? (
              <p className="text-sage-500 py-8 text-center">Loading system logs...</p>
            ) : predictions.length === 0 ? (
              <p className="text-sage-500 py-8 text-center">No prediction records found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-sage-700">
                  <thead className="bg-sage-50 text-xs font-semibold uppercase text-forest-800 border-b border-sage-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">User ID</th>
                      <th className="px-4 py-3">Crop</th>
                      <th className="px-4 py-3">Predicted Yield</th>
                      <th className="px-4 py-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-100">
                    {predictions.map((p) => (
                      <tr key={p.id || p._id} className="hover:bg-sage-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs">{new Date(p.created_at || Date.now()).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-mono text-xs text-forest-700">{p.user_id}</td>
                        <td className="px-4 py-3 capitalize font-medium">{p.crop}</td>
                        <td className="px-4 py-3 font-semibold text-forest-900">
                          {p.yield_prediction?.value} {p.yield_prediction?.unit || "tons/ha"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-lg font-medium bg-emerald-100 text-emerald-800 capitalize">
                            {p.yield_prediction?.confidence || "Medium"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
