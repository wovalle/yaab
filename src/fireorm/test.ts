import * as MockFirebase from 'mock-cloud-firestore';
import BaseFirestoreRepository from './BaseFirestoreRepository';
import { fixtureData, User } from './fixture';
console.log(JSON.stringify(fixtureData));

const firebase = new MockFirebase(fixtureData, {
  isNaiveSnapshotListenerEnabled: false,
});
const firestore = firebase.firestore();

class UserRepository extends BaseFirestoreRepository<User> {}

const userRep = new UserRepository(firestore, 'users');

(async () => {
  const users = await userRep.find();
  const jen = await userRep.findById('jen');
  const roy = await userRep.whereGreaterOrEqualThan(
    'birthDate',
    new Date(1979, 1, 1)
  );

  console.log(users, jen, roy);
})();

// class Context extends UnitOfWork {
//   public Users: IRepository<User>;
// }

// const uof = new Context();

// uof.Users.where().where().find().

// uof.getRepository<User>().save(user);

// describe('entities', () => {

//   // must be type entity
// });

// uof.entities.User = something;

// uof.getRepository<User>

// // Averiguar como diablo buca todos los T dinamicamente
// // Registrar el set
