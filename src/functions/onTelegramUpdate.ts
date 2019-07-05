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
import Analytics from '../services/Analytics';
import { ChatRepository } from '../Repositories';

export default async (
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date,
  analytics: Analytics,
  chatRepository: ChatRepository
): Promise<void> => {
  // TODO: Add mediator middleware: scopes
  // TODO: Add mediator middleware: permissions
  const mediator = new Mediator();
  const pm = getPlainMessage(update);
  const command = getBotCommand(pm);

  // console.log(JSON.stringify(command, null, 2));
  // console.log(JSON.stringify(pm, null, 2));

  let chat = await chatRepository.findById(pm.chat_id);

  if (!chat) {
    await chatRepository.create({ id: pm.chat_id });
    chat = await chatRepository.findById(pm.chat_id);
  }

  let messageFrom = await chat.users.findById(pm.from_id);

  if (!messageFrom) {
    const tgUser = await service.getChatMember(pm.from_id, pm.chat_id);
    messageFrom = getUserChatFromMember(tgUser);
    await chat.users.create(messageFrom);
  }

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

      await service.sendReply(
        pm.chat_id,
        pm.message_id,
        i18n.t(errorId, { scopes, command: command.details.keyword })
      );
      return;
    } else if (command.details.admin && messageFrom.role !== UserRole.admin) {
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
          chat,
          messageFrom,
        });
      } catch (error) {
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

  await Promise.all([
    chat.users.updateStat(messageFrom, currentDate),
    analytics.processMessage(pm),
    analytics.processUpdate(update),
  ]);
};
