import admin from 'firebase-admin';
import { GetRepository, BaseFirestoreRepository, Initialize } from 'fireorm';

import { Chat } from '../src/models/Chat';

const serviceAccount = require('../firebase.creds.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const firestore = admin.firestore();
Initialize(firestore);

const groupId = 'groupId';
async function init() {
  const chatRepository = GetRepository(Chat) as BaseFirestoreRepository<Chat>;
  const chat = await chatRepository.findById(groupId);
  const kickedUsers = await chat.users.whereEqualTo('status', 'kicked').find();
  const leftUsers = await chat.users.whereEqualTo('status', 'left').find();
  const users = [...kickedUsers, ...leftUsers];

  const errors = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];

    try {
      await chat.users.delete(user.id);
    } catch (err) {
      errors.push([user.id, err]);
    }

    if (i % 10 === 0 && i !== 0) {
      console.log(
        `#${i - errors.length} users deleted, ${errors.length} errors`
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
