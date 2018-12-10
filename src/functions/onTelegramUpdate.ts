import { Db } from '../db';
import { Update } from 'telegram-typings';
import { getPlainMessage, getUpdateWithType } from '../selectors';
import I18nProvider from '../I18nProvider';
import { ITelegramService } from '../services/telegram';

export interface IOnTelegramUpdateResponse {
  valid: boolean;
  error?: string;
}

export default async (
  db: Db,
  update: Update,
  service: ITelegramService,
  i18n: I18nProvider,
  currentDate: Date
): Promise<IOnTelegramUpdateResponse> => {
  const typedUpdate = getUpdateWithType(update);
  const plainMessage = getPlainMessage(typedUpdate);

  const isGroup = chatType => ['group', 'supergroup'].includes(chatType);

  if (!isGroup(plainMessage.chat_type)) {
    service.sendChat(
      plainMessage.chat_id,
      i18n.t('errors.private_conversation.not_implemented')
    );

    return {
      valid: false,
      error: 'errors.private_conversation.not_implemented',
    };
  }

  await db.saveMessageStat(plainMessage, currentDate);

  return { valid: true };
};
