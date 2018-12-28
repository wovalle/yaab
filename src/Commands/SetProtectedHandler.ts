import { Handler, ICommandHandler } from 'tsmediator';
import Container from 'typedi';

import TelegramService from '../services/telegram/TelegramService';
import { BotCommands, getUserChatFromMember } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ParseMode } from '../services/telegram';
import { PlainMessage, Chat } from '../models';
import { BaseFirestoreRepository } from '../fireorm';
import { ChatRepositoryToken } from '../';
import { ITelegramHandlerPayload } from '../types';

// TODO: send pm summary with users tagged, bots and protected
@Handler(BotCommands.protect_user)
@Handler(BotCommands.remove_protected)
export class SetProtectedHandler
  implements ICommandHandler<ITelegramHandlerPayload, void> {
  private telegramService: TelegramService;
  private i18n: I18nProvider;
  private chatRepository: BaseFirestoreRepository<Chat>;

  constructor() {
    this.telegramService = Container.get(TelegramService);
    this.i18n = Container.get(I18nProvider);
    this.chatRepository = Container.get(ChatRepositoryToken);
  }

  async Handle(payload: ITelegramHandlerPayload) {
    const pm = payload.plainMessage;
    const shouldProtect = payload.command.key === BotCommands.protect_user;

    const chat = await this.chatRepository.findById(`${pm.chat_id}`);

    let userIdToProtect = null;

    if (pm.is_reply) {
      userIdToProtect = pm.reply_from_id;
    } else {
      const text = pm.text.trim().split(' ');

      if (text.length !== 2) {
        await this.telegramService.sendChat(
          pm.chat_id,
          this.i18n.t('commands.errors.nothing_to_do'),
          {
            reply_to_message_id: pm.message_id,
            parse_mode: ParseMode.Markdown,
          }
        );
        return;
      }

      userIdToProtect = text.slice(-1)[0];
    }

    let userToProtect = await chat.users.findById(userIdToProtect);

    // TODO: Write in system events
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

    await this.telegramService.sendChat(
      pm.chat_id,
      this.i18n.t(`commands.${action}.successful`, {
        name: this.telegramService.getMentionFromId(
          userToProtect.id,
          userToProtect.first_name
        ),
      }),
      {
        reply_to_message_id: pm.message_id,
        parse_mode: ParseMode.Markdown,
      }
    );
  }

  // tslint:disable-next-line:no-empty
  Validate(payload: ITelegramHandlerPayload): void {}
  // tslint:disable-next-line:no-empty
  Log(): void {}
}