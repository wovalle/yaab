import admin from 'firebase-admin';
import { GetRepository, BaseFirestoreRepository, Initialize } from 'fireorm';

import { Chat } from '../src/models/Chat';
import TelegramService from '../src/services/telegram';
import Http from '../src/Http';
import data from '../.runtimeconfig.json';
import { getUserSearchKeywords } from '../src/selectors';

const serviceAccount = require('../firebase.creds.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${
    data.firebase.service_account.project_id
  }.firebaseio.com`,
});

const firestore = admin.firestore();
firestore.settings({
  timestampsInSnapshots: true,
});

Initialize(firestore);

const groupId = data.telegram.crush_group;
async function init() {
  const chatRepository = GetRepository(Chat) as BaseFirestoreRepository<Chat>;
  const chat = await chatRepository.findById(groupId);
  const users = await chat.users.find();
  const telegramService = new TelegramService(data.telegram.key, new Http());

  const errors = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    try {
      const tgUser = await telegramService.getChatMember(user.id, groupId);
      user.first_name = tgUser.user.first_name || null;
      user.last_name = tgUser.user.last_name || null;
      user.username = tgUser.user.username || null;
      user.crush_status = 'enabled';
      user.search_keywords = getUserSearchKeywords(tgUser);
      user.last_message = user.last_message
        ? (user.last_message as any).toDate()
        : null;
      await chat.users.update(user);
    } catch (err) {
      errors.push([user.id, err]);
    }

    if (i % 10 === 0) {
      console.log(`#${i} users updated`);
    }
  }

  console.log('--- FINISH ---');
  console.log(`Users: ${users.length}, Errors: ${errors.length}`);
  console.log(JSON.stringify(errors, null, 2));
}

init().catch(e => {
  console.error('Catch', e);
});
