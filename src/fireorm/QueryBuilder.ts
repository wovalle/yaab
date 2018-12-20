import {
  IQueryBuilder,
  IFireOrmQueryLine,
  IFirestoreVal,
  FirestoreOperators,
  IQueryBuilderResult,
} from './types';
import { WhereFilterOp, QuerySnapshot } from '@google-cloud/firestore';

export default class QueryBuilder<T> implements IQueryBuilder<T> {
  // TODO: validate not doing range fields in different fields
  constructor(
    protected db: FirebaseFirestore.Firestore,
    protected colName: string
  ) {}

  protected queries: Array<IFireOrmQueryLine> = [];

  whereEqualTo(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.equal,
    });
    return this;
  }

  whereGreaterThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.greaterThan,
    });
    return this;
  }

  whereGreaterOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.greaterThanEqual,
    });
    return this;
  }

  whereLessThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.lessThan,
    });
    return this;
  }

  whereLessOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.lessThanEqual,
    });
    return this;
  }

  whereArrayCointain(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    this.queries.push({
      prop: prop.toString(),
      val,
      operator: FirestoreOperators.arrayContains,
    });
    return this;
  }

  getQuery(): IQueryBuilderResult {
    return this.queries;
  }

  // TODO: this isn't the place for this
  private extractTFromColSnap(q: QuerySnapshot): T[] {
    return q.docs.map(d => d.data() as T);
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
