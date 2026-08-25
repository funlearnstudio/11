import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Question,ExamAttempt } from '@/models/Learning';

export const dynamic='force-dynamic';
const vocabTypes=['en-zh','zh-en','definition','spelling','fill','context','cloze','sentence-completion'];

function ExamCard({name,type,count,description,showLevel=false,defaultCount=20}:{name:string;type:string;count:number;description:string;showLevel?:boolean;defaultCount?:number}){
  return <article className="card"><h2>{name}</h2><p>{description}</p><p className="muted">{count.toLocaleString()} published questions currently available</p>{count?<form action="/exams/start" className="exam-config"><input type="hidden" name="type" value={type}/><label>Questions<select className="select" name="count" defaultValue={Math.min(defaultCount,count)}>{[10,20,30,40,50].filter(n=>n<=Math.max(10,count)).map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Difficulty<select className="select" name="difficulty" defaultValue="0"><option value="0">Mixed</option>{[1,2,3,4,5].map(n=><option value={n} key={n}>Difficulty {n}</option>)}</select></label>{showLevel?<label>CEEC Level<select className="select" name="level" defaultValue="0"><option value="0">All levels</option>{[1,2,3,4,5,6].map(n=><option value={n} key={n}>Level {n}</option>)}</select></label>:null}<button className="btn primary">Start exam</button></form>:<p className="muted">尚無足夠已驗證題目。</p>}</article>;
}

export default async function ExamsPage(){
  const session=await auth();if(!session?.user)redirect('/login');const userId=(session.user as any).id;await dbConnect();
  const [vocabulary,grammar,reading,listening,all,attempts]=await Promise.all([
    Question.countDocuments({published:true,type:{$in:vocabTypes}}),Question.countDocuments({published:true,type:{$in:['grammar','error-correction','sentence-completion']}}),Question.countDocuments({published:true,type:{$in:['reading','cloze']}}),Question.countDocuments({published:true,type:'listening'}),Question.countDocuments({published:true}),ExamAttempt.countDocuments({userId,completedAt:{$exists:true}})
  ]);
  return <main className="content"><p className="muted">Testing & assessment</p><h1>Exam Center</h1><p>所有考卷只從 <strong>published</strong> 題庫動態抽題；資料不足時縮減題數或拒絕建立，不會生成假題。</p><div className="grid"><ExamCard name="Vocabulary Exam" type="vocabulary" count={vocabulary} showLevel description="依 CEEC Level、題數與難度測驗詞彙。"/><ExamCard name="Grammar Exam" type="grammar" count={grammar} description="從已發布文法、句型與錯誤訂正題抽題。"/><ExamCard name="Reading Exam" type="reading" count={reading} description="閱讀理解與克漏字題型。"/><ExamCard name="Listening Exam" type="listening" count={listening} description="使用已驗證 listening question bank。"/><ExamCard name="Mixed Exam" type="mixed" count={all} description="Vocabulary、Grammar、Reading、Listening 混合。"/><ExamCard name="Mock Exam" type="mock" count={all} defaultCount={40} description="使用目前完整 published 題庫建立較長的綜合模擬測驗；結果提供題型分析與複習建議。"/></div><div className="card" style={{marginTop:16}}><strong>Completed exams:</strong> {attempts}</div></main>;
}
