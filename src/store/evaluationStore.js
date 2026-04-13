import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useEvaluationStore = create(
  persist(
    (set) => ({
      activityLog: [{ time: '', activity: '', period: 'AM' }],
      
      setActivityLog: (log) => set({ activityLog: log }),
      
      addLogEntry: () => set((state) => ({
        activityLog: [...state.activityLog, { time: '', activity: '', period: 'AM' }]
      })),
      
      updateLogEntry: (index, field, value) => set((state) => {
        const newLog = [...state.activityLog];
        newLog[index] = { ...newLog[index], [field]: value };
        return { activityLog: newLog };
      }),
      
      removeLogEntry: (index) => set((state) => ({
        activityLog: state.activityLog.filter((_, i) => i !== index)
      })),

      clearLog: () => set({ activityLog: [{ time: '', activity: '', period: 'AM' }] }),
    }),
    {
      name: 'evaluation-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
