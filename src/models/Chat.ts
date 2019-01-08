import { Collection, SubCollection } from '../fireorm';
import { PlainMessage } from './PlainMessage';
import { ISubCollection } from '../fireorm/types';
import { ChatMember } from './ChatMember';

@Collection('chats')
export class Chat {
  id: string;
  @SubCollection(PlainMessage, 'messages', 'chats')
  readonly messages?: ISubCollection<PlainMessage>;
  @SubCollection(ChatMember, 'users', 'chats')
  readonly users?: ISubCollection<ChatMember>;
}
