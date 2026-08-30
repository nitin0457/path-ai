import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const signToken=id=>jwt.sign({id},env.jwtSecret,{expiresIn:'7d'});
