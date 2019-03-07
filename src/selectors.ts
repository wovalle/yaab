import { Update, ChatMember, Message } from 'telegram-typings';
import {
  TypedUpdate,
  PlainMedia,
  UpdateType,
  EventType,
  EventData,
  UserRole,
} from './types';
import { PlainMessage, ChatMember as ModelChatMember } from './models';
const emojiStrip = require('emoji-strip');

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

export const getPlainMediaType = (msg: Message): PlainMedia => {
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
  message: Message
): { type: EventType; data: EventData } => {
  let type: EventType = null;
  let data: EventData = null;

  if (message.new_chat_members) {
    type = EventType.new_chat_members;
    data = message.new_chat_members;
  } else if (message.left_chat_member) {
    type = EventType.left_chat_member;
    data = message.left_chat_member;
  } else if (message.new_chat_title) {
    type = EventType.new_chat_title;
    data = message.new_chat_title;
  } else if (message.new_chat_photo) {
    type = EventType.new_chat_photo;
    data = message.new_chat_photo;
  } else if (message.delete_chat_photo) {
    type = EventType.delete_chat_photo;
    data = message.delete_chat_photo;
  } else if (message.supergroup_chat_created) {
    type = EventType.supergroup_chat_created;
    data = message.supergroup_chat_created;
  } else if (message.channel_chat_created) {
    type = EventType.channel_chat_created;
    data = message.channel_chat_created;
  } else if (message.migrate_to_chat_id) {
    type = EventType.migrate_to_chat_id;
    data = message.migrate_to_chat_id;
  } else if (message.migrate_from_chat_id) {
    type = EventType.migrate_from_chat_id;
    data = message.migrate_from_chat_id;
  } else if (message.pinned_message) {
    type = EventType.pinned_message;
    data = message.pinned_message;
  } else if (message.successful_payment) {
    type = EventType.successful_payment;
    data = message.successful_payment;
  }

  return { type, data };
};

const supportedTypes = [UpdateType.message, UpdateType.callback_query];

// TODO: extract class and add convenient methods like isGroup, isCommand
export const getPlainMessage = (baseUpdate: Update): PlainMessage => {
  const update = getUpdateWithType(baseUpdate);

  if (!supportedTypes.includes(update.type)) {
    throw new Error(`Update (${update.type}) is not currently supported`);
  }

  let root: Message = null;
  let callback_data: string = null;

  if (update.type === UpdateType.callback_query) {
    root = update.callback_query.message;
    root.from = update.callback_query.from;
    callback_data = update.callback_query.data;
  } else {
    root = update.message;
  }

  const is_entity = !!root.entities && root.entities.length > 0;
  const entity_type = is_entity ? root.entities[0].type : null;
  const is_forward = root.forward_from && root.forward_from.id > 0;
  const forward_message_id = is_forward ? root.forward_from_message_id : null;
  const forward_from_id = is_forward ? root.forward_from.id : null;
  const forward_from_is_bot = is_forward ? root.forward_from.is_bot : null;
  const forward_from_first_name = is_forward
    ? root.forward_from.first_name
    : null;
  const forward_from_last_name = is_forward
    ? root.forward_from.last_name
    : null;
  const forward_from_username = is_forward ? root.forward_from.username : null;
  const is_reply =
    root.reply_to_message && root.reply_to_message.message_id > 0;
  const reply_message_id = is_reply ? root.reply_to_message.message_id : null;
  const reply_text = is_reply ? root.reply_to_message.text : null;
  const reply_from_id = is_reply ? root.reply_to_message.from.id : null;
  const reply_from_is_bot = is_reply ? root.reply_to_message.from.is_bot : null;
  const reply_from_first_name = is_reply
    ? root.reply_to_message.from.first_name
    : null;
  const reply_from_last_name = is_reply
    ? root.reply_to_message.from.last_name
    : null;
  const reply_from_username = is_reply
    ? root.reply_to_message.from.username
    : null;

  const plain_media_type = getPlainMediaType(root);
  const is_plain_media = plain_media_type !== null;

  const update_event = getUpdateEvent(root);
  const event_type = update_event.type;
  const is_event = update_event !== null;
  const event_data = update_event.data;

  return {
    id: `${update.id}`,
    update_id: `${update.update_id}`,
    message_id: `${root.message_id}`,
    date: new Date(root.date * 1000),
    text: root.text,
    from_id: `${root.from.id}`,
    from_is_bot: root.from.is_bot,
    from_first_name: root.from.first_name,
    from_last_name: root.from.last_name,
    from_username: root.from.username,
    chat_id: `${root.chat.id}`,
    chat_type: root.chat.type,
    chat_title: root.chat.title,
    is_entity,
    entity_type,
    entities: root.entities,
    is_forward,
    forward_message_id: `${forward_message_id}`,
    forward_from_id: `${forward_from_id}`,
    forward_from_is_bot,
    forward_from_first_name,
    forward_from_last_name,
    forward_from_username,
    is_reply,
    reply_message_id: `${reply_message_id}`,
    reply_text,
    reply_from_id: `${reply_from_id}`,
    reply_from_is_bot,
    reply_from_first_name,
    reply_from_last_name,
    reply_from_username,
    is_plain_media,
    plain_media_type,
    is_event,
    event_type,
    event_data,
    callback_data,
  };
};

