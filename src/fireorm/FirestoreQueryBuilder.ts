import QueryBuilder from './QueryBuilder';
import { IFirestoreVal } from './types';
import { WhereFilterOp, QuerySnapshot } from '@google-cloud/firestore';

export default class FirestoreQueryBuilder<T> extends QueryBuilder<T> {
  constructor(
    protected db: FirebaseFirestore.Firestore,
    protected colName: string
  ) {
    super();
  }

  // TODO: this isn't the place for this
  private extractTFromColSnap(q: QuerySnapshot): T[] {
    return q.docs.map(d => d.data() as T);
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
        const op = cur.operator as WhereFilterOp;
        return acc.where(cur.prop, op, cur.val);
      }, this.db.collection(this.colName))
      .get()
      .then(this.extractTFromColSnap);
  }
}
