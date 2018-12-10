import { Db } from '../db';
import { Update } from 'telegram-typings';
import {
  getPlainMessage,
  getUpdateWithType,
  getBotCommand,
} from '../selectors';

import I18nProvider from '../I18nProvider';
import { ITelegramService } from '../services/telegram';
import { UserRole } from '../models';

export default async (
  db: Db,
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date
): Promise<void> => {
  const typedUpdate = getUpdateWithType(update);
  const plainMessage = getPlainMessage(typedUpdate);

  const isGroup = chatType => ['group', 'supergroup'].includes(chatType);

  if (!isGroup(plainMessage.chat_type)) {
    const errorId = 'errors.private_conversation.not_implemented';
    service.sendChat(plainMessage.chat_id, i18n.t(errorId));

    return;
  }

  const user = await db.getUserFromMessageOrDefault(plainMessage, currentDate);
  await db.saveChatStat(plainMessage, user, currentDate);

  if (plainMessage.entity_should_process) {
    const command = getBotCommand(plainMessage);
    if (!command) {
      const errorId = 'errors.commands.invalid';
      await service.sendChat(plainMessage.chat_id, i18n.t(errorId), {
        reply_to_message_id: plainMessage.message_id,
      });

      return;
    } else if (command.admin && user.role !== UserRole.admin) {
      const errorId = 'errors.commands.forbidden';
      await service.sendChat(plainMessage.chat_id, i18n.t(errorId), {
        reply_to_message_id: plainMessage.message_id,
      });
      return;
    }

    await service.sendChat(plainMessage.chat_id, 'tamo trabajando en eso bi', {
      reply_to_message_id: plainMessage.message_id,
    });
  }
};
