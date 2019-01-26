import {
  ITelegramService,
  ISendMessageOpts,
  ParseMode,
  IReplyKeyboardOptions,
  MessageBuilderProps,
} from './ITelegramService';
import { Message, ChatMember } from 'telegram-typings';
import { getUnixTimeFromDate } from '../../utils';
import { IHttp } from '../../Http';
import MessageBuilder from '../../MessageBuilder';

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
    text: string,
    { force_reply, keyboard, ...opts }: ISendMessageOpts = {}
  ): Promise<Message> {
    const props: MessageBuilderProps = {
      chatId,
      text,
    };

    if (force_reply) {
      props.forceReply = true;
    }

    if (keyboard) {
      props.replyKeyboard = keyboard;
    }

    return this.sendRawMessage(props);
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

  buildMessage(text: string) {
    return new MessageBuilder(this, text);
  }

  async sendRawMessage(props: MessageBuilderProps): Promise<Message> {
    const url = this.buildUrl('sendMessage');
    const payload: TelegramHttpPayload = {
      chat_id: props.chatId,
      text: props.text,
      reply_markup: {},
    };

    if (props.parseMode) {
      payload.parse_mode = props.parseMode;
    }

    if (props.replyKeyboard) {
      payload.reply_markup.inline_keyboard = [props.replyKeyboard];
    }

    if (props.forceReply) {
      payload.reply_markup.force_reply = true;
    }

    if (props.activator) {
      payload.text = `#${props.activator}: ${props.text}`;
    }

    const response = await this.http.post(url, payload);
    return response.result as Message;
  }
}
