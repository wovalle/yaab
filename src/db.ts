import * as admin from 'firebase-admin';
import {
  TypedUpdate,
  PlainMessage,
  NewChatMembersEventData,
  EventType,
  LeftChatMemberEventData,
} from './types';
import { access } from 'fs';

let instance = null;

const cleanUndefined = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') cleanUndefined(obj[key]);
    else if (obj[key] === undefined) obj[key] = null;
  });
  return obj;
};

export class Db {
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
      batch.set(ref, cleanUndefined(u));
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
      const internalEventRef = chatRef.collection('internal_events');

      const newInChatEvents = messagesInChat.filter(
        m => m.is_event && m.event_type === EventType.new_chat_members
      );

      const leftChatEvents = messagesInChat.filter(
        m => m.is_event && m.event_type === EventType.left_chat_member
      );

      messagesInChat.forEach(m => {
        const msgRef = chatRef.collection('messages').doc(`${m.update_id}`);
        batch.set(msgRef, cleanUndefined(m));
      });

      newInChatEvents.forEach(m => {
        const newUsers = m.event_data as NewChatMembersEventData;
        newUsers.forEach(u => {
          const userRef = chatRef.collection('users').doc(`${u.id}`);
          batch.set(userRef, u);
        });
      });

      leftChatEvents.forEach(m => {
        const user = m.event_data as LeftChatMemberEventData;
        const userRef = chatRef.collection('users').doc(`${user.id}`);
        batch.delete(userRef);
      });

      if (newInChatEvents.length) {
        const usersEventDoc = internalEventRef.doc();
        const usersAddedData = {
          event: 'users_added',
          count: newInChatEvents.reduce(
            (acc, cur) =>
              acc + (cur.event_data as NewChatMembersEventData).length,
            0
          ),
          date: new Date(),
        };
        batch.set(usersEventDoc, usersAddedData);
      }

      if (newInChatEvents.length) {
        const userLeftDoc = internalEventRef.doc();
        const userLeftData = {
          event: 'users_deleted',
          count: 1,
          date: new Date(),
        };
        batch.set(userLeftDoc, userLeftData);
      }

      const messagesAddedDoc = internalEventRef.doc();
      const messagesAddedData = {
        event: 'messages_added',
        count: messagesInChat.length,
        date: new Date(),
      };

      /*
        TODO: newInChats/leftChat/internalEvents should be db triggers!
      */

      batch.set(messagesAddedDoc, messagesAddedData);
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

const getInstance: () => Db = () => {
  if (!instance) {
    instance = new Db();
  }

  return instance;
};

export default {
  getInstance,
};
