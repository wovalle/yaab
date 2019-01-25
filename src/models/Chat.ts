import { Collection, SubCollection, ISubCollection } from 'fireorm';
import { PlainMessage } from './PlainMessage';
import { ChatMember } from './ChatMember';

export interface IChatMemberSubCollection extends ISubCollection<ChatMember> {
  getInactive(since: Date): Promise<ChatMember[]>;
  findByName(name: string): Promise<ChatMember[]>;
  findByUsername(username: string): Promise<ChatMember>;
}

@Collection('chats')
export class Chat {
  id: string;
  @SubCollection(PlainMessage)
  readonly messages?: ISubCollection<PlainMessage>;
  @SubCollection(ChatMember)
  readonly users?: IChatMemberSubCollection;
}
