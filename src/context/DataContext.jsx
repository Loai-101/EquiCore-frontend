import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { initialStables } from '../services/mock/dummyData';

const DataContext = createContext(null);

function cloneStables() {
  return initialStables.map((s) => ({ ...s }));
}

export function DataProvider({ children }) {
  const [stables, setStables] = useState(cloneStables);

  const updateStable = useCallback((id, patch) => {
    setStables((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const addStableRegistration = useCallback((payload) => {
    const id = `stable-${Date.now()}`;
    const row = {
      id,
      stableName: payload.stableName,
      ownerName: payload.ownerName,
      email: payload.email,
      phone: payload.phone,
      country: payload.country,
      city: payload.city,
      stableType: payload.stableType,
      horseCount: Number(payload.horseCount) || 0,
      riderCount: Number(payload.riderCount) || 0,
      commercialReg: payload.commercialReg || null,
      notes: payload.notes || '',
      status: 'pending',
      submittedAt: new Date().toISOString().slice(0, 10),
      rejectionReason: null,
    };
    setStables((prev) => [...prev, row]);
    return row;
  }, []);

  const value = useMemo(
    () => ({
      stables,
      updateStable,
      addStableRegistration,
    }),
    [stables, updateStable, addStableRegistration]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
