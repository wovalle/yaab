import ChatMemberRepository from './ChatMemberRepository';
import { BaseFirestoreRepository } from 'fireorm';
import { Chat, CrushRelationship } from '../models';

type ChatRepository = BaseFirestoreRepository<Chat>;
type CrushRelationshipRepository = BaseFirestoreRepository<CrushRelationship>;

export { ChatMemberRepository, ChatRepository, CrushRelationshipRepository };
