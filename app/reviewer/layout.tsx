import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace de sélection — RE+ Mali',
  robots: { index: false, follow: false },
}

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return children
}
