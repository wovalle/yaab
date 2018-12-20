import * as MockFirebase from 'mock-cloud-firestore';
import BaseFirestoreRepository from './BaseFirestoreRepository';
import { fixtureData, User } from './fixture';
import { user } from 'firebase-functions/lib/providers/auth';
import { expect } from 'chai';

const firebase = new MockFirebase(fixtureData, {
  isNaiveSnapshotListenerEnabled: false,
});

// TODO: getRepository<User>()?
const firestore = firebase.firestore();

class UserRepository extends BaseFirestoreRepository<User> {}

describe('Repository', () => {
  const userRep = new UserRepository(firestore, 'users');
  describe('findById', () => {
    it('must find by id', async () => {
      const roy = await userRep.findById('roy');
      expect(roy.id).to.equal('roy');
      expect(roy.firstName).to.equal('Roy');
    });
    it('must return T');
    it('return null if not found');
  });
  describe('create', () => {
    it('must create item and return T');
  });
  describe('update', () => {
    it('must update and return updated item');
    it('must only update changed fields'); // TODO: Discuss
  });
  describe('delete', () => {
    it('must delete item');
    it('must throw if item is not found');
  });
  describe('.where*', () => {
    it('must throw if prop is not in T');
    it('must return T[]');
    it("must return same list if where filter doesn't apply");
    it('must filter with whereEqualTo');
    it('must filter with whereGreaterThan');
    it('must filter with whereGreaterOrEqualThan');
    it('must filter with whereLessThan');
    it('must filter with whereLessOrEqualThan');
    it('must filter with whereArrayCointain');
    it('must filter with two or more operators');
  });
});
