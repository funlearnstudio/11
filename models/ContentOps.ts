import { Schema, model, models } from 'mongoose';

const ImportRunSchema=new Schema({
  kind:{type:String,enum:['ceec-vocabulary','content-validation'],required:true},
  sourceName:{type:String,required:true},
  sourceUrl:String,
  sourceEdition:String,
  status:{type:String,enum:['running','completed','failed'],required:true,default:'running'},
  inputCount:{type:Number,default:0},
  importedCount:{type:Number,default:0},
  publishedCount:{type:Number,default:0},
  validationErrorCount:{type:Number,default:0},
  validationErrors:[String],
  missingFields:{type:Schema.Types.Mixed,default:{}},
  startedAt:{type:Date,default:Date.now},
  completedAt:Date
},{timestamps:true});
ImportRunSchema.index({kind:1,startedAt:-1});

export const ImportRun=models.ImportRun||model('ImportRun',ImportRunSchema);
