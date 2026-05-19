import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import {
  launchCameraAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  requestMediaLibraryPermissionsAsync,
  type ImagePickerAsset,
} from 'expo-image-picker'
import * as ExpoImagePicker from 'expo-image-picker'
import { Image } from 'expo-image'
import { BaseInput } from './BaseInput'
import type { FormInputComponentProps, ImageUploadResult } from './types'
import { Button, Icon } from '../base'
import { materialColors } from '../../theme/material'
import { fileUpload, type MobileUploadFile } from '../../lib/api'
import { toast } from '../../lib/toast'

type UploadingItem = {
  localUri: string
  name: string
  progress: number
  error?: string
}

type UploadingState = Record<string, UploadingItem>

const BYTES_PER_MB = 1_000_000

function normalizeImages(value: unknown): ImageUploadResult[] {
  if (!value) return []
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object') as ImageUploadResult[]
  if (typeof value === 'object') return [value as ImageUploadResult]
  return []
}

function getFileName(uri: string): string {
  const trimmed = uri.split('?')[0] || ''
  const segment = trimmed.split('/').filter(Boolean).pop()
  return segment || `image-${Date.now()}.jpg`
}

function getMimeType(asset: ImagePickerAsset): string {
  if (asset.mimeType) return asset.mimeType
  const name = asset.fileName || getFileName(asset.uri)
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.heic')) return 'image/heic'
  if (lower.endsWith('.heif')) return 'image/heif'
  if (lower.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function getImagePickerMethod<T extends (...args: any[]) => any>(name: string): T | undefined {
  const module = ExpoImagePicker as unknown as Record<string, any>
  return module[name] || module.default?.[name]
}

function applyTransform(result: ImageUploadResult, transform?: Record<string, string>): ImageUploadResult {
  if (!transform) return result
  const next = { ...result }

  Object.entries(transform).forEach(([sourceKey, targetKey]) => {
    if (!Object.prototype.hasOwnProperty.call(next, sourceKey)) return
    next[targetKey] = next[sourceKey]
    delete next[sourceKey]
  })

  return next
}

export function ImageInput({
  field,
  label,
  value,
  onChangeValue,
  onValidationTouch,
  helperMessage,
  enableHelperMessage,
  error,
  disabled = false,
  maxSize = 5,
  disableInformation = false,
  multi = false,
  limit = -1,
  additionalInfo = '',
  transform,
  uploadPath = '',
}: FormInputComponentProps) {
  const [uploadingItems, setUploadingItems] = useState<UploadingState>({})

  const images = useMemo(() => normalizeImages(value), [value])
  const uploadingCount = Object.keys(uploadingItems).length
  const capacity = multi ? (limit === -1 ? Number.POSITIVE_INFINITY : Math.max(0, limit - images.length - uploadingCount)) : (images.length + uploadingCount > 0 ? 0 : 1)
  const reachedSingleCapacity = !multi && images.length > 0
  const reachedLimitCapacity = multi && limit !== -1 && images.length + uploadingCount >= limit
  const canPick = !disabled && capacity > 0 && !reachedSingleCapacity && !reachedLimitCapacity

  async function pickFromLibrary(handleValidationTouch: () => void) {
    if (!canPick) return

    const requestPermission = getImagePickerMethod<typeof requestMediaLibraryPermissionsAsync>('requestMediaLibraryPermissionsAsync')
    const openLibrary = getImagePickerMethod<typeof launchImageLibraryAsync>('launchImageLibraryAsync')
    if (!requestPermission || !openLibrary) return

    const permission = await requestPermission()
    if (!permission.granted) return

    const selectionLimit = multi
      ? (limit === -1 ? 0 : Math.max(0, limit - images.length - uploadingCount))
      : 1

    const result = await openLibrary({
      mediaTypes: ['images'],
      allowsMultipleSelection: multi,
      selectionLimit,
      orderedSelection: true,
      quality: 1,
    })

    if (result.canceled) return
    await processAssets(result.assets || [], handleValidationTouch)
  }

  async function captureFromCamera(handleValidationTouch: () => void) {
    if (!canPick) return

    const requestPermission = getImagePickerMethod<typeof requestCameraPermissionsAsync>('requestCameraPermissionsAsync')
    const openCamera = getImagePickerMethod<typeof launchCameraAsync>('launchCameraAsync')
    if (!requestPermission || !openCamera) return

    const permission = await requestPermission()
    if (!permission.granted) return

    const result = await openCamera({
      mediaTypes: ['images'],
      quality: 1,
    })

    if (result.canceled) return
    await processAssets(result.assets || [], handleValidationTouch)
  }

  async function processAssets(assets: ImagePickerAsset[], handleValidationTouch: () => void) {
    if (!assets.length) return

    const currentCapacity = multi
      ? (limit === -1 ? Number.POSITIVE_INFINITY : Math.max(0, limit - images.length - Object.keys(uploadingItems).length))
      : (images.length > 0 ? 0 : 1)

    const limitedAssets = assets.slice(0, Number.isFinite(currentCapacity) ? currentCapacity : assets.length)

    if (limitedAssets.length < assets.length) {
      toast.info('Batas maksimal gambar tercapai')
    }

    const successful: ImageUploadResult[] = []
    let failedCount = 0

    for (const asset of limitedAssets) {
      const assetName = asset.fileName || getFileName(asset.uri)
      const uploadKey = `${asset.uri}-${assetName}-${Date.now()}-${Math.random().toString(36).slice(2)}`

      if (typeof asset.fileSize === 'number' && asset.fileSize > maxSize * BYTES_PER_MB) {
        failedCount += 1
        toast.error('Ukuran berkas terlalu besar')
        continue
      }

      setUploadingItems((prev) => ({
        ...prev,
        [uploadKey]: {
          localUri: asset.uri,
          name: assetName,
          progress: 0,
        },
      }))

      try {
        const file: MobileUploadFile = {
          uri: asset.uri,
          name: assetName,
          type: getMimeType(asset),
          size: asset.fileSize,
        }

        const uploadResult = await fileUpload(file, uploadPath, (progress) => {
          const percentage = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0
          setUploadingItems((prev) => {
            const current = prev[uploadKey]
            if (!current) return prev
            return {
              ...prev,
              [uploadKey]: {
                ...current,
                progress: percentage,
              },
            }
          })
        })

        successful.push(applyTransform(uploadResult, transform))
      } catch {
        failedCount += 1
      } finally {
        setUploadingItems((prev) => {
          if (!prev[uploadKey]) return prev
          const next = { ...prev }
          delete next[uploadKey]
          return next
        })
      }
    }

    if (successful.length > 0) {
      const nextValue = multi ? [...images, ...successful] : successful[0]
      onChangeValue(nextValue)
      handleValidationTouch()
    }

    if (failedCount > 0 && successful.length > 0) {
      toast.error('Sebagian gambar gagal diunggah')
    } else if (failedCount > 0) {
      toast.error('Gagal mengunggah gambar')
    }
  }

  function removeImage(index: number, handleValidationTouch: () => void) {
    if (disabled) return

    if (!multi) {
      onChangeValue(null)
      handleValidationTouch()
      return
    }

    const next = images.filter((_, imageIndex) => imageIndex !== index)
    onChangeValue(next)
    handleValidationTouch()
  }

  const infoShouldShowUploadGuidance = multi || images.length === 0

  return (
    <BaseInput
      field={field}
      label={label}
      error={error}
      helperMessage={helperMessage}
      enableHelperMessage={enableHelperMessage}
      onValidationTouch={onValidationTouch}
    >
      {({ onValidationTouch: handleValidationTouch }) => (
        <View className="gap-2" style={{ opacity: disabled ? 0.65 : 1 }}>
          {!reachedSingleCapacity ? (
            <View className="flex-row gap-2">
              <Button
                accessibilityLabel={`${field}-pick-library`}
                variant="tonal"
                className='flex-1'
                onPress={() => {
                  void pickFromLibrary(handleValidationTouch)
                }}
                disabled={!canPick}
              >
                <Icon name="image-add" />
                <Text>Ambil dari galeri</Text>
              </Button>
              <Button
                accessibilityLabel={`${field}-capture-camera`}
                variant="tonal"
                className='flex-1'
                onPress={() => {
                  void captureFromCamera(handleValidationTouch)
                }}
                disabled={!canPick}
              >
                <Icon name="camera" />
                <Text>Ambil foto</Text>
              </Button>
            </View>
          ) : null}

          <View className="flex-row flex-wrap gap-2">
            {images.map((item, index) => {
              const imageSource = item.thumbnail_url || item.thumbnail_url || item.url
              return (
                <View
                  key={`uploaded-${index}-${imageSource || 'unknown'}`}
                  className="relative overflow-hidden rounded-lg"
                  style={{ width: 112, height: 112, borderWidth: 1, borderColor: materialColors.outlineVariant }}
                >
                  {imageSource ? (
                    <Image source={{ uri: imageSource }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View className="h-full items-center justify-center" style={{ backgroundColor: materialColors.surfaceContainerHighest }}>
                      <Icon name="image-line" />
                    </View>
                  )}
                  {!disabled ? (
                    <Pressable
                      accessibilityLabel={`${field}-remove-${index}`}
                      onPress={() => removeImage(index, handleValidationTouch)}
                      className="absolute right-1 top-1 rounded-full p-1"
                      style={{ backgroundColor: materialColors.errorContainer }}
                    >
                      <Icon name="close" size={14} color={materialColors.onErrorContainer} />
                    </Pressable>
                  ) : null}
                </View>
              )
            })}

            {Object.entries(uploadingItems).map(([key, item]) => (
              <View
                key={`uploading-${key}`}
                className="relative overflow-hidden rounded-lg"
                style={{ width: 112, height: 112, borderWidth: 1, borderColor: materialColors.outlineVariant }}
              >
                <Image source={{ uri: item.localUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
                  {item.progress > 0 ? (
                    <Text className="text-xs font-semibold" style={{ color: materialColors.onPrimary }}>{item.progress}%</Text>
                  ) : (
                    <ActivityIndicator size="small" color={materialColors.onPrimary} />
                  )}
                </View>
              </View>
            ))}
          </View>

          {!disableInformation ? (
            <View className="gap-1">
              {infoShouldShowUploadGuidance ? <Text className="text-xs" style={{ color: materialColors.onSurfaceVariant }}>Unggah gambar yang akan digunakan</Text> : <Text className="text-xs" style={{ color: materialColors.onSurfaceVariant }}>{images.length} gambar diunggah</Text>}
              {infoShouldShowUploadGuidance && maxSize !== 1000000 ? (
                <Text className="text-xs" style={{ color: materialColors.onSurfaceVariant }}>Ukuran berkas maksimal {maxSize} MB</Text>
              ) : null}
              {infoShouldShowUploadGuidance && limit !== 1 && limit !== -1 ? (
                <Text className="text-xs" style={{ color: materialColors.onSurfaceVariant }}>Maksimal {limit} gambar</Text>
              ) : null}
              {infoShouldShowUploadGuidance && additionalInfo ? (
                <View className="self-start rounded-md px-2 py-1" style={{ backgroundColor: materialColors.secondaryContainer }}>
                  <Text className="text-[11px]" style={{ color: materialColors.onSecondaryContainer }}>{additionalInfo}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </BaseInput>
  )
}

export type { FormInputComponentProps as FormImageInputProps }
