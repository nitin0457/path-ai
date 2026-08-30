import mongoose from 'mongoose';
const feedbackSchema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},recommendationId:String,type:{type:String,required:true}},{timestamps:true});
export default mongoose.model('Feedback',feedbackSchema);
