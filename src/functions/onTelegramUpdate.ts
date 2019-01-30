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
import { ChatRepository } from '../Repositories';

export default async (
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date,
  store: PermanentStore,
  chatRepository: ChatRepository
): Promise<void> => {
  // TODO: Add mediator middleware: scopes
  // TODO: Add mediator middleware: permissions
  const mediator = new Mediator();
  const pm = getPlainMessage(update);
  const command = getBotCommand(pm);

  let chat = await chatRepository.findById(pm.chat_id);

  if (!chat) {
    await chatRepository.create({ id: pm.chat_id });
    chat = await chatRepository.findById(pm.chat_id);
  }

  let messageFrom = await chat.users.findById(pm.from_id);

  await Promise.all([store.processMessage(pm), store.processUpdate(update)]);

  if (!messageFrom) {
    const tgUser = await service.getChatMember(pm.from_id, pm.chat_id);
    messageFrom = getUserChatFromMember(tgUser);
    await chat.users.create(messageFrom);
  }

  await chat.users.updateStat(messageFrom, currentDate);

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
