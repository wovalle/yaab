import { Db } from '../db';
import { Update } from 'telegram-typings';
import {
  getPlainMessage,
  getUpdateWithType,
  getBotCommand,
  BotCommands,
  getUserChatFromMember,
  BotCommandScope,
} from '../selectors';

import I18nProvider from '../I18nProvider';
import { ITelegramService } from '../services/telegram';
import { Mediator } from 'tsmediator';
import { UserRole } from '../types';

export default async (
  db: Db,
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date
): Promise<void> => {
  // TODO: get rid of typedUpdate
  // TODO: Add mediator middleware: scopes
  // TODO: Add mediator middleware: permissions

  const typedUpdate = getUpdateWithType(update);
  const pm = getPlainMessage(typedUpdate);
  const mediator = new Mediator();

  const user = await db.getUserFromGroup(pm.chat_id, pm.from_id);

  if (!user) {
    const tgUser = await service.getChatMember(pm.from_id, pm.chat_id);
    await db.saveChatUser(
      pm.chat_id,
      getUserChatFromMember(tgUser),
      currentDate
    );
  }

  await db.saveChatStat(pm, user, currentDate);

  if (pm.entity_should_process) {
    const command = getBotCommand(pm);
    const commandScope = pm.chat_type as BotCommandScope;

    if (!command) {
      const errorId = 'commands.errors.invalid';
      await service.sendChat(pm.chat_id, i18n.t(errorId), {
        reply_to_message_id: pm.message_id,
      });

      return;
    } else if (!command.scopes.includes(commandScope)) {
      const errorId = 'commands.errors.wrong_scope';

      const scopes = command.scopes
        .map(s => i18n.t(`enums.scopes.${s}`))
        .join(', ');

      await service.sendChat(
        pm.chat_id,
        i18n.t(errorId, { scopes, command: command.keyword }),
        {
          reply_to_message_id: pm.message_id,
        }
      );
      return;
    } else if (command.admin && user.role !== UserRole.admin) {
      const errorId = 'commands.errors.forbidden';
      await service.sendChat(
        pm.chat_id,
        i18n.t(errorId, { cmd: command.key }),
        {
          reply_to_message_id: pm.message_id,
        }
      );
      return;
    } else {
      mediator.Send(command.key, {
        plainMessage: pm,
        command,
      });
    }
  }
};
