import { create } from "zustand";
import { getAllPredictions, deletePrediction } from "../services/api";

export const usePredictionStore = create((set, get) => ({
  predictions: [],
  selectedId: null,
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    try {
      const res = await getAllPredictions();
      const data = res.data?.predictions || res.data || [];
      set((s) => {
        // Merge: keep local predictions that aren't in backend response yet
        const backendIds = new Set(data.map((p) => p._id));
        const localOnly = s.predictions.filter(
          (p) => p._id && !backendIds.has(p._id),
        );
        return { predictions: [...localOnly, ...data], loading: false };
      });
    } catch {
      set({ loading: false });
    }
  },

  addPrediction: (pred) =>
    set((s) => ({
      predictions: [pred, ...s.predictions],
      selectedId: pred._id || s.selectedId,
    })),

  selectPrediction: (id) => set({ selectedId: id }),

  removePrediction: async (id) => {
    await deletePrediction(id);
    set((s) => ({
      predictions: s.predictions.filter((p) => p._id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
  },

  getSelected: () => {
    const { predictions, selectedId } = get();
    if (selectedId) return predictions.find((p) => p._id === selectedId);
    return predictions[0] || null;
  },
}));
