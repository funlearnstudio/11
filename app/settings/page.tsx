import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import SettingsForm from '@/components/SettingsForm';

type SettingsDoc={settings?:{theme:'light'|'dark'|'system';pronunciation:'US'|'UK';ttsSpeed:number;dailyNewWordGoal:number;dailyReviewGoal:number;soundEffects:boolean;reducedMotion:boolean}};

export default async function SettingsPage(){
  const s=await auth();
  if(!s?.user)redirect('/login');
  await dbConnect();
  const u=await User.findById((s.user as any).id).select('settings').lean() as SettingsDoc|null;
  const fallback={theme:'system' as const,pronunciation:'US' as const,ttsSpeed:1,dailyNewWordGoal:10,dailyReviewGoal:30,soundEffects:true,reducedMotion:false};
  return <main className="content"><h1>Settings</h1><SettingsForm initial={u?.settings||fallback}/></main>;
}
