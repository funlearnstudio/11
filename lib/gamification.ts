import { User } from '@/models/User';
import { Achievement } from '@/models/Learning';

function taipeiDateKey(date:Date){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(date);
}
function yesterdayKey(){const d=new Date(Date.now()-86400000);return taipeiDateKey(d)}
function levelForXp(xp:number){return Math.max(1,Math.floor(Math.sqrt(Math.max(0,xp)/100))+1)}

const achievementCatalog={
  'first-steps':{title:'First Steps',description:'Earn your first 10 XP.'},
  'xp-100':{title:'100 XP',description:'Earn 100 total XP.'},
  'xp-500':{title:'500 XP',description:'Earn 500 total XP.'},
  'streak-7':{title:'Seven-Day Streak',description:'Study on seven consecutive days.'},
  'streak-30':{title:'Thirty-Day Streak',description:'Study on thirty consecutive days.'}
} as const;

type AchievementKey=keyof typeof achievementCatalog;

export async function awardXp(userId:string,amount:number){
  const gain=Math.max(0,Math.min(500,Math.floor(amount)));
  const user:any=await User.findById(userId);
  if(!user)return null;
  const today=taipeiDateKey(new Date());
  const previous=user.lastStudyDate?taipeiDateKey(new Date(user.lastStudyDate)):null;
  if(previous!==today){
    user.streak=previous===yesterdayKey()?Math.max(1,(user.streak||0)+1):1;
    user.lastStudyDate=new Date();
  }
  user.xp=Math.max(0,(user.xp||0)+gain);
  user.level=levelForXp(user.xp);
  await user.save();
  const unlock:AchievementKey[]=[];
  if(user.xp>=10)unlock.push('first-steps');
  if(user.xp>=100)unlock.push('xp-100');
  if(user.xp>=500)unlock.push('xp-500');
  if(user.streak>=7)unlock.push('streak-7');
  if(user.streak>=30)unlock.push('streak-30');
  for(const key of unlock){const item=achievementCatalog[key];await Achievement.updateOne({userId,key},{$setOnInsert:{userId,key,title:item.title,description:item.description,unlockedAt:new Date()}},{upsert:true});}
  return {xp:user.xp,level:user.level,streak:user.streak,earned:gain};
}
