import Link from 'next/link';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Article } from '@/models/Learning';
import { VocabularyProgress } from '@/models/VocabularyProgress';

export const dynamic='force-dynamic';

export default async function ReadingPage({searchParams}:{searchParams:Promise<{category?:string;difficulty?:string}>}){
  const query=await searchParams;const session=await auth();await dbConnect();const filter:any={published:true};if(query.category)filter.category=query.category;if(query.difficulty&&/^[1-5]$/.test(query.difficulty))filter.difficulty=Number(query.difficulty);
  const articles=await Article.find(filter).select('slug title category difficulty estimatedReadingMinutes wordCount vocabularyCoverage targetVocabularyIds').sort({createdAt:-1}).limit(60).lean();
  let recommended:any[]=[];const userId=(session?.user as any)?.id;
  if(userId){const targets:any[]=await VocabularyProgress.find({userId,$or:[{nextReviewAt:{$lte:new Date(Date.now()+3*86400000)}},{mastery:{$lt:60},reviewCount:{$gt:0}}]}).sort({nextReviewAt:1,mastery:1}).select('vocabularyId').limit(100).lean();const ids=targets.map(x=>x.vocabularyId);if(ids.length)recommended=await Article.find({published:true,targetVocabularyIds:{$in:ids}}).select('slug title category difficulty estimatedReadingMinutes targetVocabularyIds').limit(6).lean();}
  return <main className="content"><h1>Reading</h1><p className="muted">依難度、主題與已學字彙閱讀真正發布的文章。</p>{recommended.length?<section><h2>Recommended for your vocabulary</h2><p className="muted">優先包含你近期到期或熟練度較低的單字。</p><div className="grid">{recommended.map((a:any)=><Link className="card" key={String(a._id)} href={`/reading/${a.slug}`}><p className="muted">{a.category} · Difficulty {a.difficulty}</p><h3>{a.title}</h3><p>{a.estimatedReadingMinutes?`${a.estimatedReadingMinutes} min`:'Reading'}</p></Link>)}</div></section>:null}<form className="toolbar"><input className="input" name="category" defaultValue={query.category||''} placeholder="Category" aria-label="Reading category"/><select className="select" name="difficulty" defaultValue={query.difficulty||''} aria-label="Difficulty"><option value="">All difficulties</option>{[1,2,3,4,5].map(level=><option value={level} key={level}>Difficulty {level}</option>)}</select><button className="btn" type="submit">Filter</button></form>{articles.length===0?<div className="card"><h2>目前沒有符合條件的已發布文章</h2><p>只會顯示已驗證並發布的正式閱讀內容。</p></div>:<div className="grid">{articles.map((article:any)=><Link className="card" href={`/reading/${article.slug}`} key={String(article._id)}><p className="muted">{article.category} · Difficulty {article.difficulty}</p><h2>{article.title}</h2><p>{article.estimatedReadingMinutes?`${article.estimatedReadingMinutes} min`:'Reading'}{article.wordCount?` · ${article.wordCount} words`:''}</p></Link>)}</div>}</main>;
}
