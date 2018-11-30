import { Update } from 'telegram-typings';

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

export interface TypedUpdate extends Update {
  type: UpdateType;
  id: string;
}
