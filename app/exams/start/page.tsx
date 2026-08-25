import ExamRunner from '@/components/ExamRunner';

export default async function StartExam({searchParams}:{searchParams:Promise<{type?:string;count?:string;difficulty?:string;level?:string}>}){
  const p=await searchParams;const type=p.type||'mixed';const count=Math.max(5,Math.min(60,Number(p.count)||20));const difficulty=Math.max(0,Math.min(5,Number(p.difficulty)||0));const level=Math.max(0,Math.min(6,Number(p.level)||0));
  return <main className="content"><p className="muted">Exam Center</p><h1>{type==='mock'?'Mock':type[0].toUpperCase()+type.slice(1)} Exam</h1><ExamRunner type={type} count={count} difficulty={difficulty} level={level}/></main>;
}
