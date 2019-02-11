// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';

import * as functions from 'firebase-functions';
import importUsers from './functions/importUsers';
import updateLastMessageBetweenDates from './functions/updateLastMessageBetweenDates';
import fetchInactiveUsersWithinTimeframe from './functions/fetchInactiveUsersWithinTimeframe';
import onTelegramUpdate from './functions/onTelegramUpdate';
import TelegramService from './services/telegram';
import {
  ChatRepository,
  ChatMemberRepository,
  CrushRelationshipRepository,
} from './Repositories';
import DbSingleton, { Db } from './db';
import Http from './Http';
import I18nProvider from './I18nProvider';
import * as translations from './translations.json';
import { Update } from 'telegram-typings';
import { Container, Token } from 'typedi';
import PermanentStore from './services/PermanentStore';

const logger = console;
const db = DbSingleton.getInstance();
const telegramKey = functions.config().telegram.key;
const storageOpts = functions.config().permanent_store;
const fixedCrushGroup = functions.config().telegram.crush_group;
const http = new Http();
const i18n = new I18nProvider(translations);
const telegramService = new TelegramService(telegramKey, http);

const permanentStore = new PermanentStore(
  http,
  storageOpts.url,
  storageOpts.user,
  storageOpts.pass
);

const getDate = () => new Date();

// Section: fireorm
import { Chat } from './models/Chat';
import { CrushRelationship } from './models/CrushRelationship';
import { getRepository } from 'fireorm';

const chatRepository = getRepository(Chat, db._db);
const crushRelationshipRepository = getRepository(CrushRelationship, db._db);

export const ChatRepositoryToken = new Token<ChatRepository>('ChatRepository');
export const CrushRelationshipRepositoryToken = new Token<
  CrushRelationshipRepository
>('CrushRelationshipRepository');

// Section: initialize ioc
Container.set(TelegramService, telegramService);
Container.set(Db, db);
Container.set(I18nProvider, i18n);
Container.set(ChatRepositoryToken, chatRepository);
Container.set(CrushRelationshipRepositoryToken, crushRelationshipRepository);
Container.set(PermanentStore, permanentStore);
Container.set('getCurrentDate', getDate);
Container.set('fixedCrushGroup', fixedCrushGroup);

// Section: initialize commands
import { ListProtectedHandler } from './Commands/ListProtectedHandler';
import { ListInactiveHandler } from './Commands/ListInactiveHandler';
import { SetProtectedHandler } from './Commands/SetProtectedHandler';
import { RemoveInactivesHandler } from './Commands/RemoveInactivesHandler';
import { EnableCrushModeHandler } from './Commands/EnableCrushModeHandler';
import { StartHandler } from './Commands/StartHandler';
import { HelpHandler } from './Commands/HelpHandler';
import { AddCrushHandler } from './Commands/AddCrushHandler';
import { PrivateMessageHandler } from './Commands/PrivateMessageHandler';

ListProtectedHandler.name;
ListInactiveHandler.name;
SetProtectedHandler.name;
RemoveInactivesHandler.name;
EnableCrushModeHandler.name;
StartHandler.name;
HelpHandler.name;
Chat.name;
ChatMemberRepository.name;
AddCrushHandler.name;
PrivateMessageHandler.name;

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

export const updateLastMessageBetweenDatesFn = functions.https.onRequest(
  async (req, res) => {
    const { groupId, from, to } = req.body;

    if (!groupId) {
      return res.status(400).send('`groupId` parameter is required');
    }

    if (!from) {
      return res.status(400).send('invalid parameter `from`');
    }

    if (!to) {
      return res.status(400).send('invalid parameter `to`');
    }

    try {
      const payload = await updateLastMessageBetweenDates(
        db,
        telegramService,
        groupId,
        new Date(from),
        new Date(to)
      );
      return res.send({ ok: true, payload });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ ok: false });
    }
  }
);

export const fetchInactiveUsersWithinTimeframeFn = functions.https.onRequest(
  async (req, res) => {
    const { groupId, hours } = req.body;

    if (!groupId) {
      return res.status(400).send('`groupId` parameter is required');
    }

    if (!hours) {
      return res.status(400).send('invalid parameter `hours`');
    }
    try {
      const payload = await fetchInactiveUsersWithinTimeframe(
        db,
        groupId,
        hours,
        getDate()
      );
      return res.send({ ok: true, payload });
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
        permanentStore,
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
