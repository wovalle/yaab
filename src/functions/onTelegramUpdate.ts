import { Db } from '../db';
import { Update } from 'telegram-typings';
import {
  getPlainMessage,
  getBotCommand,
  getUserChatFromMember,
  BotCommandScope,
} from '../selectors';

import I18nProvider from '../I18nProvider';
import { ITelegramService } from '../services/telegram';
import { Mediator } from 'tsmediator';
import { UserRole } from '../types';
import PermanentStore from '../services/PermanentStore';

export default async (
  db: Db,
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date,
  store: PermanentStore
): Promise<void> => {
  // TODO: Add mediator middleware: scopes
  // TODO: Add mediator middleware: permissions
  const pm = getPlainMessage(update);
  const mediator = new Mediator();

  const user = await db.getUserFromGroup(pm.chat_id, pm.from_id);
  await store.processMessage(pm);
  await store.processUpdate(update);

  if (!user) {
    const tgUser = await service.getChatMember(pm.from_id, pm.chat_id);
    await db.saveChatUser(
      pm.chat_id,
      getUserChatFromMember(tgUser),
      currentDate
    );
  }

  await db.saveChatStat(pm, user, currentDate);

  const command = getBotCommand(pm);

  if (!command.isValid && command.type === 'bot_command') {
    const errorId = 'commands.errors.invalid';
    await service.sendReply(pm.chat_id, pm.message_id, i18n.t(errorId));
  }

  if (command.isValid) {
    const commandScope = pm.chat_type as BotCommandScope;

    if (!command.details.scopes.includes(commandScope)) {
      const errorId = 'commands.errors.wrong_scope';

      const scopes = command.details.scopes
        .map(s => i18n.t(`enums.scopes.${s}`))
        .join(', ');

      await service.sendChat(
        pm.chat_id,
        i18n.t(errorId, { scopes, command: command.details.keyword }),
        {
          reply_to_message_id: pm.message_id,
        }
      );
      return;
    } else if (command.details.admin && user.role !== UserRole.admin) {
      const errorId = 'commands.errors.forbidden';
      await service.sendReply(
        pm.chat_id,
        pm.message_id,
        i18n.t(errorId, { cmd: command.details.key })
      );
      return;
    } else {
      try {
        await mediator.Send(command.details.key, {
          plainMessage: pm,
          command,
        });
      } catch (error) {
        console.log(error);
        console.error(
          'Error on Telegram Update',
          JSON.stringify(error, null, 2)
        );

        await service.sendReply(
          pm.chat_id,
          pm.message_id,
          i18n.t('commands.errors.internal')
        );
      }
    }
  }
};
