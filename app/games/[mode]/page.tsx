import GameRunner from '@/components/GameRunner';
export default async function GamePage({params}:{params:Promise<{mode:string}>}){const {mode}=await params; return <main className="content"><h1>{mode.split('-').map(x=>x[0].toUpperCase()+x.slice(1)).join(' ')}</h1><GameRunner mode={mode}/></main>}
