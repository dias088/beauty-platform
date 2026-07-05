'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  currentStep: number
  totalSteps: number
}

const STEPS = ['Основное', 'Адрес', 'Фото', 'Услуги']

export function Stepper({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex items-center justify-between">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                  isDone && 'bg-green-500 text-white',
                  isActive && 'bg-primary text-white ring-2 ring-primary ring-offset-2',
                  !isDone && !isActive && 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="w-5 h-5" /> : step}
              </div>
              <p className="text-xs md:text-sm font-medium mt-2 text-center">{STEPS[i]}</p>
            </div>

            {step < totalSteps && (
              <div
                className={cn(
                  'h-1 flex-1 mx-2 transition-all',
                  isDone ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
