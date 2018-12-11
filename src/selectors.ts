import { Update, User, ChatMember } from 'telegram-typings';
import {
  TypedUpdate,
  PlainMedia,
  PlainMessage,
  UpdateType,
  EventType,
  EventData,
} from './types';
import { ChatUser, UserRole, UserStatus } from './models';

export const getUpdateWithType = (update: Update): TypedUpdate => {
  let type: UpdateType;
  let id: string;
  if (update.message) {
    type = UpdateType.message;
    id = `${update.update_id}_${update.message.chat.id}`;
  } else if (update.edited_message) {
    type = UpdateType.edited_message;
    id = `${update.update_id}_${update.edited_message.chat.id}`;
  } else if (update.channel_post) {
    type = UpdateType.channel_post;
    id = `${update.update_id}_${update.channel_post.chat.id}`;
  } else if (update.edited_channel_post) {
    type = UpdateType.edited_channel_post;
    id = `${update.update_id}_${update.edited_channel_post.chat.id}`;
  } else if (update.inline_query) {
    type = UpdateType.inline_query;
    id = `${update.update_id}_${update.inline_query.id}`;
  } else if (update.chosen_inline_result) {
    type = UpdateType.chosen_inline_result;
    id = `${update.update_id}_${update.chosen_inline_result.result_id}`;
  } else if (update.callback_query) {
    type = UpdateType.callback_query;
    id = `${update.update_id}_${update.callback_query.id}`;
  } else if (update.shipping_query) {
    type = UpdateType.shipping_query;
    id = `${update.update_id}_${update.shipping_query.id}`;
  } else if (update.pre_checkout_query) {
    type = UpdateType.pre_checkout_query;
    id = `${update.update_id}_${update.pre_checkout_query.id}`;
  } else {
    type = UpdateType.unknown;
    id = `unknown_${new Date().getTime()}`;
  }

  return { type, id, ...update };
};

export const getPlainMediaType = (update: TypedUpdate): PlainMedia => {
  const msg = update.message;
  const is_audio = msg.audio && msg.audio.file_id !== '';
  const is_document = msg.document && msg.document.file_id !== '';
  const is_animation = msg.animation && msg.animation.file_id !== '';
  const is_game = msg.game && msg.game.title !== '';
  const is_photo = msg.photo && msg.photo.length > 0;
  const is_sticker = msg.sticker && msg.sticker.file_id !== '';
  const is_video = msg.video && msg.video.file_id !== '';
  const is_voice_note = msg.voice && msg.voice.file_id !== '';
  const is_video_note = msg.video_note && msg.video_note.file_id !== '';
  const is_contact = msg.contact && msg.contact.phone_number !== '';
  const is_location = msg.location && msg.location.latitude > 0;
  const is_venue = msg.venue && msg.venue.title !== '';
  const is_invoice = msg.invoice && msg.invoice.title !== '';

  if (is_audio) return PlainMedia.audio;
  else if (is_document) return PlainMedia.document;
  else if (is_animation) return PlainMedia.animation;
  else if (is_game) return PlainMedia.game;
  else if (is_photo) return PlainMedia.photo;
  else if (is_sticker) return PlainMedia.sticker;
  else if (is_video) return PlainMedia.video;
  else if (is_voice_note) return PlainMedia.voice_note;
  else if (is_video_note) return PlainMedia.video_note;
  else if (is_contact) return PlainMedia.contact;
  else if (is_location) return PlainMedia.location;
  else if (is_venue) return PlainMedia.venue;
  else if (is_invoice) return PlainMedia.invoice;
  else return null;
};

export const getUpdateEvent = (
  // tslint:disable-next-line:no-shadowed-variable
  update: TypedUpdate
): { type: EventType; data: EventData } => {
  let type: EventType = null;
  let data: EventData = null;

  if (update.message.new_chat_members) {
    type = EventType.new_chat_members;
    data = update.message.new_chat_members;
  } else if (update.message.left_chat_member) {
    type = EventType.left_chat_member;
    data = update.message.left_chat_member;
  } else if (update.message.new_chat_title) {
    type = EventType.new_chat_title;
    data = update.message.new_chat_title;
  } else if (update.message.new_chat_photo) {
    type = EventType.new_chat_photo;
    data = update.message.new_chat_photo;
  } else if (update.message.delete_chat_photo) {
    type = EventType.delete_chat_photo;
    data = update.message.delete_chat_photo;
  } else if (update.message.supergroup_chat_created) {
    type = EventType.supergroup_chat_created;
    data = update.message.supergroup_chat_created;
  } else if (update.message.channel_chat_created) {
    type = EventType.channel_chat_created;
    data = update.message.channel_chat_created;
  } else if (update.message.migrate_to_chat_id) {
    type = EventType.migrate_to_chat_id;
    data = update.message.migrate_to_chat_id;
  } else if (update.message.migrate_from_chat_id) {
    type = EventType.migrate_from_chat_id;
    data = update.message.migrate_from_chat_id;
  } else if (update.message.pinned_message) {
    type = EventType.pinned_message;
    data = update.message.pinned_message;
  } else if (update.message.successful_payment) {
    type = EventType.successful_payment;
    data = update.message.successful_payment;
  }

  return { type, data };
};

