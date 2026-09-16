import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import sharp from 'sharp'
import { isAuthenticated } from '@/lib/admin-auth'

async function saveImage(bytes: Buffer, code: string, index: number) {
  const dir = path.join(process.cwd(), 'public', 'products')
  await fs.mkdir(dir, { recursive: true })

  const stamp = Date.now().toString(36)
  const filename = `${code}-${index}-${stamp}.webp`
  const outPath = path.join(dir, filename)

  // Daha hızlı işlem: 1200px, düşük effort WebP
  await sharp(bytes)
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 72, effort: 3 })
    .toFile(outPath)

  return `/products/${filename}`
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const form = await request.formData()
  const code = String(form.get('code') || '').trim()
  const startIndex = Number(form.get('startIndex') || form.get('index') || 1)

  if (!code) {
    return NextResponse.json({ error: 'Kod gerekli' }, { status: 400 })
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File)
  const single = form.get('file')
  if (single instanceof File) files.push(single)

  if (!files.length) {
    return NextResponse.json({ error: 'Dosya gerekli' }, { status: 400 })
  }

  const paths = await Promise.all(
    files.map(async (file, i) => {
      const bytes = Buffer.from(await file.arrayBuffer())
      return saveImage(bytes, code, startIndex + i)
    }),
  )

  return NextResponse.json({ paths, path: paths[0] })
}
