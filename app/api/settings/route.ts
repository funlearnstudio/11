import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { User } from '@/models/User';
import { sameOrigin } from '@/lib/security';
import { z } from 'zod';

const schema=z.object({theme:z.enum(['light','dark','system']),pronunciation:z.enum(['US','UK']),ttsSpeed:z.number().min(.5).max(2),dailyNewWordGoal:z.number().int().min(1).max(100),dailyReviewGoal:z.number().int().min(1).max(300),soundEffects:z.boolean(),reducedMotion:z.boolean()});
export async function GET(){const s=await auth();const id=(s?.user as any)?.id;if(!id)return NextResponse.json({error:'Unauthorized'},{status:401});await dbConnect();const user:any=await User.findById(id).select('settings').lean();if(!user)return NextResponse.json({error:'User not found'},{status:404});return NextResponse.json({settings:user.settings||{}});}
export async function PUT(req:Request){if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});const s=await auth();const id=(s?.user as any)?.id;if(!id)return NextResponse.json({error:'Unauthorized'},{status:401});const body=await req.json().catch(()=>null);const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:'Invalid settings',issues:parsed.error.issues},{status:400});await dbConnect();const user:any=await User.findByIdAndUpdate(id,{$set:{settings:parsed.data}},{new:true}).select('settings').lean();if(!user)return NextResponse.json({error:'User not found'},{status:404});return NextResponse.json({ok:true,settings:user.settings||parsed.data});}
