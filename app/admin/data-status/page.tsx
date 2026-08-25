import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { ImportRun } from '@/models/ContentOps';

const SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';
export const dynamic='force-dynamic';

export default async function AdminDataStatusPage(){
  const s=await auth();if((s?.user as any)?.role!=='admin')redirect('/dashboard');await dbConnect();
  const [total,published,official,drafts,missingIpa,missingExamples,missingCollocations,missingMorphology,runs]=await Promise.all([
    Vocabulary.countDocuments(),Vocabulary.countDocuments({published:true}),Vocabulary.countDocuments({source:SOURCE}),Vocabulary.countDocuments({published:false}),Vocabulary.countDocuments({published:true,$or:[{ipa:{$exists:false}},{ipa:''}]}),Vocabulary.countDocuments({published:true,'examples.0':{$exists:false}}),Vocabulary.countDocuments({published:true,'collocations.0':{$exists:false}}),Vocabulary.countDocuments({published:true,'morphology.0':{$exists:false}}),ImportRun.find({kind:'ceec-vocabulary'}).sort({startedAt:-1}).limit(10).lean() as Promise<any[]>
  ]);
  return <main className="content"><h1>Admin · Data Status</h1><p className="muted">所有數字直接查 MongoDB。沒有任何地方 hardcode「7000 loaded」。</p><div className="grid"><div className="card"><strong>Total vocabulary</strong><h2>{total}</h2></div><div className="card"><strong>Published</strong><h2>{published}</h2></div><div className="card"><strong>Official-source rows</strong><h2>{official}</h2></div><div className="card"><strong>Drafts</strong><h2>{drafts}</h2></div><div className="card"><strong>Missing IPA</strong><h2>{missingIpa}</h2></div><div className="card"><strong>Missing examples</strong><h2>{missingExamples}</h2></div><div className="card"><strong>Missing collocations</strong><h2>{missingCollocations}</h2></div><div className="card"><strong>No morphology analysis</strong><h2>{missingMorphology}</h2><p className="muted">不一定是錯誤；有些字本來就不適合硬拆。</p></div></div><section style={{marginTop:20}}><h2>CEEC import runs</h2>{runs.length?<div className="list">{runs.map(run=><div className="card" key={String(run._id)}><div className="toolbar"><strong>{run.status}</strong><span>{run.sourceEdition}</span><span className="muted">{run.startedAt?new Date(run.startedAt).toLocaleString('zh-TW'):''}</span></div><p>Input {run.inputCount} · Imported {run.importedCount} · Published {run.publishedCount} · Validation errors {run.validationErrorCount}</p>{run.missingFields?<pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(run.missingFields,null,2)}</pre>:null}</div>)}</div>:<div className="card">尚未有正式 CEEC import run。這代表系統不會冒充「官方詞庫已完成」。</div>}</section></main>;
}
