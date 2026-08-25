import { Schema, model, models } from 'mongoose';

const RateLimitSchema=new Schema({
  key:{type:String,required:true,unique:true},
  count:{type:Number,default:0},
  expiresAt:{type:Date,required:true,index:{expireAfterSeconds:0}}
},{timestamps:true});

export const RateLimit=models.RateLimit||model('RateLimit',RateLimitSchema);
