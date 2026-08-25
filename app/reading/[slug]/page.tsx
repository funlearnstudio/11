import { notFound } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import { Article, Question } from '@/models/Learning';
import ArticleReader from '@/components/ArticleReader';
import CompleteContentButton from '@/components/CompleteContentButton';

export const dynamic='force-dynamic';

export default async function ReadingArticlePage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  await dbConnect();
  const article:any=await Article.findOne({slug,published:true}).populate('targetVocabularyIds','word ipa partsOfSpeech zhTWDefinitions englishDefinitions').lean();
  if(!article)notFound();
  const questions:any[]=article.questionIds?.length?await Question.find({_id:{$in:article.questionIds},published:true}).select('type question options answer explanation optionExplanations').lean():[];
  return <main className="content"><p className="muted">{article.category} · Difficulty {article.difficulty}{article.estimatedReadingMinutes?` · ${article.estimatedReadingMinutes} min`:''}</p><h1>{article.title}</h1><ArticleReader body={article.body} words={article.targetVocabularyIds||[]}/><section><h2>Vocabulary Review</h2>{article.targetVocabularyIds?.length?<div className="grid">{article.targetVocabularyIds.map((word:any)=><div className="card" key={String(word._id)}><strong>{word.word}</strong><p className="muted">{word.ipa||''} · {word.partsOfSpeech?.join(', ')||''}</p><p>{word.zhTWDefinitions?.join('；')}</p></div>)}</div>:<p className="muted">This article has no tagged target vocabulary yet.</p>}</section><section><h2>Reading Questions</h2>{questions.length?<div className="list">{questions.map((question:any,index:number)=><details className="card" key={String(question._id)}><summary><strong>{index+1}. {question.question}</strong></summary>{question.options?.length?<ol type="A">{question.options.map((option:string)=><li key={option}>{option}</li>)}</ol>:null}<hr/><p><strong>Answer:</strong> {String(question.answer)}</p><p>{question.explanation}</p>{question.optionExplanations?.length?<ul>{question.optionExplanations.map((item:any)=><li key={item.option}><strong>{item.option}:</strong> {item.explanation}</li>)}</ul>:null}</details>)}</div>:<div className="card">No published questions are attached to this article yet.</div>}</section><CompleteContentButton kind="reading" id={String(article._id)}/></main>;
}
