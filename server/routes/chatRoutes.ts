import { Router } from 'express';
import { askQuestionHandler, streamAnswerHandler } from '../controllers/chatController';

export const chatRoutes = Router();
chatRoutes.post('/ask', askQuestionHandler);
chatRoutes.get('/ask/stream', streamAnswerHandler); 

