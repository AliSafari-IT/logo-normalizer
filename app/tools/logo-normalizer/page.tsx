'use client'

import React, { useState } from 'react'
import { UploadDropzone } from '@/components/UploadDropzone'
import { SettingsPanel } from '@/components/SettingsPanel'
import { PreviewCanvas } from '@/components/PreviewCanvas'
import { Download, Loader2 } from 'lucide-react'

export default function LogoNormalizerPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [width, setWidth] = useState(160)
  const [height, setHeight] = useState(48)
  const [fitMode, setFitMode] = useState<'contain' | 'cover' | 'stretch'>('contain')
  const [padding, setPadding] = useState(8)
  const [background, setBackground] = useState('transparent')
  const [trimMode, setTrimMode] = useState<'transparent' | 'white' | 'both' | 'none'>('transparent')
  const [trimEnabled, setTrimEnabled] = useState(true)
  const [whiteTrimTolerance, setWhiteTrimTolerance] = useState(15)
  const [removeWhiteBackground, setRemoveWhiteBackground] = useState(false)
  const [whiteBackgroundTolerance, setWhiteBackgroundTolerance] = useState(20)
  const [outputFormat, setOutputFormat] = useState<'png' | 'webp'>('png')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trimWarning, setTrimWarning] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{
    name: string
    type: string
    size: number
  } | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [outputBlobUrl, setOutputBlobUrl] = useState<string | null>(null)
  const [outputFilename, setOutputFilename] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<{
    actualWidth: number
    actualHeight: number
    padding: number
    fitMode: string
    background: string
    blobSize: number
    blobType: string
    filename: string
  } | null>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setFileInfo({
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
    })

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleSettingsChange = (settings: Partial<{
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
  }>) => {
    if (settings.width !== undefined) setWidth(settings.width)
    if (settings.height !== undefined) setHeight(settings.height)
    if (settings.fitMode !== undefined) setFitMode(settings.fitMode)
    if (settings.padding !== undefined) setPadding(settings.padding)
    if (settings.background !== undefined) setBackground(settings.background)
    if (settings.trimMode !== undefined) setTrimMode(settings.trimMode)
    if (settings.trimEnabled !== undefined) setTrimEnabled(settings.trimEnabled)
    if (settings.whiteTrimTolerance !== undefined) setWhiteTrimTolerance(settings.whiteTrimTolerance)
    if (settings.removeWhiteBackground !== undefined) setRemoveWhiteBackground(settings.removeWhiteBackground)
    if (settings.whiteBackgroundTolerance !== undefined) setWhiteBackgroundTolerance(settings.whiteBackgroundTolerance)
    if (settings.outputFormat !== undefined) setOutputFormat(settings.outputFormat)
  }

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload a logo first')
      return
    }

    setLoading(true)
    setError(null)
    setTrimWarning(null)
    setOutputBlob(null)
    setOutputBlobUrl(null)
    setDebugInfo(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append(
        'settings',
        JSON.stringify({
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
        })
      )

      const response = await fetch('/api/logo/normalize', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const trimWarningHeader = response.headers.get('X-Trim-Warning')
      const trimReductionHeader = response.headers.get('X-Trim-Reduction')

      if (trimWarningHeader === 'true' && trimReductionHeader) {
        const reduction = parseFloat(trimReductionHeader)
        setTrimWarning(
          `⚠️ Trim reduced logo size by ${reduction}% (>40%). Consider disabling trim if this looks wrong.`
        )
      }

      const blob = await response.blob()
      const filename =
        response.headers.get('X-Filename') ||
        `logo__${width}x${height}__${fitMode}.png`

      setOutputBlob(blob)
      setOutputFilename(filename)
      
      const blobUrl = window.URL.createObjectURL(blob)
      setOutputBlobUrl(blobUrl)

      if (process.env.NODE_ENV === 'development') {
        setDebugInfo({
          actualWidth: width,
          actualHeight: height,
          padding,
          fitMode,
          background,
          blobSize: blob.size,
          blobType: blob.type,
          filename,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!outputBlob || !outputFilename) {
      setError('No output available. Please generate first.')
      return
    }

    const url = window.URL.createObjectURL(outputBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = outputFilename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Logo Normalizer</h1>
          <p className="text-lg text-gray-600">
            Upload a logo and generate consistent sized outputs for your partner slider
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Logo</h2>
              <UploadDropzone onFileSelect={handleFileSelect} disabled={loading} />

              {fileInfo && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">File:</span> {fileInfo.name}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Type:</span> {fileInfo.type}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Size:</span>{' '}
                    {(fileInfo.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {preview && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Original Preview</h2>
                <div className="flex justify-center">
                  <img
                    src={preview}
                    alt="Original"
                    className="max-w-full max-h-64 rounded-lg border border-gray-300"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {trimWarning && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">{trimWarning}</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!file || loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate Preview
                </>
              )}
            </button>

            {outputBlob && (
              <button
                onClick={handleDownload}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Output
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 h-fit sticky top-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
            <SettingsPanel
              width={width}
              height={height}
              fitMode={fitMode}
              padding={padding}
              background={background}
              trimMode={trimMode}
              trimEnabled={trimEnabled}
              whiteTrimTolerance={whiteTrimTolerance}
              removeWhiteBackground={removeWhiteBackground}
              whiteBackgroundTolerance={whiteBackgroundTolerance}
              outputFormat={outputFormat}
              onChange={handleSettingsChange}
            />
          </div>
        </div>

        {outputBlob && outputBlobUrl && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Output Preview (Server-Generated)</h2>
            <div className="flex justify-center" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23f0f0f0\'/%3E%3C/svg%3E")',
              backgroundPosition: '0 0, 10px 10px',
              backgroundSize: '20px 20px',
              padding: '20px',
            }}>
              <img
                src={outputBlobUrl}
                alt="Output"
                className="max-w-full max-h-96 rounded-lg border border-gray-300"
              />
            </div>

            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Debug Info (Dev Mode)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Dimensions:</span>
                    <span className="text-gray-600"> {`${debugInfo.actualWidth}×${debugInfo.actualHeight}px`}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Padding:</span>
                    <span className="text-gray-600"> {`${debugInfo.padding}px`}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fit Mode:</span>
                    <span className="text-gray-600"> {debugInfo.fitMode}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Background:</span>
                    <span className="text-gray-600"> {debugInfo.background}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Blob Size:</span>
                    <span className="text-gray-600"> {`${(debugInfo.blobSize / 1024).toFixed(2)} KB`}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Blob Type:</span>
                    <span className="text-gray-600"> {debugInfo.blobType}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Filename:</span>
                    <span className="text-gray-600"> {debugInfo.filename}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
