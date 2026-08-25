import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { GrammarLesson } from '@/models/Learning';
import { SpeakButton } from '@/components/SpeakButton';
import CompleteContentButton from '@/components/CompleteContentButton';

export const dynamic='force-dynamic';

export default async function GrammarLessonPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  await dbConnect();
  const lesson:any=await GrammarLesson.findOne({slug,published:true}).lean();
  if(!lesson)notFound();
  return <main className="content"><p className="muted">Grammar · {lesson.level}</p><h1>{lesson.title}</h1><section className="card"><h2>中文說明</h2><p>{lesson.zhExplanation}</p></section>{lesson.useCases?.length>0&&<section><h2>使用情境</h2><ul>{lesson.useCases.map((item:string)=><li key={item}>{item}</li>)}</ul></section>}{lesson.structures?.length>0&&<section><h2>結構</h2><ul>{lesson.structures.map((item:string)=><li key={item}><code>{item}</code></li>)}</ul></section>}{lesson.examples?.length>0&&<section><h2>Examples</h2><div className="list">{lesson.examples.map((example:any,index:number)=><div className="card" key={index}><div><strong>{example.en}</strong> <SpeakButton text={example.en}/></div><p>{example.zhTW}</p></div>)}</div></section>}{lesson.commonErrors?.length>0&&<section><h2>常見錯誤</h2><div className="list">{lesson.commonErrors.map((error:any,index:number)=><div className="card" key={index}><p>✕ {error.wrong}</p><p>✓ {error.correct}</p><p className="muted">{error.explanation}</p></div>)}</div></section>}{lesson.notes?.length>0&&<section><h2>注意事項</h2><ul>{lesson.notes.map((note:string)=><li key={note}>{note}</li>)}</ul></section>}<CompleteContentButton kind="grammar" id={String(lesson._id)}/></main>;
}
