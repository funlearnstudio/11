import PracticeRunner from '@/components/PracticeRunner';

export default async function PracticePage({searchParams}:{searchParams:Promise<{type?:string}>}){
  const {type='mixed'}=await searchParams;
  const modes=[['Mixed','mixed'],['Vocabulary','context'],['Grammar','grammar'],['Reading','reading'],['Listening','listening'],['Cloze','cloze'],['Error Correction','error-correction']] as const;
  return <main className="content"><h1>Practice</h1><p className="muted">題目只從已發布、已驗證的 Question collection 取得；作答錯誤會自動進錯題本。</p><div className="toolbar">{modes.map(([label,value])=><a className="btn" key={value} href={`/practice?type=${value}`}>{label}</a>)}</div><PracticeRunner type={type}/></main>;
}
