'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Upload, X, FileImage } from 'lucide-react'

interface UploadFieldProps {
  label: string
  hint: string
  accept?: string
  value: File | null
  onChange: (file: File | null) => void
  disabled?: boolean
}

export function UploadField({ label, hint, accept = 'image/*', value, onChange, disabled }: UploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleFile(file: File | null) {
    if (!file) {
      setPreview(null)
      onChange(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (disabled) return
    handleFile(e.dataTransfer.files?.[0] ?? null)
  }

  function handleRemove() {
    setPreview(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-xs text-gray-400 mb-2">{hint}</p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <div className="relative w-full h-48">
            <Image src={preview} alt={label} fill className="object-contain" unoptimized />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer'
          }`}
        >
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <FileImage className="w-8 h-8" />
            <p className="text-sm">
              {disabled ? 'Upload desabilitado' : 'Clique ou arraste a imagem aqui'}
            </p>
            <p className="text-xs">JPG, PNG ou HEIC — máx. 10 MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={handleChange}
      />
    </div>
  )
}
