import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminVocabularyEditor from '@/components/AdminVocabularyEditor';

export default async function AdminVocabularyPage(){
  const s=await auth();
  if((s?.user as any)?.role!=='admin')redirect('/dashboard');
  return <main className="content"><h1>Admin · Vocabulary</h1><p className="muted">搜尋、檢查並發布詞彙。發布時 API 會再次執行必要欄位驗證。</p><AdminVocabularyEditor/></main>;
}
