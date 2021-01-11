import {
  ITelegramService,
  ISendMessageOpts,
  ParseMode,
  IReplyKeyboardOptions,
  MessageBuilderProps,
} from "./ITelegramService";
import { Message, ChatMember } from "telegram-typings";
import { IHttp } from "../../Http";
import MessageBuilder from "../../MessageBuilder";

type ReplyMarkup = {
  force_reply?: boolean;
  inline_keyboard?: [IReplyKeyboardOptions[]] | IReplyKeyboardOptions[][];
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

    if (opts.parse_mode) {
      props.parseMode = opts.parse_mode;
    }

    if (opts.reply_to_message_id) {
      props.replyTo = opts.reply_to_message_id;
    }

    return this.sendRawMessage(props);
  }

  async kickUser(userId: string, chatId: string, until?: Date): Promise<void> {
    const url = this.buildUrl("kickChatMember");
    const payload = {
      chat_id: chatId,
      user_id: userId,
      until_date: null,
    };

    if (until) {
      payload.until_date = until;
    }

    await this.http.post(url, payload);
  }

  async deleteMessage(chat_id: string, message_id: string): Promise<void> {
    const url = this.buildUrl("deleteMessage");
    const payload = {
      chat_id,
      message_id,
    };

    await this.http.post(url, payload);
  }

  async getChatMember(userId: string, chatId: string): Promise<ChatMember> {
    const url = this.buildUrl("getChatMember");
    const payload = {
      chat_id: chatId,
      user_id: userId,
    };

    try {
      const response = await this.http.post(url, payload);
      return response.result as ChatMember;
    } catch (error) {
      console.error("user error", payload);
      throw { inner: error, payload };
    }
  }

  getMentionFromId(id: string, name: string, lastName?: string) {
    const fullName = lastName ? `${name} ${lastName}` : name;
    return `[${fullName}](tg://user?id=${id})`;
  }

  sendReply(
    chatId: string,
    replyMessageId: string,
    text: string,
    opts: ISendMessageOpts = {}
  ) {
    return this.sendChat(chatId, text, {
      reply_to_message_id: replyMessageId,
      ...opts,
    });
  }

  buildMessage(text: string) {
    return new MessageBuilder(this, text);
  }

  async sendRawMessage(props: MessageBuilderProps): Promise<Message> {
    const url = this.buildUrl("sendMessage");
    const payload: TelegramHttpPayload = {
      chat_id: props.chatId,
      text: props.text,
      reply_markup: {},
    };

    if (props.parseMode) {
      payload.parse_mode = props.parseMode;
    }

    if (props.replyKeyboard) {
      payload.reply_markup.inline_keyboard = props.replyKeyboard.map((k) => [
        k,
      ]);
    }

    if (props.forceReply) {
      payload.reply_markup.force_reply = true;
    }

    if (props.prepend) {
      payload.text = `${props.prepend}${payload.text}`;
    }

    if (props.append) {
      payload.text = `${payload.text}${props.append}`;
    }

    if (props.activator) {
      payload.text = `|${props.activator}| ${payload.text}`;
    }

    if (props.replyTo) {
      payload.reply_to_message_id = props.replyTo;
    }

    const response = await this.http.post(url, payload);
    return response.result as Message;
  }
}