export enum BotCommands {
  remove_inactives = 'remove_inactives',
  protect_user = 'protect_user',
  list_inactives = 'list_inactives',
  list_protected = 'list_protected',
  remove_protected = 'remove_protected',
  enable_crush_mode = 'enable_crush_mode',
  add_crush = 'add_crush',
  start = 'start',
  help = 'help',
  private_message = 'private_message',
}

export enum BotCommandScope {
  group = 'group',
  supergroup = 'supergroup',
  private = 'private',
  channel = 'channel',
}

export interface IBotCommandDetail {
  admin: boolean;
  key: BotCommands;
  keyword: string;
  scopes: Array<BotCommandScope>;
  textActivators: Array<string>;
}

const BotCommandsDetails: IBotCommandDetail[] = [
  {
    admin: true,
    key: BotCommands.list_inactives,
    keyword: 'lobrechadore',
    scopes: [BotCommandScope.group, BotCommandScope.supergroup],
    textActivators: [],
  },
  {
    admin: true,
    key: BotCommands.remove_inactives,
    keyword: 'thanos',
    scopes: [BotCommandScope.group, BotCommandScope.supergroup],
    textActivators: [],
  },
  {
    admin: true,
    key: BotCommands.protect_user,
    keyword: 'delomio',
    scopes: [BotCommandScope.group, BotCommandScope.supergroup],
    textActivators: [],
  },
  {
    admin: true,
    key: BotCommands.remove_protected,
    keyword: 'baraja',
    scopes: [BotCommandScope.group, BotCommandScope.supergroup],
    textActivators: [],
  },
  {
    admin: true,
    key: BotCommands.list_protected,
    keyword: 'lodichoso',
    scopes: [BotCommandScope.group, BotCommandScope.supergroup],
    textActivators: [],
  },
  {
    admin: false,
    key: BotCommands.enable_crush_mode,
    keyword: 'benditocrush',
    scopes: [
      BotCommandScope.group,
      BotCommandScope.supergroup,
      BotCommandScope.private,
    ],
    textActivators: [],
  },
  {
    admin: false,
    key: BotCommands.start,
    keyword: 'start',
    scopes: [BotCommandScope.private],
    textActivators: [],
  },
  {
    admin: false,
    key: BotCommands.help,
    keyword: 'help',
    scopes: [BotCommandScope.private],
    textActivators: [],
  },
  {
    admin: false,
    key: BotCommands.add_crush,
    keyword: 'addcrush',
    scopes: [
      BotCommandScope.private,
      BotCommandScope.group,
      BotCommandScope.supergroup,
    ],
    textActivators: ['crush_search', 'crush_found'],
  },
  {
    admin: false,
    key: BotCommands.private_message,
    keyword: '',
    scopes: [BotCommandScope.private],
    textActivators: ['pick_user', 'rtc', 'rfc'],
  },
];

