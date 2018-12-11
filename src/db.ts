import * as admin from 'firebase-admin';
import {
  TypedUpdate,
  PlainMessage,
  NewChatMembersEventData,
  EventType,
  LeftChatMemberEventData,
} from './types';
import { User } from 'telegram-typings';
import { ChatUser, UserStatus, UserRole } from './models';

let instance = null;

const cleanUndefined = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] && typeof obj[key] === 'object') cleanUndefined(obj[key]);
    else if (obj[key] === undefined) obj[key] = null;
  });
  return obj;
};

const parseDates = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] instanceof admin.firestore.Timestamp)
      obj[key] = obj[key].toDate();
    else if (obj[key] && typeof obj[key] === 'object') parseDates(obj[key]);
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

  retreiveMessagesInRange(
    groupId: Number,
    from: Date,
    to: Date
  ): Promise<PlainMessage[]> {
    return this.db
      .collection('chats')
      .doc(`${groupId}`)
      .collection('messages')
      .where('date', '>=', from)
      .where('date', '<=', to)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data())));
  }

  retreiveUsersFromGroup(groupId: Number) {
    return this.db
      .collection('chats')
      .doc(`${groupId}`)
      .collection('users')
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatUser));
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
        const newUsersToAdd = newInChatEvents.reduce(
          (acc, cur) => [
            ...acc,
            ...(cur.event_data as NewChatMembersEventData),
          ],
          []
        );

        const usersAddedData = {
          event: 'users_added',
          count: newUsersToAdd.length,
          ref: newUsersToAdd,
          date: new Date(),
        };
        batch.set(usersEventDoc, usersAddedData);
      }

      if (leftChatEvents.length) {
        const userLeftDoc = internalEventRef.doc();
        const leftChatUsers = leftChatEvents.reduce(
          (acc, cur) => [...acc, cur.event_data],
          []
        );

        const userLeftData = {
          event: 'users_deleted',
          count: 1,
          ref: leftChatUsers,
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

  getUserFromGroup(
    groupId: Number,
    userId: Number | string
  ): Promise<ChatUser> {
    const chatRef = this.db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users').doc(`${userId}`);

    return userRef
      .get()
      .then(snap => (snap.exists ? (snap.data() as ChatUser) : null));
  }

  async getInactiveUsers(groupId: Number, since: Date): Promise<ChatUser[]> {
    console.log({ groupId, since });
    const chatRef = this.db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users');

    const inactives = await userRef
      .where('last_message', '<=', since)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatUser));

    const nullUsers = await userRef
      .where('last_message', '==', null)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data() as ChatUser)));

    return inactives
      .concat(nullUsers)
      .filter(u => !u.is_bot)
      .filter(u => !u.protected)
      .filter(u => !['kicked', 'left', 'creator'].includes(u.status))
      .filter(u => u.role !== UserRole.admin);
  }

  async saveChatUser(chatId: Number, user: ChatUser, today: Date) {
    const batch = this.db.batch();

    const chatRef = this.db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${user.id}`);
    const internalEventRef = chatRef.collection('internal_events');
    const internalEventDoc = internalEventRef.doc();

    const event = {
      event: 'user_updated',
      ref: { user },
      date: today,
    };

    batch.set(userRef, cleanUndefined(user));
    batch.set(internalEventDoc, cleanUndefined(event));
    return batch.commit();
  }

  async updateChatUser(chatId: Number, user: ChatUser) {
    const chatRef = this.db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${user.id}`);

    return userRef.update(user);
  }

  async protectUser(chatId: Number, userId: Number, today: Date) {
    const batch = this.db.batch();

    const chatRef = this.db.collection('chats').doc(`${chatId}`);
    const userRef = chatRef.collection('users').doc(`${userId}`);
    const internalEventRef = chatRef.collection('internal_events');
    const internalEventDoc = internalEventRef.doc();

    const event = {
      event: 'user_protected',
      ref: { userId },
      date: today,
    };

    batch.update(userRef, { protected: true });
    batch.set(internalEventDoc, event);
    return batch.commit();
  }

  async saveChatStat(message: PlainMessage, user: ChatUser, today: Date) {
    const batch = this.db.batch();

    const chatRef = this.db.collection(`chats`).doc(`${message.chat_id}`);
    const msgRef = chatRef.collection('messages').doc(`${message.update_id}`);
    batch.set(msgRef, cleanUndefined(message));

    const userRef = chatRef.collection('users').doc(`${message.from_id}`);

    batch.update(userRef, { last_message: today, status: 'active' });
    return batch.commit();
  }

  async insertUsersInGroup(usersToImport: ChatUser[], groupId: Number) {
    if (!usersToImport.length) return null;

    const batch = this.db.batch();
    const batch_id = Date.now();
    const groupRef = this.db.collection(`chats`).doc(`${groupId}`);
    const internalEventRef = groupRef.collection('internal_events');

    const existingUsers = await groupRef
      .collection('users')
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data() as ChatUser)));

    for (const user of usersToImport) {
      if (!existingUsers.some(u => u.id === user.id)) {
        const userRef = groupRef.collection('users').doc(`${user.id}`);
        batch.set(userRef, user);
      }
    }

    const usersEventDoc = internalEventRef.doc();

    const usersAddedData = {
      event: 'users_imported',
      count: usersToImport.length,
      ref: { batch_id, usersToImport },
      date: new Date(),
    };

    batch.set(usersEventDoc, usersAddedData);
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
