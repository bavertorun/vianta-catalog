import { promises as fs } from 'fs'
import path from 'path'

const queues = new Map<string, Promise<void>>()

export async function writeAtomic(filePath: string, contents: string): Promise<void> {
  const previous = queues.get(filePath) ?? Promise.resolve()
  const run = previous.then(() => writeAtomicNow(filePath, contents))
  queues.set(
    filePath,
    run.then(
      () => undefined,
      () => undefined,
    ),
  )
  return run
}

async function writeAtomicNow(filePath: string, contents: string): Promise<void> {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })

  try {
    await fs.access(filePath)
    await fs.copyFile(filePath, `${filePath}.bak`)
  } catch {
    // İlk kayıtta yedek yok.
  }

  const tmp = path.join(dir, `.${path.basename(filePath)}.${process.pid}.tmp`)
  await fs.writeFile(tmp, contents, 'utf8')
  try {
    await fs.copyFile(tmp, filePath)
  } finally {
    await fs.rm(tmp, { force: true })
  }
}

export function isReadOnlyFsError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  return code === 'EROFS' || code === 'EPERM' || code === 'EACCES' || code === 'ENOSPC'
}
