import {Router} from 'express';
import {firebaseAuth} from '../controllers/authController.js';
const r=Router();
r.post('/firebase',firebaseAuth);
export default r;