type CommandType = 'bot_command' | 'text_command';

export type BotCommand = {
  args: string[];
  type: CommandType;
  isValid: boolean;
  details: IBotCommandDetail;
  activator: string;
  callback_data: string;
};

// TODO: make constants
const botRegex = /bendito(beta)?bot/i;

export const getBotCommand = (message: PlainMessage): BotCommand => {
  const {
    chat_type,
    text,
    reply_from_is_bot,
    reply_text,
    reply_from_username,
    entity_type,
    callback_data,
  } = message;

  const groupScopes = [BotCommandScope.group, BotCommandScope.supergroup];
  // callback queries store info in text
  const replyText = callback_data ? text : reply_text || '';
  const chatScope = chat_type as BotCommandScope;

  const isBotCommandDirectedToBot = groupScopes.includes(chatScope)
    ? botRegex.test(text)
    : true;

  const shouldProcessBotCommand =
    entity_type === 'bot_command' && isBotCommandDirectedToBot;

  if (shouldProcessBotCommand) {
    const splittedText = text.trim().split(' ');
    const [commandKeyword] = splittedText[0].split('@');

    const details =
      BotCommandsDetails.find(c => c.keyword === commandKeyword.slice(1)) ||
      null;

    return {
      args: splittedText.slice(1),
      details,
      isValid: !!details,
      type: 'bot_command',
      activator: null,
      callback_data,
    };
  }

  const [replyActivator] = replyText.split(' ');

  // replyActivators will always start with # and end with :
  const replyActivatorStd = replyActivator.slice(1, -1);

  const textActivatorCommand =
    BotCommandsDetails.find(b =>
      b.textActivators.some(activator => replyActivatorStd === activator)
    ) || null;

  const isReplyFromBot =
    reply_from_is_bot && botRegex.test(reply_from_username);

  const shouldProcessTextCommand =
    textActivatorCommand && replyText && (!!callback_data || isReplyFromBot);

  if (shouldProcessTextCommand) {
    return {
      args: [text],
      details: textActivatorCommand,
      isValid: true,
      type: 'text_command',
      activator: textActivatorCommand ? replyActivatorStd : null,
      callback_data,
    };
  }

  if (chatScope === BotCommandScope.private) {
    const details = BotCommandsDetails.find(
      c => c.key === BotCommands.private_message
    );

    return {
      args: [],
      details,
      isValid: true,
      type: 'text_command',
      activator: null,
      callback_data,
    };
  }

  return {
    args: [],
    details: null,
    isValid: false,
    type: null,
    activator: null,
    callback_data,
  };
};

export const getUserSearchKeywords = (
  firstName: string,
  lastName: string,
  username: string
): string[] => {
  let keywords = [];

  const getVariations = (key: string): string[] => {
    const lowerKey = key.toLocaleLowerCase();
    return lowerKey
      .split('')
      .reduce((acc, _, i) => acc.concat(lowerKey.slice(0, i + 1)), []);
  };

  keywords = firstName ? keywords.concat(getVariations(firstName)) : keywords;
  keywords = lastName ? keywords.concat(getVariations(lastName)) : keywords;
  keywords = username ? keywords.concat(getVariations(username)) : keywords;

  return Array.from(new Set(keywords));
};

export const getUserChat = ({
  id,
  is_bot,
  status,
  first_name,
  last_name = '',
  username: uname = '',
}): ModelChatMember => {
  const firstName = emojiStrip(first_name);
  const lastName = emojiStrip(last_name || '') || null;
  const username = emojiStrip(uname || '') || null;
  return {
    id: `${id}`,
    first_name: firstName,
    last_name: lastName,
    is_bot: is_bot,
    protected: false,
    role: status === 'administrator' ? UserRole.admin : UserRole.user,
    last_message: null,
    username: username,
    status: status,
    crush_status: 'enabled',
    search_keywords: getUserSearchKeywords(firstName, lastName, username),
  };
};

export const getUserChatFromMember = (u: ChatMember): ModelChatMember => {
  return getUserChat({ ...u.user, status: u.status });
};