// TODO: extract class and add convenient methods like isGroup, isCommand
export const getPlainMessage = (update: TypedUpdate): PlainMessage => {
  const msg = update.message;
  const is_entity = !!msg.entities && msg.entities.length > 0;
  const entity_type = is_entity ? msg.entities[0].type : null;
  const entity_should_process =
    entity_type === 'bot_command' && msg.text.includes('@benditobot');
  const is_forward = msg.forward_from && msg.forward_from.id > 0;
  const forward_message_id = is_forward ? msg.forward_from_message_id : null;
  const forward_from_id = is_forward ? msg.forward_from.id : null;
  const forward_from_is_bot = is_forward ? msg.forward_from.is_bot : null;
  const forward_from_first_name = is_forward
    ? msg.forward_from.first_name
    : null;
  const forward_from_last_name = is_forward ? msg.forward_from.last_name : null;
  const forward_from_username = is_forward ? msg.forward_from.username : null;
  const is_reply = msg.reply_to_message && msg.reply_to_message.message_id > 0;
  const reply_message_id = is_reply ? msg.reply_to_message.message_id : null;
  const reply_text = is_reply ? msg.reply_to_message.text : null;
  const reply_from_id = is_reply ? msg.reply_to_message.from.id : null;
  const reply_from_is_bot = is_reply ? msg.reply_to_message.from.is_bot : null;
  const reply_from_first_name = is_reply
    ? msg.reply_to_message.from.first_name
    : null;
  const reply_from_last_name = is_reply
    ? msg.reply_to_message.from.last_name
    : null;
  const reply_from_username = is_reply
    ? msg.reply_to_message.from.username
    : null;

  const plain_media_type = getPlainMediaType(update);
  const is_plain_media = plain_media_type !== null;

  const update_event = getUpdateEvent(update);
  const event_type = update_event.type;
  const is_event = update_event !== null;
  const event_data = update_event.data;

  return {
    update_id: update.update_id,
    message_id: msg.message_id,
    date: new Date(msg.date * 1000),
    text: msg.text,
    from_id: msg.from.id,
    from_is_bot: msg.from.is_bot,
    from_first_name: msg.from.first_name,
    from_last_name: msg.from.last_name,
    from_username: msg.from.username,
    chat_id: msg.chat.id,
    chat_type: msg.chat.type,
    chat_title: msg.chat.title,
    is_entity,
    entity_type,
    entity_should_process,
    entities: msg.entities,
    is_forward,
    forward_message_id,
    forward_from_id,
    forward_from_is_bot,
    forward_from_first_name,
    forward_from_last_name,
    forward_from_username,
    is_reply,
    reply_message_id,
    reply_text,
    reply_from_id,
    reply_from_is_bot,
    reply_from_first_name,
    reply_from_last_name,
    reply_from_username,
    is_plain_media,
    plain_media_type,
    is_event,
    event_type,
    event_data,
  };
};

export enum BotCommands {
  remove_inactives = 'thanos',
  protect_user = 'delomio',
  list_inactives = 'lovegetadore',
}

const BotCommandsPermissions = [
  { admin: true, key: 'thanos' },
  { admin: true, key: 'delomio' },
  { admin: true, key: 'lovegetadore' },
];

export const getBotCommand = (pm: PlainMessage) => {
  const command = pm.text
    .slice(pm.entities[0].offset + 1, pm.entities[0].length)
    .replace('@benditobot', '') //TODO: generalize
    .trim();

  return BotCommandsPermissions.find(c => c.key === command) || null;
};

export const getUserChatFromMember = (u: ChatMember): ChatUser => {
  return {
    id: u.user.id,
    first_name: u.user.first_name,
    last_name: u.user.last_name,
    is_bot: u.user.is_bot,
    role: u.status === 'administrator' ? UserRole.admin : UserRole.user,
    last_message: null,
    username: u.user.username,
    warnings: [],
    status: u.status,
  };
};
