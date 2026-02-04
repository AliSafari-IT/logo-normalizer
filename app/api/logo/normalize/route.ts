import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_DIMENSION = 10000
const MIN_DIMENSION = 1
const MAX_WIDTH = 2000
const MAX_HEIGHT = 2000

interface NormalizeSettings {
  width: number
  height: number
  fitMode: 'contain' | 'cover' | 'stretch'
  padding: number
  background: string
  trimMode?: 'transparent' | 'white' | 'both' | 'none'
  trimEnabled?: boolean
  whiteTrimTolerance?: number
  outputFormat?: 'png' | 'webp'
}

interface TrimResult {
  trimmed: boolean
  originalArea: number
  trimmedArea: number
  reductionPercent: number
  warning: boolean
}

interface ResolvedSettings extends NormalizeSettings {
  width: number
  height: number
  padding: number
  whiteTrimTolerance: number
}

async function validateFile(buffer: Buffer, mimeType: string): Promise<void> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`Unsupported file type: ${mimeType}. Allowed: PNG, JPEG, WebP, SVG`)
  }
}

function parseAndValidateSettings(settings: NormalizeSettings): ResolvedSettings {
  const width = Number.parseInt(String(settings.width), 10)
  const height = Number.parseInt(String(settings.height), 10)
  const padding = Number.parseInt(String(settings.padding), 10)
  const whiteTrimTolerance = Number.parseInt(String(settings.whiteTrimTolerance || 20), 10)

  if (!Number.isInteger(width) || width < MIN_DIMENSION || width > MAX_WIDTH) {
    throw new Error(`Width must be an integer between ${MIN_DIMENSION} and ${MAX_WIDTH}`)
  }

  if (!Number.isInteger(height) || height < MIN_DIMENSION || height > MAX_HEIGHT) {
    throw new Error(`Height must be an integer between ${MIN_DIMENSION} and ${MAX_HEIGHT}`)
  }

  if (!Number.isInteger(padding) || padding < 0 || padding > Math.min(width, height) / 2) {
    throw new Error(`Padding must be an integer between 0 and ${Math.min(width, height) / 2}`)
  }

  if (!Number.isInteger(whiteTrimTolerance) || whiteTrimTolerance < 0 || whiteTrimTolerance > 60) {
    throw new Error('White trim tolerance must be an integer between 0 and 60')
  }

  const contentWidth = width - padding * 2
  const contentHeight = height - padding * 2

  if (contentWidth <= 0 || contentHeight <= 0) {
    throw new Error('Padding is too large for the target dimensions')
  }

  return {
    ...settings,
    width,
    height,
    padding,
    whiteTrimTolerance,
  }
}

async function applySmartTrim(
  image: sharp.Sharp,
  trimMode: string,
  tolerance: number
): Promise<{ image: sharp.Sharp; trimResult: TrimResult }> {
  const originalMetadata = await image.metadata()
  const originalArea = (originalMetadata.width || 0) * (originalMetadata.height || 0)

  let trimmedImage = image
  let trimApplied = false
  let finalReductionPercent = 0

  if (trimMode === 'transparent' || trimMode === 'both') {
    const transparentTrimmed = image.ensureAlpha().trim({ threshold: 1 })
    const transparentMetadata = await transparentTrimmed.metadata()
    const transparentArea = (transparentMetadata.width || 0) * (transparentMetadata.height || 0)
    const transparentReduction = originalArea > 0 ? ((originalArea - transparentArea) / originalArea) * 100 : 0

    if (transparentReduction <= 50) {
      trimmedImage = transparentTrimmed
      trimApplied = true
      finalReductionPercent = transparentReduction

      if (process.env.NODE_ENV === 'development') {
        console.log('[Logo Normalizer] Transparent trim applied:', {
          originalArea,
          trimmedArea: transparentArea,
          reductionPercent: transparentReduction,
        })
      }
    }
  }

  if (trimMode === 'white' && finalReductionPercent <= 50) {
    const whiteTrimmed = trimmedImage
      .removeAlpha()
      .trim({ threshold: Math.max(tolerance, 5) })
      .ensureAlpha()
    
    const whiteMetadata = await whiteTrimmed.metadata()
    const whiteArea = (whiteMetadata.width || 0) * (whiteMetadata.height || 0)
    const whiteReduction = originalArea > 0 ? ((originalArea - whiteArea) / originalArea) * 100 : 0

    if (whiteReduction <= 50 && whiteReduction > 0) {
      trimmedImage = whiteTrimmed
      trimApplied = true
      finalReductionPercent = whiteReduction

      if (process.env.NODE_ENV === 'development') {
        console.log('[Logo Normalizer] White trim applied:', {
          originalArea,
          trimmedArea: whiteArea,
          reductionPercent: whiteReduction,
          tolerance: Math.max(tolerance, 5),
        })
      }
    }
  }

  const trimmedMetadata = await trimmedImage.metadata()
  const trimmedArea = (trimmedMetadata.width || 0) * (trimmedMetadata.height || 0)
  const warning = finalReductionPercent > 50

  return {
    image: trimmedImage,
    trimResult: {
      trimmed: trimApplied,
      originalArea,
      trimmedArea,
      reductionPercent: Math.round(finalReductionPercent * 10) / 10,
      warning,
    },
  }
}

