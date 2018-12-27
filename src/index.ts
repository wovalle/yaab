// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';

import * as functions from 'firebase-functions';
import importUsers from './functions/importUsers';
import updateLastMessageBetweenDates from './functions/updateLastMessageBetweenDates';
import fetchInactiveUsersWithinTimeframe from './functions/fetchInactiveUsersWithinTimeframe';
import onTelegramUpdate from './functions/onTelegramUpdate';
import TelegramService from './services/telegram';
import DbSingleton, { Db } from './db';
import Http from './Http';
import I18nProvider from './I18nProvider';
import * as translations from './translations.json';
import { Update } from 'telegram-typings';
import { Container, Token } from 'typedi';

const logger = console;
const db = DbSingleton.getInstance();
const telegramKey = functions.config().telegram.key;
const http = new Http();
const i18n = new I18nProvider(translations);
const key = require('../.runtimeconfig.json').telegram.key;
const telegramService = new TelegramService(key, http);

const getDate = () => new Date();

// Section: fireorm
import { Chat } from './models/Chat';
import { getRepository, BaseFirestoreRepository } from './fireorm';

const chatRepository = getRepository<Chat>(db._db, 'chats');
export const ChatRepositoryToken = new Token<BaseFirestoreRepository<Chat>>(
  'ChatRepository'
);

// Section: initialize ioc
Container.set(TelegramService, telegramService);
Container.set(Db, db);
Container.set(I18nProvider, i18n);
Container.set(ChatRepositoryToken, chatRepository);
Container.set('getCurrentDate', getDate);

// Section: initialize commands
import { ListProtectedHandler } from './functions/Commands/ListProtectedHandler';
import { ListInactiveHandler } from './functions/Commands/ListInactiveHandler';
import { SetProtectedHandler } from './functions/Commands/SetProtectedHandler';
import { RemoveInactivesHandler } from './functions/Commands/RemoveInactivesHandler';
ListProtectedHandler.name;
ListInactiveHandler.name;
SetProtectedHandler.name;
RemoveInactivesHandler.name;
Chat.name;

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
      await importUsers(db, groupId, users);
      return res.send({ ok: true, usersAdded: users.length });
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

    if (!update) {
      return res.status(400).send('`message` parameter is required');
    }

    try {
      await onTelegramUpdate(db, update, telegramService, i18n, getDate());

      return res.send({ ok: true });
    } catch (error) {
      logger.error(error, update);
      return res.status(200).send({ ok: false, error });
    }
  }
);
