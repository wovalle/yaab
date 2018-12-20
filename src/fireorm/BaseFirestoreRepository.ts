import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { IRepository, IFirestoreVal, IQueryBuilder } from './types';
import QueryBuilder from './QueryBuilder';

// TODO: pub/sub for realtime updates
export default abstract class BaseFirestoreRepository<T extends { id: string }>
  implements IRepository<T>, IQueryBuilder<T> {
  // TODO: Ordering
  // TODO: limit
  // TODO: open transactions? (probably in uof)
  // TODO: colname = classname unless param is passed

  constructor(
    protected db: FirebaseFirestore.Firestore,
    protected colName: string
  ) {}

  private extractTFromDocSnap(doc: DocumentSnapshot): T {
    return doc.exists ? (doc.data() as T) : null;
  }

  findById(id: string): Promise<T> {
    return this.db
      .collection(this.colName)
      .doc(id)
      .get()
      .then(this.extractTFromDocSnap);
  }

  create(item: T): Promise<T> {
    // TODO: Double operation here. Should construct T myself with ref.id?

    return this.db
      .collection(this.colName)
      .add(item)
      .then(ref => ref.get())
      .then(this.extractTFromDocSnap);
  }

  async update(item: T): Promise<T> {
    // TODO: handle errors
    await this.db
      .collection(this.colName)
      .doc(item.id)
      .update(item);
    return item;
  }

  async delete(id: string): Promise<void> {
    // TODO: handle errors
    await this.db.doc(id).delete();
  }

  find(): Promise<T[]> {
    return new QueryBuilder<T>(this.db, this.colName).find();
  }

  whereEqualTo(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereEqualTo(prop, val);
  }

  whereGreaterThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereGreaterThan(
      prop,
      val
    );
  }

  whereGreaterOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereGreaterOrEqualThan(
      prop,
      val
    );
  }

  whereLessThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereLessThan(prop, val);
  }

  whereLessOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereLessOrEqualThan(
      prop,
      val
    );
  }

  whereArrayCointain(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.db, this.colName).whereArrayCointain(
      prop,
      val
    );
  }
}
