import ChatMemberRepository from './ChatMemberRepository';
import CrushRelationshipRepository from './CrushRelationshipRepository';
import { BaseFirestoreRepository } from 'fireorm';
import { Chat } from '../models';

type ChatRepository = BaseFirestoreRepository<Chat>;

export { ChatMemberRepository, ChatRepository, CrushRelationshipRepository };
