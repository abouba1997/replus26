import { initEdgeStore } from '@edgestore/server'
import {
  createEdgeStoreNextHandler,
  type CreateContextOptions,
} from '@edgestore/server/adapters/next/app'
import { initEdgeStoreClient } from '@edgestore/server/core'
import { z } from 'zod'
import { isReviewerAuthenticated } from '@/lib/auth'
import { isApplicationOpen } from '@/lib/deadline'
import { siteUrl } from '@/lib/env'

export const DOC_UPLOAD_MAX_BYTES = 10 * 1024 * 1024

type Context = {
  userId: string
  userRole: 'admin' | 'user'
}

async function createContext(_opts: CreateContextOptions): Promise<Context> {
  try {
    if (await isReviewerAuthenticated()) {
      return { userId: 'reviewer', userRole: 'admin' }
    }
  } catch {
    /* guest upload context */
  }
  return { userId: 'applicant', userRole: 'user' }
}

const es = initEdgeStore.context<Context>().create()

const edgeStoreRouter = es.router({
  applicationDocs: es
    .fileBucket({
      maxSize: DOC_UPLOAD_MAX_BYTES,
      accept: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    })
    .input(z.object({ kind: z.enum(['passport', 'bank', 'nina']) }))
    .path(({ input }) => [{ kind: input.kind }])
    .beforeUpload(() => isApplicationOpen())
    .beforeDelete(() => true),
})

export const handler = createEdgeStoreNextHandler({
  router: edgeStoreRouter,
  createContext,
})

export type EdgeStoreRouter = typeof edgeStoreRouter

export const backendClient = initEdgeStoreClient({
  router: edgeStoreRouter,
  baseUrl: `${siteUrl()}/api/edgestore`,
})

export function isEdgeStoreUrl(url: string) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.edgestore.dev')
  } catch {
    return false
  }
}

export async function confirmApplicationDocs(urls: string[]) {
  for (const url of urls) {
    await backendClient.applicationDocs.confirmUpload({ url })
  }
}

export async function deleteApplicationDocs(urls: string[]) {
  await Promise.all(
    urls.map((url) => backendClient.applicationDocs.deleteFile({ url }).catch(() => null)),
  )
}
