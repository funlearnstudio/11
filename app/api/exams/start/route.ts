import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Question } from '@/models/Learning';
export async function GET(req:Request){const s=await auth(); if(!s?.user)return NextResponse.json({error:'Unauthorized'},{status:401}); const u=new URL(req.url); const type=u.searchParams.get('type')||'mixed'; const count=Math.max(5,Math.min(50,Number(u.searchParams.get('count'))||20)); await dbConnect(); const map:any={vocabulary:['en-zh','zh-en','definition','spelling','fill','context'],grammar:['grammar'],reading:['reading']}; const match:any={published:true}; if(type!=='mixed') match.type={$in:map[type]||[]}; const questions=await Question.aggregate([{$match:match},{$sample:{size:count}},{$project:{question:1,options:1,type:1,difficulty:1}}]); return NextResponse.json({questions});}
