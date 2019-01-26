import {
  ITelegramService,
  ISendMessageOpts,
  ParseMode,
  IReplyKeyboardOptions,
} from './ITelegramService';
import { Message, ChatMember } from 'telegram-typings';
import { getUnixTimeFromDate } from '../../utils';
import { IHttp } from '../../Http';

type ReplyMarkup = {
  force_reply?: boolean;
  inline_keyboard?: [IReplyKeyboardOptions[]];
};

type TelegramHttpPayload = {
  chat_id: string;
  text: string;
  parse_mode?: ParseMode;
  reply_to_message_id?: string;
  reply_markup?: ReplyMarkup;
};
export default class TelegramService implements ITelegramService {
  constructor(private key: string, private http: IHttp) {}

  private buildUrl = (method: string) =>
    `https://api.telegram.org/bot${this.key}/${method}`;

  async sendChat(
    chatId: string,
    message: string,
    { force_reply, keyboard, ...opts }: ISendMessageOpts = {}
  ): Promise<Message> {
    const url = this.buildUrl('sendMessage');
    const payload: TelegramHttpPayload = {
      chat_id: chatId,
      text: message,
      ...opts,
    };

    if (force_reply || keyboard) {
      payload.reply_markup = {};
    }

    if (force_reply) {
      payload.reply_markup.force_reply = true;
    }

    if (keyboard) {
      payload.reply_markup.inline_keyboard = keyboard;
    }

    const response = await this.http.post(url, payload);
    return response.result as Message;
  }

  async kickUser(userId: string, chatId: string, until: Date): Promise<void> {
    const url = this.buildUrl('kickChatMember');
    const payload = {
      chat_id: chatId,
      user_id: userId,
      until_date: getUnixTimeFromDate(until),
    };

    await this.http.post(url, payload);
  }

  async deleteMessage(chat_id: string, message_id: string): Promise<void> {
    const url = this.buildUrl('deleteMessage');
    const payload = {
      chat_id,
      message_id,
    };

    await this.http.post(url, payload);
  }

  async getChatMember(userId: string, chatId: string): Promise<ChatMember> {
    const url = this.buildUrl('getChatMember');
    const payload = {
      chat_id: chatId,
      user_id: userId,
    };

    const response = await this.http.post(url, payload);
    return response.result as ChatMember;
  }

  getMentionFromId(id: string, name: string, lastName?: string) {
    const fullName = lastName ? `${name} ${lastName}` : name;
    return `[${fullName}](tg://user?id=${id})`;
  }

  sendReply(
    chatId: string,
    replyMessageId: string,
    message: string,
    opts: ISendMessageOpts = {}
  ) {
    return this.sendChat(chatId, message, {
      reply_to_message_id: replyMessageId,
      ...opts,
    });
  }

  sendReplyKeyboard(
    chatId: string,
    message: string,
    options: IReplyKeyboardOptions[],
    opts: ISendMessageOpts = {}
  ) {
    return this.sendChat(chatId, message, {
      keyboard: [options],
      ...opts,
    });
  }
}
