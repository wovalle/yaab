// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';

import * as functions from 'firebase-functions';
import importUsers from './functions/importUsers';
import onTelegramUpdate from './functions/onTelegramUpdate';
import TelegramService from './services/telegram';
import {
  ChatRepository,
  ChatMemberRepository,
  CrushRelationshipRepository,
} from './Repositories';
import Http from './Http';
import I18nProvider from './I18nProvider';
import * as translations from './translations.json';
import { Update } from 'telegram-typings';
import { Container, Token } from 'typedi';
import Analytics from './services/Analytics';
import * as admin from 'firebase-admin';

const logger = console;
const telegramKey = functions.config().telegram.key;
const fixedCrushGroup = functions.config().telegram.crush_group;
const mixpanelKey = functions.config().mixpanel.key;
const http = new Http();
const i18n = new I18nProvider(translations);
const telegramService = new TelegramService(telegramKey, http);

admin.initializeApp();
const firestore = admin.firestore();
const analytics = new Analytics(mixpanelKey);
const getDate = () => new Date();

// Section: fireorm
import { Chat } from './models/Chat';
import { CrushRelationship } from './models/CrushRelationship';
import { GetRepository, Initialize } from 'fireorm';
Initialize(firestore);

const chatRepository = GetRepository(Chat);
const crushRelationshipRepository = GetRepository(CrushRelationship);

export const ChatRepositoryToken = new Token<ChatRepository>('ChatRepository');
export const CrushRelationshipRepositoryToken = new Token<
  CrushRelationshipRepository
>('CrushRelationshipRepository');

// Section: initialize ioc
Container.set(TelegramService, telegramService);
Container.set(I18nProvider, i18n);
Container.set(ChatRepositoryToken, chatRepository);
Container.set(CrushRelationshipRepositoryToken, crushRelationshipRepository);
Container.set(Analytics, analytics);
Container.set('getCurrentDate', getDate);
Container.set('fixedCrushGroup', fixedCrushGroup);

// Section: initialize commands
import { ListProtectedHandler } from './Commands/ListProtectedHandler';
import { ListInactiveHandler } from './Commands/ListInactiveHandler';
import { SetProtectedHandler } from './Commands/SetProtectedHandler';
import { RemoveInactivesHandler } from './Commands/RemoveInactivesHandler';
import { StartHandler } from './Commands/StartHandler';
import { HelpHandler } from './Commands/HelpHandler';
import { AddCrushHandler } from './Commands/AddCrushHandler';
import { PrivateMessageHandler } from './Commands/PrivateMessageHandler';
import { BlockCrushHandler } from './Commands/BlockCrushHandler';
import { ListCrushHandler } from './Commands/ListCrushHandler';
import { SetCrushHandler } from './Commands/SetCrushHandler';

ListProtectedHandler.name;
ListInactiveHandler.name;
SetProtectedHandler.name;
RemoveInactivesHandler.name;
StartHandler.name;
HelpHandler.name;
ChatMemberRepository.name;
AddCrushHandler.name;
PrivateMessageHandler.name;
BlockCrushHandler.name;
ListCrushHandler.name;
SetCrushHandler.name;

export const importUsersInternalFn = functions.https.onRequest(
  async (req, res) => {
    const { users, groupId } = req.body;

    if (!users || !users.length) {
      return res.status(400).send('users parameter is required');
    }

    if (!groupId) {
      return res.status(400).send('groupId parameter is required');
    }

    try {
      const response = await importUsers(groupId, users);
      return res.send({ ok: true, ...response });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ ok: false });
    }
  }
);

export const onTelegramUpdateFn = functions.https.onRequest(
  async (req, res) => {
    const update: Update = req.body;

    logger.log('Update:', JSON.stringify(update, null, 2));

    if (!update) {
      return res.status(400).send('`message` parameter is required');
    }

    try {
      await onTelegramUpdate(
        update,
        telegramService,
        i18n,
        getDate(),
        analytics,
        chatRepository
      );

      return res.send({ ok: true });
    } catch (error) {
      logger.error(error);
      logger.error(JSON.stringify(update, null, 2));
      return res.status(200).send({ ok: false });
    }
  }
);
