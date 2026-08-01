'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

const STEPS = [
  {
    title: '1. Upload your logo',
    body: "Drag and drop a PNG, JPEG, WebP, or SVG file onto the upload area, or click it to browse. Max file size is 5MB.",
  },
  {
    title: '2. Pick a target size',
    body: "Choose a preset (e.g. \"Slider (160×48)\") or type a custom Width/Height. Toggle Landscape/Portrait to flip preset orientation, or use \"Swap width & height\".",
  },
  {
    title: '3. Choose a fit mode',
    body: 'Contain keeps the full logo visible and pads the rest. Cover fills the slot and may crop edges. Stretch forces the exact box and may distort the logo.',
  },
  {
    title: '4. Tune background & trimming',
    body: 'Keep the background transparent or pick a solid color. Enable "Remove white background" for logos saved on white, and "Smart trim margins" to strip empty padding before resizing.',
  },
  {
    title: '5. Generate & download',
    body: 'Click "Generate Preview" to render the output on the server, review it, then click "Download Output" to save the PNG or WebP file.',
  },
]

export function HelpModal({ open, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 id="help-modal-title" className="text-2xl font-bold text-slate-100">
              How to use Logo Normalizer
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Turn any logo into consistent, correctly sized assets in a few steps.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="space-y-4 mb-6">
          {STEPS.map((step) => (
            <li key={step.title} className="bg-slate-800/50 border border-slate-800 rounded-lg p-4">
              <p className="font-semibold text-slate-100 mb-1">{step.title}</p>
              <p className="text-sm text-slate-400">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="bg-blue-950/30 border border-blue-800/50 rounded-lg p-4">
          <p className="font-semibold text-blue-300 mb-2">Example: preparing a partner-slider logo</p>
          <p className="text-sm text-slate-300">
            You have a 800×600 PNG logo on a white background and need a 160×48 asset for a
            partner slider.
          </p>
          <ol className="list-decimal list-inside text-sm text-slate-300 mt-2 space-y-1">
            <li>Upload the 800×600 PNG.</li>
            <li>Select the <span className="font-mono text-slate-200">Slider (160×48)</span> preset.</li>
            <li>Set Fit Mode to <span className="font-mono text-slate-200">Contain</span> so the logo isn&apos;t cropped.</li>
            <li>Enable <span className="font-mono text-slate-200">Remove white background</span> so it composites cleanly on any surface.</li>
            <li>Click <span className="font-mono text-slate-200">Generate Preview</span>, confirm it looks right, then <span className="font-mono text-slate-200">Download Output</span>.</li>
          </ol>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
