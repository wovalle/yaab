import {
  IReplyKeyboardOptions,
  ParseMode,
  ITelegramService,
  MessageBuilderProps,
} from './services/telegram';

export default class MessageBuilder {
  protected props: MessageBuilderProps;

  constructor(private service: ITelegramService, text: string) {
    this.props = {};
    this.props.text = text;
  }

  to(chatId: string) {
    this.props.chatId = chatId;
    return this;
  }

  withKeyboard(keyboard: IReplyKeyboardOptions[]) {
    this.props.replyKeyboard = keyboard;
    return this;
  }

  forceReply() {
    this.props.forceReply = true;
    return this;
  }

  asMarkDown() {
    this.props.parseMode = ParseMode.Markdown;
    return this;
  }

  asHTML() {
    this.props.parseMode = ParseMode.HTML;
    return this;
  }

  replyTo(messageId: string) {
    this.props.replyTo = messageId;
    return this;
  }

  withActivator(activator: string) {
    this.props.activator = activator;
    return this;
  }

  send() {
    return this.service.sendRawMessage(this.props);
  }
}
