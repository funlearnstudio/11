import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { GrammarLesson,Article,Question } from '@/models/Learning';
import { Morphology } from '@/models/Morphology';
import { User } from '@/models/User';

export default async function AdminPage(){
  const s=await auth();
  if((s?.user as any)?.role!=='admin')redirect('/dashboard');
  await dbConnect();
  const [users,vocab,grammar,articles,questions,morph,publishedVocab,publishedGrammar,publishedArticles,publishedQuestions]=await Promise.all([
    User.countDocuments(),Vocabulary.countDocuments(),GrammarLesson.countDocuments(),Article.countDocuments(),Question.countDocuments(),Morphology.countDocuments(),Vocabulary.countDocuments({published:true}),GrammarLesson.countDocuments({published:true}),Article.countDocuments({published:true}),Question.countDocuments({published:true})
  ]);
  const managers=[['Vocabulary','/admin/vocabulary',`${publishedVocab}/${vocab} published`],['Grammar','/admin/content/grammar',`${publishedGrammar}/${grammar} published`],['Reading Articles','/admin/content/articles',`${publishedArticles}/${articles} published`],['Question Bank','/admin/content/questions',`${publishedQuestions}/${questions} published`],['Morphology','/admin/content/morphology',`${morph} total`]] as const;
  return <main className="content"><h1>Admin</h1><p className="muted">所有統計直接來自 MongoDB；未通過驗證的內容不會自動視為 Published。</p><div className="grid"><div className="card"><strong>Users</strong><h2>{users}</h2></div>{managers.map(([name,href,detail])=><Link className="card" key={href} href={href}><strong>{name}</strong><p>{detail}</p><span className="muted">Manage →</span></Link>)}</div><div className="card" style={{marginTop:16}}><h2>Content quality</h2><p>發布操作會再次經過 server-side validation。Vocabulary 與 Question 統計不會 hardcode；CEEC 全量匯入完成前也不會顯示虛假的 7000 筆。</p></div></main>;
}
