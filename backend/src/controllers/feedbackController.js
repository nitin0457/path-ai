import Feedback from '../models/Feedback.js';
export async function createFeedback(req,res){const item=await Feedback.create({userId:req.user.id,recommendationId:req.body.recommendationId||'next-action',type:req.body.type});res.status(201).json(item);}
