import './globals.css';
import type { Metadata } from 'next';
import GlobalSearch from '@/components/GlobalSearch';
import AppNav from '@/components/AppNav';
import ThemeBoot from '@/components/ThemeBoot';

export const metadata: Metadata = {
  title: { default: 'Lexora — Taiwan High School English', template: '%s | Lexora' },
  description: '台灣高中英文學習平台：CEEC 高中核心詞彙、智慧間隔複習、文法、閱讀、聽力、字根、辭典、題庫、遊戲、考試與學習進度。',
  applicationName: 'Lexora',
  icons: { icon: '/favicon.svg', apple: '/app-icon.svg' },
  manifest: '/manifest.webmanifest',
  keywords: ['台灣高中英文','學測英文','CEEC vocabulary','高中7000單字','英文文法','英文閱讀','spaced repetition']
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh-Hant"><body><ThemeBoot/><AppNav/>{children}<GlobalSearch/></body></html>;
}
