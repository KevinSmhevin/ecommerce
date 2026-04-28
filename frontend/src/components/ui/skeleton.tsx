import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type SkeletonProps = HTMLAttributes<HTMLDivElement>

const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
)

export { Skeleton }
