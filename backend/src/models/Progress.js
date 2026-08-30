import mongoose from 'mongoose';
const progressSchema = new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},phaseId:String,completed:{type:Boolean,default:false},completedAt:Date},{timestamps:true});
export default mongoose.model('Progress',progressSchema);
