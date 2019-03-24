import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands, getUserChatFromMember } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.protect_user)
@Handler(BotCommands.remove_protected)
export class SetProtectedHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const pm = payload.plainMessage;
    const shouldProtect =
      payload.command.details.key === BotCommands.protect_user;

    const chat = payload.chat;
    let userIdToProtect = null;

    if (pm.is_reply) {
      userIdToProtect = pm.reply_from_id;
    } else {
      const text = pm.text.trim().split(' ');

      if (text.length !== 2) {
        return this.telegramService
          .buildMessage(this.i18n.t('commands.errors.nothing_to_do'))
          .to(pm.chat_id)
          .replyTo(pm.message_id)
          .asMarkDown()
          .send();
      }

      userIdToProtect = text.slice(-1)[0];
    }

    let userToProtect = await chat.users.findById(userIdToProtect);

    if (userToProtect) {
      userToProtect.protected = shouldProtect;
      await chat.users.update(userToProtect);
    } else {
      const chatMember = await this.telegramService.getChatMember(
        userIdToProtect,
        pm.chat_id
      );

      userToProtect = getUserChatFromMember(chatMember);
      userToProtect.protected = true;
      await chat.users.create(userToProtect);
    }

    const action = shouldProtect ? 'protect_user' : 'remove_protected';

    const mention = this.telegramService.getMentionFromId(
      userToProtect.id,
      userToProtect.first_name
    );

    await this.telegramService
      .buildMessage(
        this.i18n.t(`commands.${action}.successful`, {
          mention,
        })
      )
      .to(pm.chat_id)
      .replyTo(pm.message_id)
      .asMarkDown()
      .send();

    return Promise.resolve();
  }
}