async function processImage(
  buffer: Buffer,
  mimeType: string,
  settings: ResolvedSettings
): Promise<{ outputBuffer: Buffer; trimResult?: TrimResult }> {
  let image = sharp(buffer, { unlimited: true })

  if (mimeType === 'image/svg+xml') {
    image = sharp(buffer, {
      density: Math.max(settings.width, settings.height) / 100,
    })
  }

  let trimResult: TrimResult | undefined

  if (settings.trimEnabled && settings.trimMode && settings.trimMode !== 'none') {
    const trimOutput = await applySmartTrim(image, settings.trimMode, settings.whiteTrimTolerance)
    image = trimOutput.image
    trimResult = trimOutput.trimResult
  }

  const contentWidth = settings.width - settings.padding * 2
  const contentHeight = settings.height - settings.padding * 2

  let backgroundColor: string | { r: number; g: number; b: number; alpha: number }

  if (settings.background === 'transparent') {
    backgroundColor = { r: 0, g: 0, b: 0, alpha: 0 }
  } else {
    const hex = settings.background.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    backgroundColor = { r, g, b, alpha: 1 }
  }

  let resized: sharp.Sharp

  if (settings.fitMode === 'stretch') {
    resized = image.resize(contentWidth, contentHeight, { 
      fit: 'fill',
      background: backgroundColor
    })
  } else if (settings.fitMode === 'cover') {
    resized = image.resize(contentWidth, contentHeight, { 
      fit: 'cover',
      background: backgroundColor
    })
  } else {
    resized = image.resize(contentWidth, contentHeight, { 
      fit: 'contain', 
      withoutEnlargement: false,
      background: backgroundColor
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('[Logo Normalizer] Sharp pipeline (contain):', {
        contentWidth,
        contentHeight,
        fitMode: 'contain',
        background: backgroundColor,
      })
    }
  }

  const resizedBuffer = await resized.png().toBuffer()

  const outputBuffer = await sharp({
    create: {
      width: settings.width,
      height: settings.height,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([
      {
        input: resizedBuffer,
        left: settings.padding,
        top: settings.padding,
      },
    ])
    .toFormat(settings.outputFormat || 'png')
    .toBuffer()

  return { outputBuffer, trimResult }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const settingsJson = formData.get('settings') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!settingsJson) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    const rawSettings: NormalizeSettings = JSON.parse(settingsJson)
    const settings = parseAndValidateSettings(rawSettings)

    const buffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(buffer)
    const nodeBuffer = Buffer.from(uint8Array)

    await validateFile(nodeBuffer, file.type)

    if (process.env.NODE_ENV === 'development') {
      console.log('[Logo Normalizer] Resolved settings:', {
        width: settings.width,
        height: settings.height,
        padding: settings.padding,
        fitMode: settings.fitMode,
        background: settings.background,
        trimEnabled: settings.trimEnabled,
        trimMode: settings.trimMode,
        whiteTrimTolerance: settings.whiteTrimTolerance,
        outputFormat: settings.outputFormat,
      })
    }

    const { outputBuffer, trimResult } = await processImage(nodeBuffer, file.type, settings)

    const originalName = file.name.replace(/\.[^/.]+$/, '')
    const extension = settings.outputFormat === 'webp' ? 'webp' : 'png'
    const outputFilename = `${originalName}__${settings.width}x${settings.height}__${settings.fitMode}.${extension}`

    const contentType = settings.outputFormat === 'webp' ? 'image/webp' : 'image/png'
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${outputFilename}"`,
      'X-Filename': outputFilename,
    }

    if (trimResult) {
      responseHeaders['X-Trim-Warning'] = trimResult.warning ? 'true' : 'false'
      responseHeaders['X-Trim-Reduction'] = trimResult.reductionPercent.toString()
    }

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: responseHeaders,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
