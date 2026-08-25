import { useState, useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { optimizeImage } from '../services/imageOptimizer'
import { useThemeSettings } from '../contexts/ThemeSettingsContext'

interface UploadZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}
const MAX_SIZE = 15 * 1024 * 1024 // 15 MB

export default function UploadZone({ onFile, disabled = false }: UploadZoneProps) {
  const { clientCompression, compressionQuality, maxDimension } = useThemeSettings()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [savingsMsg, setSavingsMsg] = useState<string | null>(null)

  const processAndSubmitFile = useCallback(
    async (rawFile: File) => {
      try {
        if (clientCompression && rawFile.size > 200 * 1024) {
          setIsOptimizing(true)
          const result = await optimizeImage(rawFile, {
            enabled: true,
            quality: compressionQuality,
            maxDimension: maxDimension,
          })
          setIsOptimizing(false)

          if (result.savedPercent > 0) {
            const originalMb = (result.originalSize / (1024 * 1024)).toFixed(1)
            const compressedMb = (result.compressedSize / (1024 * 1024)).toFixed(1)
            setSavingsMsg(`Optimized from ${originalMb}MB to ${compressedMb}MB (${result.savedPercent}% saved)`)
          }
          onFile(result.file)
        } else {
          onFile(rawFile)
        }
      } catch (e) {
        setIsOptimizing(false)
        onFile(rawFile)
      }
    },
    [clientCompression, compressionQuality, maxDimension, onFile]
  )

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (rejected.length > 0) return
      if (accepted[0]) {
        processAndSubmitFile(accepted[0])
      }
    },
    [processAndSubmitFile]
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: disabled || isOptimizing,
  })

  const errorMsg =
    fileRejections[0]?.errors[0]?.code === 'file-too-large'
      ? 'File exceeds 15 MB.'
      : fileRejections[0]?.errors[0]?.code === 'file-invalid-type'
      ? 'Unsupported format. Use JPEG, PNG, or WebP.'
      : null

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        role="button"
        tabIndex={0}
        aria-label="Drop zone — drag and drop an image here or click to browse"
        className={`
          relative flex flex-col items-center justify-center gap-5
          min-h-[300px] rounded-2xl border-2 border-dashed
          cursor-pointer select-none overflow-hidden
          transition-all duration-200 shadow-sm
          ${isDragActive
            ? 'border-magenta bg-magenta/10 scale-[1.01] shadow-glow'
            : 'border-border hover:border-magenta/50 bg-surface hover:bg-surface-raised'
          }
          ${disabled || isOptimizing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Ambient background decoration */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />

        {/* Corner Accents */}
        {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
          <span
            key={i}
            className={`absolute ${pos} w-4 h-4 border-magenta pointer-events-none opacity-60
              ${i === 0 ? 'border-t-2 border-l-2 rounded-tl-md' : ''}
              ${i === 1 ? 'border-t-2 border-r-2 rounded-tr-md' : ''}
              ${i === 2 ? 'border-b-2 border-l-2 rounded-bl-md' : ''}
              ${i === 3 ? 'border-b-2 border-r-2 rounded-br-md' : ''}
            `}
            aria-hidden="true"
          />
        ))}

        {/* Icon */}
        <div
          className={`
            relative w-20 h-20 rounded-2xl flex items-center justify-center
            transition-all duration-200 shadow-md
            ${isDragActive
              ? 'bg-magenta text-white scale-110'
              : 'bg-surface-raised border border-border text-magenta'
            }
          `}
        >
          {isOptimizing ? (
            <svg className="animate-spin w-8 h-8 text-magenta" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isDragActive ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 animate-bounce">
              <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-9 h-9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5a1.5 1.5 0 001.5 1.5z" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="text-center px-6 z-10">
          <p className="font-display font-bold text-lg text-primary">
            {isOptimizing
              ? 'Optimizing image on client…'
              : isDragActive
              ? 'Release to upload'
              : 'Drag & drop image here'}
          </p>
          <p className="text-xs text-muted mt-1.5">
            or click to browse &bull; JPEG, PNG, WebP up to 15 MB
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="btn-primary gap-2 pointer-events-none relative z-10 text-xs py-2 px-5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
          </svg>
          Select Image
        </button>
      </div>

      {savingsMsg && (
        <p className="mt-2 text-xs text-success text-center flex items-center justify-center gap-1 font-medium animate-fade-up">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 01.208 1.04l-5 7.5a.75.75 0 01-1.154.114l-3-3a.75.75 0 011.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 011.04-.207z" clipRule="evenodd" />
          </svg>
          {savingsMsg}
        </p>
      )}

      {errorMsg && (
        <p role="alert" className="mt-2 text-xs text-danger text-center flex items-center justify-center gap-1 font-medium">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
