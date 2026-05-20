'use client'

import { useRef, useMemo, useEffect } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'

const MAX_PHOTOS = 10
const MAX_SIZE_MB = 10

interface PhotoUploaderProps {
  files: File[]
  onChange: (files: File[]) => void
  disabled?: boolean
}

function isValidImage(f: File) {
  return f.type.startsWith('image/') && f.size <= MAX_SIZE_MB * 1024 * 1024
}

export function PhotoUploader({ files, onChange, disabled }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter(isValidImage)
    const merged = [...files, ...valid].slice(0, MAX_PHOTOS)
    onChange(merged)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    if (disabled) return
    const dropped = Array.from(e.dataTransfer.files).filter(isValidImage)
    const merged = [...files, ...dropped].slice(0, MAX_PHOTOS)
    onChange(merged)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">
          Fotos <span className="text-gray-400 font-normal">({files.length}/{MAX_PHOTOS})</span>
        </p>
        {files.length === 0 && (
          <p className="text-xs text-gray-400">A primeira foto será a capa do anúncio</p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {files.map((file, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
            <Image
              src={previews[i]}
              alt={`foto ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 text-center text-xs bg-black/50 text-white py-0.5">
                Capa
              </span>
            )}
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5 text-gray-600" />
              </button>
            )}
          </div>
        ))}

        {files.length < MAX_PHOTOS && !disabled && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 flex flex-col items-center justify-center cursor-pointer transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-400" />
            <p className="text-xs text-gray-400 mt-1">Adicionar</p>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAdd}
        disabled={disabled}
      />

      {files.length === 0 && (
        <p className="text-xs text-red-500 mt-1">Adicione ao menos uma foto</p>
      )}
    </div>
  )
}
