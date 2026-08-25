export const DOC_KINDS = ['passport', 'bank', 'nina'] as const
export type DocKind = (typeof DOC_KINDS)[number]

export function isDocKind(value: string): value is DocKind {
  return DOC_KINDS.includes(value as DocKind)
}

