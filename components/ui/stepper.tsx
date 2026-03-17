"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
    activeStep: number
    stepLabel?: string
    steps: {
        title: string
        description?: string
    }[]
}

export function Stepper({ activeStep, stepLabel = "Step", steps, className, ...props }: StepperProps) {
    return (
        <div className={cn("w-full py-2 flex flex-col items-center", className)} {...props}>
            <div className="flex w-full max-w-xs md:max-w-sm items-center gap-2">
                {steps.map((_, index) => {
                    const isActiveOrCompleted = index <= activeStep
                    return (
                        <div key={index} className="flex-1">
                            <div
                                className={cn(
                                    "h-1.5 w-full rounded-full transition-colors duration-300",
                                    isActiveOrCompleted ? "bg-[#6DB0E2]" : "bg-muted"
                                )}
                            />
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 text-center animate-in fade-in zoom-in-95 duration-300">
                <h4 className="text-sm font-bold text-primary">
                    {stepLabel} {activeStep + 1}: {steps[activeStep]?.title}
                </h4>
                {steps[activeStep]?.description && (
                    <p className="text-xs text-muted-foreground/80 mt-1 font-medium">
                        {steps[activeStep]?.description}
                    </p>
                )}
            </div>
        </div>
    )
}
