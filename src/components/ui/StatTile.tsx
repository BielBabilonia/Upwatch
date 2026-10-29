import type { ReactNode } from 'react'
import { Card } from './Card'
import { Skeleton } from './Skeleton'

interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  /** Small status mark next to the label (dot, icon). */
  marker?: ReactNode
}

export function StatTile({ label, value, hint, marker }: StatTileProps) {
  return (
    <Card className="p-4 sm:p-5">
      <dl>
        <dt className="flex items-center gap-2 text-sm text-muted">
          {marker}
          {label}
        </dt>
        <dd className="mt-2 text-2xl font-semibold tracking-tight text-fg sm:text-3xl">{value}</dd>
        {hint && <dd className="mt-1 text-xs text-muted">{hint}</dd>}
      </dl>
    </Card>
  )
}

export function StatTileSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-3 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </Card>
  )
}
