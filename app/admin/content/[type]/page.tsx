import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminContentManager from '@/components/AdminContentManager';

const allowed=['grammar','articles','questions','morphology'] as const;
type Allowed=typeof allowed[number];

export default async function AdminContentPage({params}:{params:Promise<{type:string}>}){
  const s=await auth();
  if((s?.user as any)?.role!=='admin')redirect('/dashboard');
  const {type}=await params;
  if(!allowed.includes(type as Allowed))notFound();
  const title:Record<Allowed,string>={grammar:'Grammar',articles:'Reading Articles',questions:'Question Bank',morphology:'Prefixes · Roots · Suffixes'};
  return <main className="content"><h1>Admin · {title[type as Allowed]}</h1><p className="muted">只有通過 server-side 必要欄位驗證的內容才能發布。</p><AdminContentManager type={type as Allowed}/></main>;
}
