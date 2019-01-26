import { MessageEntity } from 'telegram-typings';
import { EventType, EventData, PlainMedia } from '../types';

export class PlainMessage {
  // TODO: temporal. Make a migration to set id = update_id
  constructor() {
    this.id = `${this.update_id}`;
  }
  id: string;
  update_id: string;
  message_id: string;
  date: Date;
  text?: string;
  from_id: string;
  from_is_bot: boolean;
  from_first_name?: string;
  from_last_name?: string;
  from_username?: string;
  chat_id: string;
  chat_type: string;
  chat_title?: string;
  is_entity: boolean;
  entity_type?: string;
  entities?: MessageEntity[];
  is_forward: boolean;
  forward_message_id?: string;
  forward_from_id?: string;
  forward_from_is_bot?: boolean;
  forward_from_first_name?: string;
  forward_from_last_name?: string;
  forward_from_username?: string;
  is_reply: boolean;
  reply_message_id?: string;
  reply_text?: string;
  reply_from_id?: string;
  reply_from_is_bot?: boolean;
  reply_from_first_name?: string;
  reply_from_last_name?: string;
  reply_from_username?: string;
  is_plain_media: boolean;
  plain_media_type?: PlainMedia;
  is_event: boolean;
  event_type?: EventType;
  event_data?: EventData;
  callback_data: string = null;
}
