import {
  Update,
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
import { IDetailedBotCommand } from './selectors';
import { PlainMessage } from './models';

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

export enum UserRole {
  user = 'user',
  admin = 'admin',
}

export enum UserStatus {
  active = 'active',
  unsaved = 'unsaved',
}

export interface ITelegramHandlerPayload {
  plainMessage: PlainMessage;
  command: IDetailedBotCommand;
}
