import mongoose from 'mongoose';
const skillSchema = new mongoose.Schema({name:{type:String,required:true},level:{type:Number,min:0,max:100,default:40}},{_id:false});
const userSchema = new mongoose.Schema({
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  password:{type:String,default:null},
  firebaseUid:{type:String,default:null,index:true,sparse:true},
  googleId:{type:String,default:null,index:true,sparse:true},
  authProvider:{type:String,enum:['email','google'],default:'email'},
  emailVerified:{type:Boolean,default:false},
  emailVerificationToken:{type:String,default:null},
  emailVerificationExpires:{type:Date,default:null},
  experienceLevel:{type:String,enum:['Beginner','Intermediate','Advanced'],default:'Beginner'}, skills:[skillSchema], interests:[String], careerGoal:{type:String,default:''}, weeklyHours:{type:Number,default:10}, targetDuration:{type:String,default:'4 months'}, onboardingCompleted:{type:Boolean,default:false}
},{timestamps:true});
export default mongoose.model('User',userSchema);
