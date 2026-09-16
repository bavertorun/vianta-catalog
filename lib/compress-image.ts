/** Tarayıcıda görseli küçült — sunucuya giden dosyayı hızlandırır */
export async function compressImage(file: File, maxWidth = 1400, quality = 0.72): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  })

  return blob || file
}
