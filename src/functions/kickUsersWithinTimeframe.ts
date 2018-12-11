import { IFetchInteractionBetweenDatesResponse } from './updateLastMessageBetweenDates';
import { ITelegramService, ParseMode } from '../services/telegram';
import { ITranslationProvider } from '../I18nProvider';
import { addHours } from 'date-fns';

export default async (
  groupId: Number,
  telegramService: ITelegramService,
  currentDate: Date,
  i18n: ITranslationProvider,
  fetchInteractionsResponse: IFetchInteractionBetweenDatesResponse
): Promise<any> => {
  const userWithNoInteraction = fetchInteractionsResponse.users.filter(
    u => u.messageCount === 0
  );

  const usersWithError = [];
  for (const u of userWithNoInteraction) {
    try {
      await telegramService.kickUser(u.id, groupId, addHours(currentDate, 12));
    } catch (error) {
      console.error('Error while kicking user:', error.description);
      usersWithError.push(u);
    }
  }

  const usersKicked = userWithNoInteraction.filter(
    u => !usersWithError.some(uwe => uwe.id === u.id)
  );

  const usersMentions = usersKicked
    .map(u => telegramService.getMentionFromId(u.id, u.firstName))
    .join(', ');

  if (usersKicked.length) {
    const groupNotificationMessage = i18n.t('actions.users.kick_inactive', {
      count: usersKicked.length,
      users: usersMentions,
    });

    await telegramService.sendChat(groupId, groupNotificationMessage, {
      parse_mode: ParseMode.Markdown,
    });
  }

  return {
    usersWithError,
    usersKicked,
  };
};
