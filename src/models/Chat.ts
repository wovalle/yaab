import { Collection, SubCollection } from '../fireorm';
import { PlainMessage } from './PlainMessage';
import { ISubCollection } from '../fireorm/types';
import { ChatMember } from './ChatMember';

@Collection('chats')
export class Chat {
  id: string;
  @SubCollection(PlainMessage)
  readonly messages?: ISubCollection<PlainMessage>;
  @SubCollection(ChatMember)
  readonly users?: ISubCollection<ChatMember>;
}
