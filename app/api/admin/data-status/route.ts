import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Vocabulary } from '@/models/Vocabulary';
import { ImportRun } from '@/models/ContentOps';

const SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';

export async function GET(){
  const s=await auth();if((s?.user as any)?.role!=='admin')return NextResponse.json({error:'Forbidden'},{status:403});
  await dbConnect();
  const [total,published,official,missingZh,missingEn,missingIpa,missingExamples,missingCollocations,missingMorphology,drafts,latestRuns]=await Promise.all([
    Vocabulary.countDocuments(),Vocabulary.countDocuments({published:true}),Vocabulary.countDocuments({source:SOURCE}),Vocabulary.countDocuments({published:true,'zhTWDefinitions.0':{$exists:false}}),Vocabulary.countDocuments({published:true,'englishDefinitions.0':{$exists:false}}),Vocabulary.countDocuments({published:true,$or:[{ipa:{$exists:false}},{ipa:''}]}),Vocabulary.countDocuments({published:true,'examples.0':{$exists:false}}),Vocabulary.countDocuments({published:true,'collocations.0':{$exists:false}}),Vocabulary.countDocuments({published:true,'morphology.0':{$exists:false}}),Vocabulary.countDocuments({published:false}),ImportRun.find({kind:'ceec-vocabulary'}).sort({startedAt:-1}).limit(10).lean()
  ]);
  return NextResponse.json({counts:{total,published,official,drafts},missing:{zhTWDefinitions:missingZh,englishDefinitions:missingEn,ipa:missingIpa,examples:missingExamples,collocations:missingCollocations,morphology:missingMorphology},latestRuns});
}
