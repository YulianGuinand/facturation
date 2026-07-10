"use client";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import { useWizard, WIZARD_TABS } from "./wizard-context";

export function StepProgress() {
  const { state, goToStep, currentStepIndex, progressPercent } = useWizard();

  return (
    <nav aria-label="Progression" className="mb-10">
      <div className="hidden sm:block">
        <ol className="flex items-center">
          {WIZARD_TABS.map((tab, index) => {
            const Icon = (LucideIcons as any)[tab.icon];
            const isCompleted = state.validatedSteps.has(tab.key);
            const isActive = state.currentStep === tab.key;
            const isFuture = !isCompleted && !isActive;
            const isLast = index === WIZARD_TABS.length - 1;

            return (
              <li
                key={tab.key}
                className={cn("flex items-center", !isLast && "flex-1")}
              >
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => isCompleted && goToStep(tab.key)}
                    disabled={!isCompleted}
                    className={cn(
                      "flex items-center justify-center size-10 rounded-full transition-all duration-300",
                      isCompleted &&
                        "bg-primary shadow-sm shadow-primary/30 cursor-pointer",
                      isActive &&
                        "bg-background border-2 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/20",
                      isFuture && "bg-muted/50 border border-border/60",
                      !isCompleted && "cursor-default",
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? (
                      <LucideIcons.Check className="size-5 text-primary-foreground stroke-[2.5]" />
                    ) : (
                      <Icon
                        className={cn(
                          "size-4.5 transition-colors",
                          isActive && "text-primary",
                          isFuture && "text-muted-foreground/40",
                        )}
                      />
                    )}
                  </button>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium transition-colors whitespace-nowrap",
                      isCompleted && "text-primary",
                      isActive && "text-primary font-semibold",
                      isFuture && "text-muted-foreground/40",
                    )}
                  >
                    {tab.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-0.75 mx-3 rounded-full transition-all duration-300",
                      isCompleted ? "bg-primary" : "bg-border/50",
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
            Étape {currentStepIndex + 1} sur {WIZARD_TABS.length}
          </span>
          <span className="font-medium text-foreground">
            {WIZARD_TABS.find((t) => t.key === state.currentStep)?.label}
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
