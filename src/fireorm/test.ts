import BaseFirestoreRepository from './BaseFirestoreRepository';

class User {
  id: string;
  firstName: string;
  lastName: string;
}

class UserRepository extends BaseFirestoreRepository<User> {}

const userRep = new UserRepository();

userRep.whereEqualTo('as', 'as').find();

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
