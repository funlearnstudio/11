import './globals.css';
import type { Metadata } from 'next';
import GlobalSearch from '@/components/GlobalSearch';

export const metadata: Metadata = {
  title: { default: 'Lexora — Taiwan High School English', template: '%s | Lexora' },
  description: 'A serious English learning platform for Taiwan high school students: CEEC vocabulary, spaced review, grammar, reading, listening, exams, games, and progress tracking.',
  applicationName: 'Lexora',
  icons: { icon: '/favicon.svg', apple: '/app-icon.svg' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body>{children}<GlobalSearch/></body></html>;
}
