import {dbConnect} from '../lib/db';
import {Vocabulary} from '../models/Vocabulary';
import {GrammarLesson,Article,Question} from '../models/Learning';
import {Morphology} from '../models/Morphology';

const OFFICIAL_SOURCE='CEEC 高中英文參考詞彙表－111學年度起適用－';
const placeholder=/\b(lorem ipsum|word \d+|sample question|option [a-d]|vocabulary example)\b/i;
function fail(message:string):never{throw new Error(message)}

async function main(){
  await dbConnect();
  const [total,published,invalidLevel,missingZh,missingEn,missingPos,sourceMismatch,duplicates,publishedGrammar,publishedArticles,publishedQuestions,publishedMorphology]=await Promise.all([
    Vocabulary.countDocuments(),Vocabulary.countDocuments({published:true}),Vocabulary.countDocuments({$or:[{ceecLevel:{$lt:1}},{ceecLevel:{$gt:6}}]}),Vocabulary.countDocuments({published:true,$or:[{zhTWDefinitions:{$exists:false}},{zhTWDefinitions:{$size:0}}]}),Vocabulary.countDocuments({published:true,$or:[{englishDefinitions:{$exists:false}},{englishDefinitions:{$size:0}}]}),Vocabulary.countDocuments({published:true,$or:[{partsOfSpeech:{$exists:false}},{partsOfSpeech:{$size:0}}]}),Vocabulary.countDocuments({source:{$ne:OFFICIAL_SOURCE}}),Vocabulary.aggregate([{$group:{_id:{word:'$word',level:'$ceecLevel'},count:{$sum:1}}},{$match:{count:{$gt:1}}}]),GrammarLesson.find({published:true}).lean(),Article.find({published:true}).lean(),Question.find({published:true}).lean(),Morphology.find({published:true}).lean()
  ]);
  const errors:string[]=[];
  if(invalidLevel)errors.push(`${invalidLevel} vocabulary records have invalid CEEC level`);if(missingZh)errors.push(`${missingZh} published vocabulary records miss zh-TW definitions`);if(missingEn)errors.push(`${missingEn} published vocabulary records miss English definitions`);if(missingPos)errors.push(`${missingPos} published vocabulary records miss POS`);if(duplicates.length)errors.push(`${duplicates.length} duplicate word+level groups`);
  for(const g of publishedGrammar as any[]){if(!g.title||!g.slug||!g.zhExplanation||!g.examples?.length)errors.push(`grammar ${g.slug||g._id} lacks required published content`);if(placeholder.test(`${g.title} ${g.zhExplanation}`))errors.push(`grammar ${g.slug||g._id} contains placeholder text`)}
  for(const a of publishedArticles as any[]){if(!a.title||!a.slug||!a.category||!a.body||a.body.trim().length<100)errors.push(`article ${a.slug||a._id} lacks meaningful published content`);if(placeholder.test(`${a.title} ${a.body}`))errors.push(`article ${a.slug||a._id} contains placeholder text`);if(a.targetVocabularyIds?.length){const words=await Vocabulary.find({_id:{$in:a.targetVocabularyIds},published:true}).select('word').lean();for(const w of words as any[]){if(!new RegExp(`\\b${String(w.word).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(a.body))errors.push(`article ${a.slug} target vocabulary ${w.word} is not present in body`)}}}
  for(const q of publishedQuestions as any[]){if(!q.question||q.answer===undefined||!q.explanation)errors.push(`question ${q._id} lacks required content`);if(placeholder.test(`${q.question} ${q.explanation}`))errors.push(`question ${q._id} contains placeholder text`);if(q.options?.length){const normalized=q.options.map((x:any)=>String(x).trim().toLowerCase());if(new Set(normalized).size!==normalized.length)errors.push(`question ${q._id} has duplicate options`);if(!normalized.includes(String(q.answer).trim().toLowerCase()))errors.push(`question ${q._id} answer is not an option`)}}
  for(const m of publishedMorphology as any[]){if(!m.form||!m.type||!m.meaningZhTW||!m.meaningEn||!m.explanation)errors.push(`morphology ${m.slug||m._id} lacks required content`)}
  const report={vocabulary:{total,published,invalidLevel,missingZh,missingEn,missingPos,sourceMismatch,duplicates:duplicates.length},publishedContent:{grammar:publishedGrammar.length,articles:publishedArticles.length,questions:publishedQuestions.length,morphology:publishedMorphology.length},errors:errors.length};console.dir(report,{depth:null});
  if(errors.length){console.error(errors.slice(0,100).join('\n'));fail(`Data validation failed with ${errors.length} issue(s).`) }
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
