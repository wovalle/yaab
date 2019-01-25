import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { ITelegramHandlerPayload } from '../types';

@Handler(BotCommands.add_crush)
export class AddCrushHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    if (payload.command.type === 'text_command') {
      await this.telegramService.sendChat(
        payload.plainMessage.chat_id,
        payload.command.activator,
        {
          parse_mode: ParseMode.Markdown,
          reply_to_message_id: payload.plainMessage.message_id,
        }
      );
      return;
    }

    await this.telegramService.sendChat(
      payload.plainMessage.chat_id,
      this.i18n.t('commands.addcrush.init'),
      {
        parse_mode: ParseMode.Markdown,
        reply_to_message_id: payload.plainMessage.message_id,
        force_reply: true,
      }
    );
  }
}
