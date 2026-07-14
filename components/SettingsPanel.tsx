'use client'

import React, { useState } from 'react'

interface SettingsPanelProps {
  width: number
  height: number
  fitMode: 'contain' | 'cover' | 'stretch'
  padding: number
  background: string
  trimMode: 'transparent' | 'white' | 'both' | 'none'
  trimEnabled: boolean
  whiteTrimTolerance: number
  removeWhiteBackground: boolean
  whiteBackgroundTolerance: number
  outputFormat: 'png' | 'webp'
  onChange: (settings: Partial<SettingsPanelProps>) => void
}

const PRESETS = [
  { name: 'Small', label: 'Small', width: 120, height: 44 },
  { name: 'Slider', label: 'Slider', width: 160, height: 48 },
  { name: 'Large', label: 'Large', width: 200, height: 56 },
  { name: 'XLarge', label: 'XLarge', width: 240, height: 64 },
  { name: '2XLarge', label: '2XLarge', width: 280, height: 72 },
  { name: '3XLarge', label: '3XLarge', width: 320, height: 80 },
]

export function SettingsPanel({
  width,
  height,
  fitMode,
  padding,
  background,
  trimMode,
  trimEnabled,
  whiteTrimTolerance,
  removeWhiteBackground,
  whiteBackgroundTolerance,
  outputFormat,
  onChange,
}: SettingsPanelProps) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>(
    height > width ? 'portrait' : 'landscape'
  )

  const orientedDimensions = (preset: { width: number; height: number }) =>
    orientation === 'portrait'
      ? { width: preset.height, height: preset.width }
      : { width: preset.width, height: preset.height }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Presets</h3>

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setOrientation('landscape')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              orientation === 'landscape'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Landscape
          </button>
          <button
            onClick={() => setOrientation('portrait')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              orientation === 'portrait'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Portrait
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((preset) => {
            const dims = orientedDimensions(preset)
            return (
              <button
                key={preset.name}
                onClick={() => onChange(dims)}
                className={`px-4 py-2 text-left text-sm font-medium rounded-lg transition-colors ${
                  width === dims.width && height === dims.height
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {preset.label} ({dims.width}×{dims.height})
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (px)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={width}
              onChange={(e) => onChange({ width: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (px)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              value={height}
              onChange={(e) => onChange({ height: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange({ width: height, height: width })
            setOrientation(width > height ? 'portrait' : 'landscape')
          }}
          className="mt-2 w-full px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Swap width &amp; height
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fit Mode
        </label>
        <select
          value={fitMode}
          onChange={(e) =>
            onChange({ fitMode: e.target.value as 'contain' | 'cover' | 'stretch' })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="contain">Contain (preserve aspect ratio, add padding)</option>
          <option value="cover">Cover (fill slot, crop overflow)</option>
          <option value="stretch">Stretch (force exact dimensions, may distort)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">
          {fitMode === 'contain' &&
            'Preserves aspect ratio and adds padding to fill the slot.'}
          {fitMode === 'cover' && 'Fills the slot completely, may crop the logo.'}
          {fitMode === 'stretch' && 'Forces exact dimensions, may distort the logo.'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Padding (px): {padding}
        </label>
        <input
          type="range"
          min="0"
          max="40"
          value={padding}
          onChange={(e) => onChange({ padding: parseInt(e.target.value) })}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Background
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ background: 'transparent' })}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
              background === 'transparent'
                ? 'bg-blue-500 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Transparent
          </button>
          <div className="flex-1 flex gap-2 w-full">
            <input
              type="color"
              value={background === 'transparent' ? '#ffffff' : background}
              onChange={(e) => onChange({ background: e.target.value })}
              className="w-12 h-10 rounded-lg cursor-pointer border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={background === 'transparent' ? '#ffffff' : background}
              onChange={(e) => onChange({ background: e.target.value })}
              placeholder="#FFFFFF"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="removeWhiteBackground"
            checked={removeWhiteBackground}
            onChange={(e) => onChange({ removeWhiteBackground: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="removeWhiteBackground" className="text-sm font-medium text-gray-700">
            Remove white background
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Converts near-white pixels across the whole image to transparent (for logos saved on a white background).
        </p>

        {removeWhiteBackground && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                White Background Tolerance: {whiteBackgroundTolerance}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={whiteBackgroundTolerance}
                onChange={(e) => onChange({ whiteBackgroundTolerance: parseInt(e.target.value) })}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values remove more off-white shades (0-100, default 20).
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="trimEnabled"
            checked={trimEnabled}
            onChange={(e) => onChange({ trimEnabled: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="trimEnabled" className="text-sm font-medium text-gray-700">
            Smart trim margins
          </label>
        </div>

        {trimEnabled && (
          <div className="space-y-3 pl-6 border-l-2 border-blue-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trim Mode
              </label>
              <select
                value={trimMode}
                onChange={(e) =>
                  onChange({ trimMode: e.target.value as 'transparent' | 'white' | 'both' | 'none' })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="transparent">Transparent trim (default)</option>
                <option value="white">White trim (PNG only)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {trimMode === 'transparent' && 'Removes transparent padding around logo'}
                {trimMode === 'white' && 'Removes near-white padding (configurable tolerance)'}
                {trimMode === 'both' && 'Removes both transparent and white padding'}
              </p>
            </div>

            {(trimMode === 'white' || trimMode === 'both') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  White Trim Tolerance: {whiteTrimTolerance}
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={whiteTrimTolerance}
                  onChange={(e) => onChange({ whiteTrimTolerance: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher values trim more aggressively (0-60, default 20)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Output Format
        </label>
        <select
          value={outputFormat}
          onChange={(e) => onChange({ outputFormat: e.target.value as 'png' | 'webp' })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="png">PNG (lossless, larger file)</option>
          <option value="webp">WebP (modern, smaller file)</option>
        </select>
      </div>
    </div>
  )
}
