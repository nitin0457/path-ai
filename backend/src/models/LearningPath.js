import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  id:String,title:String,type:String,duration:String,url:String,description:String,qualityScore:Number,relevance:String,completed:{type:Boolean,default:false}
},{_id:false});

const taskSchema = new mongoose.Schema({
  title:String,instructions:String,estimatedTime:String,completed:{type:Boolean,default:false}
},{_id:false});

const assessmentSchema = new mongoose.Schema({
  title:String,type:String,questions:[String],completed:{type:Boolean,default:false}
},{_id:false});

const phaseSchema = new mongoose.Schema({
  id:String,title:String,description:String,duration:String,skills:[String],prerequisites:[String],
  resources:[resourceSchema],task:taskSchema,assessment:assessmentSchema,project:String,
  status:{type:String,default:'locked'},completed:{type:Boolean,default:false}
},{_id:false});

const learningPathSchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},goal:String,
  skillGaps:[mongoose.Schema.Types.Mixed],phases:[phaseSchema],currentPhase:{type:Number,default:0},progress:{type:Number,default:0}
},{timestamps:true});

export default mongoose.model('LearningPath',learningPathSchema);
