import {redirect} from 'next/navigation';
import {Types} from 'mongoose';
import {auth} from '@/auth';
import {dbConnect} from '@/lib/db';
import {VocabularyProgress} from '@/models/VocabularyProgress';
import {GrammarProgress,ReadingProgress,ExamAttempt,StudySession,GameResult} from '@/models/Learning';

export const dynamic='force-dynamic';
const dayKey=(d:Date)=>d.toISOString().slice(0,10);

export default async function ProgressPage(){
  const session=await auth();if(!session?.user)redirect('/login');const userId=(session.user as any).id;await dbConnect();const oid=new Types.ObjectId(userId);const since=new Date();since.setUTCHours(0,0,0,0);since.setUTCDate(since.getUTCDate()-6);
  const [learned,mastered,grammarCompleted,readingCompleted,exams,games,studyAgg,days,activity,masteryBuckets,examTrend]=await Promise.all([
    VocabularyProgress.countDocuments({userId,status:{$ne:'unseen'}}),VocabularyProgress.countDocuments({userId,status:'mastered'}),GrammarProgress.countDocuments({userId,status:{$in:['completed','mastered']}}),ReadingProgress.countDocuments({userId,completedAt:{$ne:null}}),ExamAttempt.countDocuments({userId,completedAt:{$ne:null}}),GameResult.countDocuments({userId}),
    StudySession.aggregate([{$match:{userId:oid}},{$group:{_id:null,seconds:{$sum:'$durationSeconds'},correct:{$sum:'$correctCount'},wrong:{$sum:'$wrongCount'}}}]),
    StudySession.aggregate([{$match:{userId:oid,startedAt:{$gte:since}}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$startedAt'}},seconds:{$sum:'$durationSeconds'},correct:{$sum:'$correctCount'},wrong:{$sum:'$wrongCount'}}},{$sort:{_id:1}}]),
    StudySession.aggregate([{$match:{userId:oid}},{$group:{_id:'$activity',seconds:{$sum:'$durationSeconds'}}},{$sort:{seconds:-1}}]),
    VocabularyProgress.aggregate([{$match:{userId:oid}},{$bucket:{groupBy:'$mastery',boundaries:[0,25,50,75,85,101],default:'other',output:{count:{$sum:1}}}}]),
    ExamAttempt.find({userId,completedAt:{$gte:since}}).select('accuracy completedAt').sort({completedAt:1}).lean()
  ]);
  const study=studyAgg[0]||{seconds:0,correct:0,wrong:0};const totalAnswers=study.correct+study.wrong;const accuracy=totalAnswers?Math.round(study.correct/totalAnswers*100):0;
  const dayMap=new Map(days.map((x:any)=>[x._id,x]));const seven=Array.from({length:7},(_,i)=>{const d=new Date(since);d.setUTCDate(since.getUTCDate()+i);const key=dayKey(d);const x:any=dayMap.get(key)||{};const total=(x.correct||0)+(x.wrong||0);return{key,label:d.toLocaleDateString('zh-TW',{weekday:'short',timeZone:'UTC'}),minutes:Math.round((x.seconds||0)/60),accuracy:total?Math.round((x.correct||0)/total*100):0}});const maxMinutes=Math.max(1,...seven.map(x=>x.minutes));
  const masteryLabels:Record<string,string>={'0':'0–24%','25':'25–49%','50':'50–74%','75':'75–84%','85':'85–100%'};const masteryTotal=Math.max(1,masteryBuckets.reduce((s:number,x:any)=>s+x.count,0));const activityTotal=Math.max(1,activity.reduce((s:number,x:any)=>s+x.seconds,0));
  return <main className="content"><p className="muted">Analytics</p><h1>Progress</h1><p className="muted">所有統計與圖表直接由你的 MongoDB 學習紀錄計算，不使用假數字。</p><div className="grid stats-grid"><div className="card"><span className="muted">Learned vocabulary</span><h2>{learned}</h2></div><div className="card"><span className="muted">Mastered vocabulary</span><h2>{mastered}</h2></div><div className="card"><span className="muted">Grammar completed</span><h2>{grammarCompleted}</h2></div><div className="card"><span className="muted">Reading completed</span><h2>{readingCompleted}</h2></div><div className="card"><span className="muted">Exams / Games</span><h2>{exams} / {games}</h2></div><div className="card"><span className="muted">Study time</span><h2>{Math.round(study.seconds/60)} min</h2></div><div className="card"><span className="muted">Recorded accuracy</span><h2>{accuracy}%</h2></div></div>
  <section className="card chart-card"><h2>7-day activity</h2><div className="bar-chart">{seven.map(x=><div className="bar-column" key={x.key}><div className="bar-value">{x.minutes}m</div><div className="bar" style={{height:`${Math.max(4,x.minutes/maxMinutes*150)}px`}}/><small>{x.label}</small></div>)}</div></section>
  <div className="grid two-col"><section className="card"><h2>Vocabulary mastery</h2>{masteryBuckets.length?masteryBuckets.map((x:any)=><div key={String(x._id)} className="metric-row"><div className="toolbar" style={{justifyContent:'space-between'}}><span>{masteryLabels[String(x._id)]||String(x._id)}</span><strong>{x.count}</strong></div><progress max="100" value={Math.round(x.count/masteryTotal*100)}/></div>):<p className="muted">還沒有單字熟練度紀錄。</p>}</section><section className="card"><h2>Study distribution</h2>{activity.length?activity.map((x:any)=><div key={String(x._id)} className="metric-row"><div className="toolbar" style={{justifyContent:'space-between'}}><span>{x._id}</span><strong>{Math.round(x.seconds/60)}m</strong></div><progress max="100" value={Math.round(x.seconds/activityTotal*100)}/></div>):<p className="muted">還沒有學習 session。</p>}</section></div>
  <section className="card"><h2>Accuracy trend</h2><div className="trend-row">{seven.map(x=><div key={x.key} className="trend-point"><strong>{x.accuracy}%</strong><small>{x.label}</small></div>)}</div>{examTrend.length?<p className="muted">本週另有 {examTrend.length} 次考試紀錄；最新考試 accuracy 為 {Number((examTrend[examTrend.length-1] as any).accuracy||0)}%。</p>:<p className="muted">本週沒有考試紀錄。</p>}</section></main>;
}
