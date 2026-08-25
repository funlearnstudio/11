import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { dbConnect } from '@/lib/db';
import { Article, Question } from '@/models/Learning';
import ArticleReader from '@/components/ArticleReader';
import CompleteContentButton from '@/components/CompleteContentButton';
import ContentQuestions from '@/components/ContentQuestions';

export const dynamic='force-dynamic';
export default async function ReadingArticlePage({params}:{params:Promise<{slug:string}>}){
  const [{slug},session]=await Promise.all([params,auth()]);await dbConnect();const article:any=await Article.findOne({slug,published:true}).populate('targetVocabularyIds','word ipa partsOfSpeech zhTWDefinitions englishDefinitions').lean();if(!article)notFound();
  const questions:any[]=article.questionIds?.length?await Question.find({_id:{$in:article.questionIds},published:true}).select('type question options difficulty category').lean():[];
  const items=questions.map(q=>({_id:String(q._id),question:q.question,options:q.options||[],type:q.type,difficulty:q.difficulty,category:q.category}));
  return <main className="content"><p className="muted">{article.category} · Difficulty {article.difficulty}{article.estimatedReadingMinutes?` · ${article.estimatedReadingMinutes} min`:''}</p><h1>{article.title}</h1><ArticleReader body={article.body} words={article.targetVocabularyIds||[]}/><section><h2>Vocabulary Review</h2>{article.targetVocabularyIds?.length?<div className="grid">{article.targetVocabularyIds.map((word:any)=><div className="card" key={String(word._id)}><strong>{word.word}</strong><p className="muted">{word.ipa||''} · {word.partsOfSpeech?.join(', ')||''}</p><p>{word.zhTWDefinitions?.join('；')}</p></div>)}</div>:<p className="muted">This article has no tagged target vocabulary yet.</p>}</section><section><h2>Reading Questions</h2><ContentQuestions items={items} authenticated={!!session?.user}/></section><CompleteContentButton kind="reading" id={String(article._id)} authenticated={!!session?.user}/></main>;
}
