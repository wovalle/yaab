import * as admin from 'firebase-admin';
import { TypedUpdate } from './types';

let instance = null;

class Db {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    admin.initializeApp();
    this.db = admin.firestore();
    this.db.settings({ timestampsInSnapshots: true });
  }

  saveRawUpdates(updates: TypedUpdate[]) {
    const batch = this.db.batch();

    updates.forEach(u => {
      const ref = this.db.collection('raw_updates').doc(u.id);
      batch.set(ref, u);
    });

    return batch.commit();
  }

  saveMessages(messages: TypedUpdate[]) {
    const batch = this.db.batch();
    const differentChats = messages.reduce((acc, cur) => {
      if (acc.indexOf(cur.message.chat.id) === -1) {
        acc.push(cur.message.chat.id);
      }
      return acc;
    }, []);

    differentChats.forEach(chatId => {
      const messagesInChat = messages.filter(m => m.message.chat.id === chatId);
      const chatRef = this.db.collection(`chats`).doc(`${chatId}`);

      messagesInChat.forEach(m => {
        const msgRef = chatRef.collection('messages').doc(`${m.update_id}`);
        batch.set(msgRef, m);
      });

      // tslint:disable-next-line:no-shadowed-variable
      const lastMessage = messagesInChat.slice(-1)[0];

      if (lastMessage) {
        const offsetRef = chatRef.collection('settings').doc('offset');
        batch.set(offsetRef, { val: lastMessage.update_id });
      }
    });

    return batch.commit();
  }
}

export default {
  getInstance: () => {
    if (!instance) {
      instance = new Db();
    }

    return instance;
  },
};
