import QueryBuilder from './QueryBuilder';
import { IFirestoreVal } from './types';

export default class FirestoreQueryBuilder<T> extends QueryBuilder<T> {
  constructor(
    protected db: FirebaseFirestore.Firestore,
    protected colName: string
  ) {
    super();
  }

  whereEqualTo(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(this.db, this.colName).whereEqualTo(
      prop,
      val
    );
  }

  whereGreaterThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(this.db, this.colName).whereGreaterThan(
      prop,
      val
    );
  }

  whereGreaterOrEqualThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(
      this.db,
      this.colName
    ).whereGreaterOrEqualThan(prop, val);
  }

  whereLessThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(this.db, this.colName).whereLessThan(
      prop,
      val
    );
  }

  whereLessOrEqualThan(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(
      this.db,
      this.colName
    ).whereLessOrEqualThan(prop, val);
  }

  whereArrayCointain(prop: string, val: IFirestoreVal): QueryBuilder<T> {
    return new FirestoreQueryBuilder<T>(
      this.db,
      this.colName
    ).whereArrayCointain(prop, val);
  }

  find(): Promise<T[]> {
    return this.queries
      .reduce((acc, cur) => {
        return acc.where(cur.prop, cur.operator, cur.val);
      }, this.db.collection(this.colName))
      .get(); //TODO: limpiar (devolver T y cambiar la fecha)
  }
}
