import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { addHours } from 'date-fns';
import { ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.list_inactives)
export class ListInactiveHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private getCurrentDate: () => Date;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.getCurrentDate = Container.get('getCurrentDate');
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const { plainMessage: pm, chat, command } = payload;
    let hours = Number.parseInt(command.args[0]);
    const isHoursANumber = Number.isInteger(hours);

    if (command.args.length && !isHoursANumber) {
      const errorId = 'commands.errors.invalid';
      return this.telegramService.sendReply(
        pm.chat_id,
        pm.message_id,
        this.i18n.t(errorId)
      );
    } else if (!command.args.length) {
      hours = 5 * 24; // TODO: update constants
    }

    const inactiveSince = addHours(this.getCurrentDate(), -hours);
    const users = await chat.users.getInactive(inactiveSince);

    if (!users.length) {
      const errorId = 'commands.list_inactive.empty';
      return this.telegramService.sendChat(
        pm.chat_id,
        this.i18n.t(errorId, { hours }),
        {
          parse_mode: ParseMode.Markdown,
          reply_to_message_id: pm.message_id,
        }
      );
    }

    const mentions = users
      .map(u => this.telegramService.getMentionFromId(u.id, u.first_name))
      .join(', ');

    await this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t('commands.list_inactive.successful', { hours, mentions }),
      { parse_mode: ParseMode.Markdown }
    );

    return Promise.resolve();
  }
}
