import fs from 'node:fs/promises';
import path from 'node:path';
import { dbConnect } from '../lib/db';
import { Vocabulary } from '../models/Vocabulary';
import { ImportRun } from '../models/ContentOps';

const OFFICIAL_SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';
const OFFICIAL_PAGE='https://www.ceec.edu.tw/xmdoc?xsmsid=0K213553204833715309';
const input=process.argv[2]||'data/ceec/normalized.json';

type Row={word:string;lemma:string;partsOfSpeech:string[];ceecLevel:number;zhTWDefinitions:string[];englishDefinitions:string[];sourceEdition:string;pronunciation?:string;ipa?:string;examples?:{text:string;zhTW:string}[];collocations?:string[];morphology?:unknown[]};

function validate(rows:Row[]){
  const seen=new Set<string>();const errors:string[]=[];
  for(const [i,row] of rows.entries()){
    if(!row.word?.trim())errors.push(`#${i+1} missing word`);
    if(!row.lemma?.trim())errors.push(`${row.word||'#'+(i+1)} missing lemma`);
    if(!Number.isInteger(row.ceecLevel)||row.ceecLevel<1||row.ceecLevel>6)errors.push(`${row.word||'#'+(i+1)} invalid level`);
    if(!row.partsOfSpeech?.length)errors.push(`${row.word} missing POS`);
    if(!row.zhTWDefinitions?.length)errors.push(`${row.word} missing zh-TW definition`);
    if(!row.englishDefinitions?.length)errors.push(`${row.word} missing English definition`);
    if(!row.sourceEdition?.trim())errors.push(`${row.word} missing source edition`);
    const key=`${row.word.toLowerCase()}::${row.ceecLevel}`;if(seen.has(key))errors.push(`${row.word} duplicate at level ${row.ceecLevel}`);else seen.add(key);
  }
  return errors;
}

function missingReport(rows:Row[]){
  const fields=['ipa','pronunciation','examples','collocations','morphology'] as const;const result:Record<string,number>={};
  for(const field of fields)result[field]=rows.filter(row=>{const v=row[field];return Array.isArray(v)?v.length===0:!v}).length;
  return result;
}

async function main(){
  const file=path.resolve(input);const rows=JSON.parse(await fs.readFile(file,'utf8')) as Row[];await dbConnect();
  const edition=[...new Set(rows.map(r=>r.sourceEdition).filter(Boolean))].join(', ')||'111學年度起適用';
  const run=await ImportRun.create({kind:'ceec-vocabulary',sourceName:OFFICIAL_SOURCE,sourceUrl:OFFICIAL_PAGE,sourceEdition:edition,status:'running',inputCount:rows.length,missingFields:missingReport(rows)});
  try{
    const errors=validate(rows);if(errors.length){run.status='failed';run.validationErrorCount=errors.length;run.validationErrors=errors.slice(0,200);run.completedAt=new Date();await run.save();console.error(errors.slice(0,100).join('\n'));throw new Error(`Import rejected: ${errors.length} validation errors`);}
    let imported=0;
    for(const row of rows){await Vocabulary.updateOne({word:row.word,ceecLevel:row.ceecLevel},{$set:{...row,source:OFFICIAL_SOURCE,sourceVerifiedAt:new Date(),published:true}},{upsert:true});imported++;}
    const dbCount=await Vocabulary.countDocuments({source:OFFICIAL_SOURCE,published:true});run.status='completed';run.importedCount=imported;run.publishedCount=dbCount;run.completedAt=new Date();await run.save();console.log(JSON.stringify({runId:String(run._id),input:file,imported,officialPublishedInDatabase:dbCount,missingFields:run.missingFields},null,2));
  }catch(error){if(run.status==='running'){run.status='failed';run.completedAt=new Date();await run.save();}throw error;}
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
