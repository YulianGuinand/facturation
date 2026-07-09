"use client";

import { createContext, useContext, useCallback, useReducer, useRef, type ReactNode } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";

export type WizardStep = "company" | "client" | "info" | "lines" | "review" | "validate";

export type WizardTab = {
  key: WizardStep;
  label: string;
  icon: string;
};

export const WIZARD_TABS: WizardTab[] = [
  { key: "company", label: "Société", icon: "Building2" },
  { key: "client", label: "Client", icon: "User" },
  { key: "info", label: "Infos générales", icon: "FileText" },
  { key: "lines", label: "Produits & services", icon: "List" },
  { key: "review", label: "Récapitulatif", icon: "Eye" },
  { key: "validate", label: "Validation", icon: "CheckCircle" },
];

export type DocumentType = "invoice" | "quote" | "credit_note" | "purchase_order" | "deposit_invoice";

interface WizardState {
  documentId: Id<"documents"> | null;
  documentNumber: string | null;
  documentType: DocumentType;
  currentStep: WizardStep;
  companyId: Id<"companies"> | null;
  customerId: Id<"customers"> | null;
  validatedSteps: Set<WizardStep>;
  isDirty: boolean;
  lastSavedStep: WizardStep | null;
}

interface EditState {
  documentId: Id<"documents">;
  documentNumber: string;
  companyId: Id<"companies">;
  customerId?: Id<"customers"> | null;
  validatedSteps?: WizardStep[];
}

type WizardAction =
  | { type: "SET_DOCUMENT"; documentId: Id<"documents">; number: string }
  | { type: "INIT_EDIT"; payload: EditState }
  | { type: "SET_STEP"; step: WizardStep }
  | { type: "SET_COMPANY"; companyId: Id<"companies"> }
  | { type: "SET_CLIENT"; customerId: Id<"customers"> }
  | { type: "VALIDATE_STEP"; step: WizardStep }
  | { type: "INVALIDATE_STEP"; step: WizardStep }
  | { type: "SET_SAVED"; step: WizardStep }
  | { type: "SET_DIRTY" };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_DOCUMENT":
      return { ...state, documentId: action.documentId, documentNumber: action.number };
    case "INIT_EDIT": {
      const v = new Set<WizardStep>(action.payload.validatedSteps ?? []);
      return {
        ...state,
        documentId: action.payload.documentId,
        documentNumber: action.payload.documentNumber,
        companyId: action.payload.companyId,
        customerId: action.payload.customerId ?? null,
        currentStep: "client" as WizardStep,
        validatedSteps: v,
      };
    }
    case "SET_STEP":
      return { ...state, currentStep: action.step };
    case "SET_COMPANY":
      return { ...state, companyId: action.companyId };
    case "SET_CLIENT":
      return { ...state, customerId: action.customerId };
    case "VALIDATE_STEP": {
      const next = new Set(state.validatedSteps);
      next.add(action.step);
      return { ...state, validatedSteps: next };
    }
    case "INVALIDATE_STEP": {
      const next = new Set(state.validatedSteps);
      next.delete(action.step);
      return { ...state, validatedSteps: next };
    }
    case "SET_SAVED":
      return { ...state, lastSavedStep: action.step, isDirty: false };
    case "SET_DIRTY":
      return { ...state, isDirty: true };
    default:
      return state;
  }
}

const STEP_ORDER: WizardStep[] = ["company", "client", "info", "lines", "review", "validate"];

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: WizardStep) => void;
  isStepAccessible: (step: WizardStep) => boolean;
  currentStepIndex: number;
  totalSteps: number;
  progressPercent: number;
}

const WizardContext = createContext<WizardContextValue | null>(null);

const initialState: WizardState = {
  documentId: null,
  documentNumber: null,
  documentType: "invoice",
  currentStep: "company",
  companyId: null,
  customerId: null,
  validatedSteps: new Set(),
  isDirty: false,
  lastSavedStep: null,
};

export function WizardProvider({
  children,
  documentType = "invoice",
}: {
  children: ReactNode;
  documentType?: DocumentType;
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    documentType,
  });

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep);
  const totalSteps = STEP_ORDER.length;
  const progressPercent = Math.round((currentStepIndex / (totalSteps - 1)) * 100);
  const stepRef = useRef(state.currentStep);
  stepRef.current = state.currentStep;
  const validatedRef = useRef(state.validatedSteps);
  validatedRef.current = state.validatedSteps;

  const goToNextStep = useCallback(() => {
    const idx = STEP_ORDER.indexOf(stepRef.current);
    if (idx < STEP_ORDER.length - 1) {
      dispatch({ type: "SET_STEP", step: STEP_ORDER[idx + 1] });
    }
  }, []);

  const goToPreviousStep = useCallback(() => {
    const idx = STEP_ORDER.indexOf(stepRef.current);
    if (idx > 0) {
      dispatch({ type: "SET_STEP", step: STEP_ORDER[idx - 1] });
    }
  }, []);

  const goToStep = useCallback((step: WizardStep) => {
    const targetIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(stepRef.current);
    if (targetIndex <= currentIndex) {
      dispatch({ type: "SET_STEP", step });
      return;
    }
    const isAccessible = STEP_ORDER.slice(0, currentIndex + 1).every(
      (s) => validatedRef.current.has(s)
    );
    if (isAccessible) {
      dispatch({ type: "SET_STEP", step });
    }
  }, []);

  const isStepAccessible = useCallback((step: WizardStep): boolean => {
    const targetIndex = STEP_ORDER.indexOf(step);
    const currentIndex = STEP_ORDER.indexOf(stepRef.current);
    if (targetIndex <= currentIndex) return true;
    const previousSteps = STEP_ORDER.slice(0, targetIndex);
    return previousSteps.every((s) => validatedRef.current.has(s));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        state,
        dispatch,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        isStepAccessible,
        currentStepIndex,
        totalSteps,
        progressPercent,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
