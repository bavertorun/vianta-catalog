'use client'

import { Minus, Plus } from 'lucide-react'

interface QuantityControlProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

export function QuantityControl({
  value,
  onChange,
  min = 1,
  max = 20,
  label = 'Seri adedi',
}: QuantityControlProps) {
  return (
    <div className="quantity-control" aria-label={label}>
      <button
        type="button"
        aria-label="Seri azalt"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={13} />
      </button>
      <span>{value}</span>
      <button
        type="button"
        aria-label="Seri artır"
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={13} />
      </button>
    </div>
  )
}
