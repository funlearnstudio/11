import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit, sameOrigin } from '@/lib/security';

export const runtime='nodejs';

export async function POST(req:Request){
  if(!sameOrigin(req))return NextResponse.json({error:'Cross-origin request blocked'},{status:403});
  const endpoint=process.env.TTS_PROVIDER_URL;const key=process.env.TTS_API_KEY;
  if(!endpoint||!key)return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}});
  const session=await auth();if(!session?.user)return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}});
  let provider:URL;try{provider=new URL(endpoint);if(!['https:','http:'].includes(provider.protocol))throw new Error('invalid')}catch{return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}})}
  const limited=await rateLimit(req,'tts',40,60);if(!limited.allowed)return NextResponse.json({error:'Too many TTS requests'},{status:429,headers:{'Retry-After':String(limited.retryAfterSeconds)}});
  const body=await req.json().catch(()=>({}));const text=typeof body.text==='string'?body.text.trim():'';const locale=body.locale==='en-GB'?'en-GB':'en-US';const speed=Math.max(.5,Math.min(2,Number(body.speed)||1));if(!text||text.length>5000)return NextResponse.json({error:'Invalid TTS text'},{status:400});
  try{const upstream=await fetch(provider,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Accept':'audio/mpeg,audio/*'},body:JSON.stringify({text,locale,speed}),signal:AbortSignal.timeout(15_000)});if(!upstream.ok)return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}});const type=upstream.headers.get('content-type')||'audio/mpeg';if(!type.startsWith('audio/'))return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}});return new NextResponse(await upstream.arrayBuffer(),{status:200,headers:{'Content-Type':type,'Cache-Control':'private, max-age=300'}})}catch{return new NextResponse(null,{status:204,headers:{'X-Lexora-TTS':'browser-fallback'}})}
}
