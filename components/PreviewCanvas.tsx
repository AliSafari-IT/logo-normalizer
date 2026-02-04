'use client'

import React from 'react'

interface PreviewCanvasProps {
  imageUrl: string | null
  width: number
  height: number
  showGuides?: boolean
}

export function PreviewCanvas({
  imageUrl,
  width,
  height,
  showGuides = false,
}: PreviewCanvasProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div
          className="checkerboard rounded-lg border border-gray-300 flex items-center justify-center mx-auto"
          style={{
            width: `${Math.min(width, 400)}px`,
            height: `${Math.min(height, 400)}px`,
            position: 'relative',
          }}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              {showGuides && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    border: '2px dashed rgba(59, 130, 246, 0.5)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">No preview available</p>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {width}×{height}px
        </p>
      </div>
    </div>
  )
}
