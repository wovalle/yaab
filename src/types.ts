import {
  Update,
  MessageEntity,
  Document,
  Audio,
  Animation,
  Game,
  PhotoSize,
  Contact,
  Location,
  Venue,
  Sticker,
  Video,
  Voice,
  VideoNote,
  Invoice,
  User,
  Message,
  SuccessfulPayment,
} from 'telegram-typings';

export enum UpdateType {
  message = 'message',
  edited_message = 'edited_message',
  channel_post = 'channel_post',
  edited_channel_post = 'edited_channel_post	',
  inline_query = 'inline_query',
  chosen_inline_result = 'chosen_inline_result',
  callback_query = 'callback_query',
  shipping_query = 'shipping_query',
  pre_checkout_query = 'pre_checkout_query',
  unknown = 'unknown',
}

export enum EventType {
  new_chat_members = 'new_chat_members',
  left_chat_member = 'left_chat_member',
  new_chat_title = 'new_chat_title',
  new_chat_photo = 'new_chat_photo',
  delete_chat_photo = 'delete_chat_photo',
  group_chat_created = 'group_chat_created',
  supergroup_chat_created = 'supergroup_chat_created',
  channel_chat_created = 'channel_chat_created',
  migrate_to_chat_id = 'migrate_to_chat_id',
  migrate_from_chat_id = 'migrate_from_chat_id',
  pinned_message = 'pinned_message',
  successful_payment = 'successful_payment',
}

export type NewChatMembersEventData = User[];
export type LeftChatMemberEventData = User;
export type NewChatTitleEventData = string;
export type NewChatPhotoEventData = PhotoSize[];
export type DeleteChatPhotoEventData = boolean;
export type GroupChatCreatedEventData = boolean;
export type SuperGrupChatCreatedEventData = boolean;
export type ChannelChatCreatedEventData = boolean;
export type MigrateToChatIdEventData = Number;
export type MigrateFromChatIdEventData = Number;
export type PinnedMessageEventData = Message;
export type SuccessfulPaymentEventData = SuccessfulPayment;

export type EventData =
  | NewChatMembersEventData
  | LeftChatMemberEventData
  | NewChatTitleEventData
  | NewChatPhotoEventData
  | DeleteChatPhotoEventData
  | GroupChatCreatedEventData
  | SuperGrupChatCreatedEventData
  | ChannelChatCreatedEventData
  | MigrateToChatIdEventData
  | MigrateFromChatIdEventData
  | PinnedMessageEventData
  | SuccessfulPaymentEventData;

export interface TypedUpdate extends Update {
  type: UpdateType;
  id: string;
}

export enum PlainMedia {
  audio = 'audio',
  document = 'document',
  animation = 'animation',
  game = 'game',
  photo = 'photo',
  sticker = 'sticker',
  video = 'video',
  voice_note = 'voice_note',
  video_note = 'video_note',
  contact = 'contact',
  location = 'location',
  venue = 'venue',
  invoice = 'invoice',
}

export type PlainMediaContent =
  | Audio
  | Document
  | Animation
  | Game
  | PhotoSize[]
  | Sticker
  | Video
  | Voice
  | VideoNote
  | Contact
  | Location
  | Venue
  | Invoice;
export interface PlainMessage {
  update_id: number;
  message_id: number;
  date: Date;
  text?: string;
  from_id: number;
  from_is_bot: boolean;
  from_first_name?: string;
  from_last_name?: string;
  from_username?: string;
  chat_id: number;
  chat_type: string;
  chat_title?: string;
  is_entity: boolean;
  entity_should_process: boolean;
  entity_type?: string;
  entities?: MessageEntity[];
  is_forward: boolean;
  forward_message_id?: number;
  forward_from_id?: number;
  forward_from_is_bot?: boolean;
  forward_from_first_name?: string;
  forward_from_last_name?: string;
  forward_from_username?: string;
  is_reply: boolean;
  reply_message_id?: number;
  reply_text?: string;
  reply_from_id?: number;
  reply_from_is_bot?: boolean;
  reply_from_first_name?: string;
  reply_from_last_name?: string;
  reply_from_username?: string;
  is_plain_media: boolean;
  plain_media_type?: PlainMedia;
  is_event: boolean;
  event_type?: EventType;
  event_data?: EventData;
}
