import admin from 'firebase-admin';
import { GetRepository, BaseFirestoreRepository, Initialize } from 'fireorm';

import { Chat } from '../src/models/Chat';
import TelegramService from '../src/services/telegram';
import Http from '../src/Http';
import { telegram } from '../.runtimeconfig.json';
import { getUserSearchKeywords } from '../src/selectors';
const emojiStrip = require('emoji-strip');

const serviceAccount = require('../firebase.creds.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const firestore = admin.firestore();

Initialize(firestore);

const groupId = telegram.crush_group;
async function init() {
  const chatRepository = GetRepository(Chat) as BaseFirestoreRepository<Chat>;
  const chat = await chatRepository.findById(groupId);

  const users = await chat.users.find();
  const telegramService = new TelegramService(telegram.key, new Http());

  const errors = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    try {
      const tgUser = await telegramService.getChatMember(user.id, groupId);
      const firstName = emojiStrip(tgUser.user.first_name);
      const lastName = emojiStrip(tgUser.user.last_name || '') || null;
      const username = emojiStrip(tgUser.user.username || '');

      user.first_name = firstName;
      user.last_name = lastName;
      user.username = username;
      user.crush_status = 'enabled';
      user.search_keywords = getUserSearchKeywords(
        firstName,
        lastName,
        username
      );
      user.last_message = user.last_message ? user.last_message : null;
      await chat.users.update(user);
    } catch (err) {
      errors.push([user.id, err]);
    }

    if (i % 10 === 0 && i !== 0) {
      console.log(
        `#${i - errors.length} users updated, ${errors.length} errors`
      );
    }
  }

  console.log('--- FINISH ---');
  console.log(`Users: ${users.length}, Errors: ${errors.length}`);
  console.log(JSON.stringify(errors, null, 2));
}

init().catch(e => {
  console.error('Catch', e);
});
