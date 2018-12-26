import { Db } from '../db';
import { Update } from 'telegram-typings';
import {
  getPlainMessage,
  getUpdateWithType,
  getBotCommand,
  BotCommands,
  getUserChatFromMember,
} from '../selectors';

import I18nProvider from '../I18nProvider';
import { ITelegramService, ParseMode } from '../services/telegram';
import { addHours } from 'date-fns';
import { Mediator } from 'tsmediator';
import { UserRole } from '../types';

export default async (
  db: Db,
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date
): Promise<void> => {
  const typedUpdate = getUpdateWithType(update);
  const pm = getPlainMessage(typedUpdate);
  const mediator = new Mediator();

  const isGroup = chatType => ['group', 'supergroup'].includes(chatType);

  if (!isGroup(pm.chat_type)) {
    const errorId = 'commands.errors.pm_not_implemented';
    await service.sendChat(pm.chat_id, i18n.t(errorId));
    return;
  }

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
    if (!command) {
      const errorId = 'commands.errors.invalid';
      await service.sendChat(pm.chat_id, i18n.t(errorId), {
        reply_to_message_id: pm.message_id,
      });

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
    } else if (command.key === BotCommands.protect_user) {
      mediator.Send(BotCommands.protect_user, {
        plainMessage: pm,
        protect: true,
      });
    } else if (command.key === BotCommands.remove_protected) {
      mediator.Send(BotCommands.remove_protected, {
        plainMessage: pm,
        protect: false,
      });
    } else if (command.key === BotCommands.list_inactives) {
      mediator.Send(BotCommands.list_inactives, { plainMessage: pm });
    } else if (command.key === BotCommands.list_protected) {
      mediator.Send(BotCommands.list_protected, { plainMessage: pm });
    } else if (command.key === BotCommands.remove_inactives) {
      const commandText = pm.text.split(' ');
      const hours = Number.parseInt(commandText[1]);

      if (commandText.length !== 2 || Number.isNaN(hours)) {
        const errorId = 'commands.errors.invalid';
        await service.sendChat(pm.chat_id, i18n.t(errorId), {
          reply_to_message_id: pm.message_id,
        });
        return;
      }

      const sinceDate = addHours(currentDate, -hours);
      const inactiveUsers = await db.getInactiveUsers(pm.chat_id, sinceDate);

      if (!inactiveUsers.length) {
        const errorId = 'commands.list_inactive.empty';
        await service.sendChat(pm.chat_id, i18n.t(errorId, { hours }), {
          parse_mode: ParseMode.Markdown,
          reply_to_message_id: pm.message_id,
        });
        return;
      }

      const usersWithError = [];
      for (const u of inactiveUsers) {
        try {
          await service.kickUser(
            u.id,
            pm.chat_id,
            addHours(currentDate, hours)
          );

          u.status = 'kicked';
          await db.updateChatUser(pm.chat_id, u);
        } catch (error) {
          console.error('Error while kicking user:', error.description);
          usersWithError.push(u);
        }
      }

      const usersKicked = inactiveUsers.filter(
        u => !usersWithError.some(uwe => uwe.id === u.id)
      );

      const mentions = usersKicked
        .map(u => service.getMentionFromId(u.id, u.first_name))
        .join(', ');

      await service.sendChat(
        pm.chat_id,
        i18n.t('commands.remove_inactive.successful', { mentions }),
        { parse_mode: ParseMode.Markdown }
      );
    } else if (command.key === BotCommands.enable_crush_mode) {
      await service.sendChat(
        pm.chat_id,
        i18n.t('commands.enable_crush_mode.successful'),
        { parse_mode: ParseMode.Markdown, reply_to_message_id: pm.message_id }
      );
    }
  }
};
