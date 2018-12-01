import * as admin from 'firebase-admin';
import { TypedUpdate, PlainMessage } from './types';

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

  saveMessages(messages: PlainMessage[]) {
    const batch = this.db.batch();
    const differentChats = messages.reduce((acc, cur) => {
      if (acc.indexOf(cur.chat_id) === -1) {
        acc.push(cur.chat_id);
      }
      return acc;
    }, []);
    differentChats.forEach(chatId => {
      const messagesInChat = messages.filter(m => m.chat_id === chatId);
      const chatRef = this.db.collection(`chats`).doc(`${chatId}`);

      messagesInChat.forEach(m => {
        const msgRef = chatRef.collection('messages').doc(`${m.update_id}`);
        batch.set(msgRef, m);
      });
    });

    // tslint:disable-next-line:no-shadowed-variable
    const lastMessage = messages.slice(-1)[0];

    if (lastMessage) {
      const settingsRef = this.db.collection('settings').doc('offset');
      batch.set(settingsRef, { val: lastMessage.update_id + 1 });
    }

    return batch.commit();
  }

  getOffset() {
    return this.db
      .collection('settings')
      .doc('offset')
      .get()
      .then(d => d.data() || {});
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
