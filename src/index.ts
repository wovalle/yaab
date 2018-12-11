import * as functions from 'firebase-functions';
import processTelegramUpdates from './functions/processTelegramUpdates';
import importUsers from './functions/importUsers';
import fetchMessagesByDate from './functions/fetchMessagesByDate';
import updateLastMessageBetweenDates from './functions/updateLastMessageBetweenDates';
import fetchInactiveUsersWithinTimeframe from './functions/fetchInactiveUsersWithinTimeframe';
import onTelegramUpdate from './functions/onTelegramUpdate';
import TelegramService from './services/telegram';
import Db from './db';
import Http from './Http';
import I18nProvider from './I18nProvider';
import * as translations from './translations.json';
import { Update } from 'telegram-typings';

const logger = console;
const db = Db.getInstance();
const telegramKey = functions.config().telegram.key;
const http = new Http();
const i18n = new I18nProvider(translations);
const telegramService = new TelegramService(telegramKey, http);

const url = `https://api.telegram.org/bot${telegramKey}/getupdates`;
const getDate = () => new Date();

export const processTelegramUpdatesFn = functions.https.onRequest(
  async (_, res) => {
    try {
      const updates = await processTelegramUpdates(db, logger, url);
      return res.send({ ok: true, updates: updates.length });
    } catch (error) {
      logger.error(error);
      return res.status(500).send({ ok: false });
    }
  }
);

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

export const fetchMessagesByDateFn = functions.https.onRequest(
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
      const payload = await fetchMessagesByDate(
        db,
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
      logger.error(error);
      return res.status(500).send({ ok: false, error });
    }
  }
);
