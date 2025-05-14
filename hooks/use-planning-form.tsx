import React, { createContext, useState, useContext, ReactNode } from 'react';

interface PlanningFormContextType {
  isOpen: boolean;
  openPlanningForm: () => void;
  closePlanningForm: () => void;
}

const PlanningFormContext = createContext<PlanningFormContextType | undefined>(undefined);

interface PlanningFormProviderProps {
  children: ReactNode;
}

export function PlanningFormProvider({ children }: PlanningFormProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openPlanningForm = () => setIsOpen(true);
  const closePlanningForm = () => setIsOpen(false);

  return (
    <PlanningFormContext.Provider value={{ isOpen, openPlanningForm, closePlanningForm }}>
      {children}
    </PlanningFormContext.Provider>
  );
}

export function usePlanningForm() {
  const context = useContext(PlanningFormContext);
  if (context === undefined) {
    throw new Error('usePlanningForm must be used within a PlanningFormProvider');
  }
  return context;
}