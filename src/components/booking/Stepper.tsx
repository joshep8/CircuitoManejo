import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: { id: number; label: string }[];
  current: number;
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex w-full items-center gap-1 sm:gap-2">
      {steps.map((step, idx) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <li
            key={step.id}
            className={cn(
              "flex flex-1 items-center gap-2",
              idx < steps.length - 1 && "after:h-[2px] after:flex-1 after:rounded-full after:bg-border",
              done && "after:bg-primary",
            )}
          >
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-smooth",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary bg-background text-primary shadow-elegant",
                  !done && !active && "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "hidden text-center text-[11px] font-medium sm:block",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
