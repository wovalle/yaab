import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { ITelegramHandlerPayload } from '../types';

@Handler(BotCommands.enable_crush_mode)
export class EnableCrushModeHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    await this.telegramService.sendChat(
      payload.plainMessage.chat_id,
      this.i18n.t('commands.enable_crush_mode.successful'),
      {
        parse_mode: ParseMode.Markdown,
        reply_to_message_id: payload.plainMessage.message_id,
      }
    );
  }
}
