'use client'

import { Suspense, lazy, forwardRef } from 'react'
import type { Application } from '@splinetool/runtime'

const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  onLoad?: (splineApp: Application) => void
}

export const SplineScene = forwardRef<HTMLDivElement, SplineSceneProps>(
  function SplineScene({ scene, className, onLoad }, ref) {
    return (
      <div ref={ref} className={className}>
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <span className="loader"></span>
            </div>
          }
        >
          <Spline
            scene={scene}
            className="w-full h-full"
            onLoad={onLoad}
          />
        </Suspense>
      </div>
    )
  }
)