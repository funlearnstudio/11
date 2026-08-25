import { dbConnect } from '../lib/db';
import { Vocabulary } from '../models/Vocabulary';

const OFFICIAL_SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';

function fail(message:string):never{throw new Error(message)}

async function main(){
  await dbConnect();
  const total=await Vocabulary.countDocuments();
  const published=await Vocabulary.countDocuments({published:true});
  const invalidLevel=await Vocabulary.countDocuments({$or:[{ceecLevel:{$lt:1}},{ceecLevel:{$gt:6}}]});
  const missingZh=await Vocabulary.countDocuments({$or:[{zhTWDefinitions:{$exists:false}},{zhTWDefinitions:{$size:0}}]});
  const missingEn=await Vocabulary.countDocuments({$or:[{englishDefinitions:{$exists:false}},{englishDefinitions:{$size:0}}]});
  const sourceMismatch=await Vocabulary.countDocuments({source:{$ne:OFFICIAL_SOURCE}});
  const duplicates=await Vocabulary.aggregate([{$group:{_id:{word:'$word',level:'$ceecLevel'},count:{$sum:1}}},{$match:{count:{$gt:1}}}]);
  const report={total,published,invalidLevel,missingZh,missingEn,sourceMismatch,duplicates:duplicates.length};
  console.table(report);
  if(invalidLevel||missingZh||missingEn||duplicates.length) fail('Vocabulary validation failed. Nothing should be marked complete until these errors are fixed.');
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
