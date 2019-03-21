import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands } from '../selectors';
import I18nProvider from '../I18nProvider';
import { addHours } from 'date-fns';
import { ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.remove_inactives)
export class RemoveInactivesHandler
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

    const sinceDate = addHours(this.getCurrentDate(), -hours);
    const users = await chat.users.getInactive(sinceDate);

    if (!users.length) {
      const errorId = 'commands.list_inactive.empty';

      return this.telegramService
        .buildMessage(this.i18n.t(errorId, { hours }))
        .to(pm.chat_id)
        .replyTo(pm.message_id)
        .asMarkDown()
        .send();
    }

    const usersWithError = [];
    for (const u of users) {
      try {
        await this.telegramService.kickUser(u.id, pm.chat_id);

        u.status = 'kicked';
        await chat.users.update(u);
      } catch (error) {
        console.error('Error while kicking user:', error);
        usersWithError.push(u);
      }
    }

    const usersKicked = users.filter(
      u => !usersWithError.some(uwe => uwe.id === u.id)
    );

    const mentions = usersKicked
      .map(u => this.telegramService.getMentionFromId(u.id, u.first_name))
      .join(', ');

    await this.telegramService
      .buildMessage(
        this.i18n.t('commands.remove_inactives.successful', { mentions })
      )
      .to(pm.chat_id)
      .asMarkDown()
      .send();

    return Promise.resolve();
  }
}
