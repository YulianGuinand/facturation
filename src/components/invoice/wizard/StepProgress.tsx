"use client";

import { useWizard, WIZARD_TABS } from "./wizard-context";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

export function StepProgress() {
  const { state, goToStep, isStepAccessible, progressPercent } = useWizard();
  const currentStep = state.currentStep;

  return (
    <nav aria-label="Progression" className="mb-8">
      <div className="hidden sm:flex items-center justify-between">
        <ol className="flex items-center w-full">
          {WIZARD_TABS.map((tab, index) => {
            const Icon = (LucideIcons as any)[tab.icon];
            const isActive = currentStep === tab.key;
            const isPast = (STEP_INDEX[tab.key] ?? 0) < (STEP_INDEX[currentStep] ?? 0);
            const accessible = isPast || isStepAccessible(tab.key);

            return (
              <li
                key={tab.key}
                className={cn(
                  "flex items-center",
                  index < WIZARD_TABS.length - 1 && "flex-1"
                )}
              >
                <button
                  type="button"
                  onClick={() => accessible && goToStep(tab.key)}
                  disabled={!accessible}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive && "bg-primary/10 text-primary shadow-sm",
                    isPast && "text-muted-foreground hover:text-foreground cursor-pointer",
                    !isPast && !isActive && "text-muted-foreground/50",
                    !accessible && "cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                      isActive && "bg-primary text-primary-foreground",
                      isPast && "bg-primary/20 text-primary",
                      !isPast && !isActive && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isPast ? (
                      <LucideIcons.Check className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="hidden lg:inline">{tab.label}</span>
                </button>
                {index < WIZARD_TABS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-px mx-2",
                      (STEP_INDEX[tab.key] ?? 0) < (STEP_INDEX[currentStep] ?? 0)
                        ? "bg-primary/40"
                        : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Étape {(STEP_INDEX[currentStep] ?? 0) + 1} sur {WIZARD_TABS.length}
          </span>
          <span className="font-medium text-foreground">
            {WIZARD_TABS.find((t) => t.key === currentStep)?.label}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </nav>
  );
}

const STEP_INDEX: Record<string, number> = Object.fromEntries(
  WIZARD_TABS.map((t, i) => [t.key, i])
);
