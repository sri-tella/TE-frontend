import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useEvaluationStore = create(
  persist(
    (set) => ({
      activityLog: [{ time: '', activity: '', period: 'AM' }],
      logVersion: 0,
      isLogCollapsed: false,
      
      setActivityLog: (log) => set({ activityLog: log, logVersion: Date.now() }),
      setLogCollapsed: (collapsed) => set({ isLogCollapsed: collapsed }),
      
      addLogEntry: () => set((state) => ({
        activityLog: [...state.activityLog, { time: '', activity: '', period: 'AM' }],
        logVersion: state.logVersion + 1
      })),
      
      updateLogEntry: (index, field, value) => set((state) => {
        const newLog = [...state.activityLog];
        newLog[index] = { ...newLog[index], [field]: value };
        return { activityLog: newLog, logVersion: state.logVersion + 1 };
      }),
      
      removeLogEntry: (index) => set((state) => ({
        activityLog: state.activityLog.filter((_, i) => i !== index),
        logVersion: state.logVersion + 1
      })),

      clearLog: () => set({ 
        activityLog: [{ time: '', activity: '', period: 'AM' }],
        logVersion: 0
      }),
    }),
    {
      name: 'evaluation-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activityLog: state.activityLog,
        logVersion: state.logVersion,
      }),
    }
  )
);
