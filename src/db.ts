import * as admin from 'firebase-admin';
import { PlainMessage } from './types';
import { ChatUser, UserRole } from './models';

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

  getProtectedUsers(groupId: Number): Promise<ChatUser[]> {
    const chatRef = this.db.collection(`chats`).doc(`${groupId}`);
    const userRef = chatRef.collection('users');

    return userRef
      .where('protected', '==', true)
      .get()
      .then(snap => snap.docs.map(d => parseDates(d.data()) as ChatUser));
  }

  async getInactiveUsers(groupId: Number, since: Date): Promise<ChatUser[]> {
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

  async setProtectedUser(
    chatId: Number,
    userId: Number,
    today: Date,
    _protected: boolean
  ) {
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

    batch.update(userRef, { protected: _protected });
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
