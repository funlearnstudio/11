import fs from 'node:fs/promises';
import path from 'node:path';
import { dbConnect } from '../lib/db';
import { Vocabulary } from '../models/Vocabulary';

const OFFICIAL_SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';
const input=process.argv[2]||'data/ceec/normalized.json';

type Row={word:string;lemma:string;partsOfSpeech:string[];ceecLevel:number;zhTWDefinitions:string[];englishDefinitions:string[];sourceEdition:string;pronunciation?:string;ipa?:string};

function validate(rows:Row[]){
  const seen=new Set<string>();
  const errors:string[]=[];
  for(const [i,row] of rows.entries()){
    if(!row.word?.trim()) errors.push(`#${i+1} missing word`);
    if(!Number.isInteger(row.ceecLevel)||row.ceecLevel<1||row.ceecLevel>6) errors.push(`${row.word||'#'+(i+1)} invalid level`);
    if(!row.partsOfSpeech?.length) errors.push(`${row.word} missing POS`);
    if(!row.zhTWDefinitions?.length) errors.push(`${row.word} missing zh-TW definition`);
    if(!row.englishDefinitions?.length) errors.push(`${row.word} missing English definition`);
    const key=`${row.word.toLowerCase()}::${row.ceecLevel}`;
    if(seen.has(key)) errors.push(`${row.word} duplicate at level ${row.ceecLevel}`); else seen.add(key);
  }
  return errors;
}

async function main(){
  const file=path.resolve(input);
  const rows=JSON.parse(await fs.readFile(file,'utf8')) as Row[];
  const errors=validate(rows);
  if(errors.length){ console.error(errors.slice(0,100).join('\n')); throw new Error(`Import rejected: ${errors.length} validation errors`); }
  await dbConnect();
  let imported=0;
  for(const row of rows){
    await Vocabulary.updateOne(
      {word:row.word,ceecLevel:row.ceecLevel},
      {$set:{...row,source:OFFICIAL_SOURCE,sourceVerifiedAt:new Date(),published:true}},
      {upsert:true}
    );
    imported++;
  }
  const dbCount=await Vocabulary.countDocuments({source:OFFICIAL_SOURCE,published:true});
  console.log(JSON.stringify({input:file,imported,officialPublishedInDatabase:dbCount},null,2));
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
