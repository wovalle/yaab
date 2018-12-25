// tslint:disable-next-line:no-import-side-effect
import 'reflect-metadata';

import {
  IRepository,
  IFirestoreVal,
  IQueryBuilder,
  FirestoreCollectionType,
} from './types';

import {
  Firestore,
  DocumentSnapshot,
  CollectionReference,
} from '@google-cloud/firestore';

import QueryBuilder from './QueryBuilder';
import { getMetadataStorage } from './MetadataStorage';

export default class BaseFirestoreRepository<T extends { id: string }>
  implements IRepository<T>, IQueryBuilder<T> {
  // TODO: Ordering
  // TODO: pub/sub for realtime updates
  // TODO: limit
  // TODO: open transactions? (probably in uof)
  // TODO: colname = classname unless param is passed
  // TODO: @createdOnField, @updatedOnField
  // TODO: well defined types, investigate
  // TODO: register repository in metadata

  public collectionType: FirestoreCollectionType;
  private firestoreCollection: CollectionReference;

  constructor(db: Firestore, colName: string);
  constructor(
    db: Firestore,
    colName: string,
    docId: string,
    subColName: string
  );

  constructor(
    protected db: Firestore,
    protected colName: string,
    protected docId?: string,
    protected subColName?: string
  ) {
    if (this.docId) {
      this.collectionType = FirestoreCollectionType.subcollection;
      this.firestoreCollection = this.db
        .collection(this.colName)
        .doc(this.docId)
        .collection(this.subColName);
    } else {
      this.collectionType = FirestoreCollectionType.collection;
      this.firestoreCollection = this.db.collection(this.colName);
    }
  }

  private extractTFromDocSnap = (doc: DocumentSnapshot): T => {
    if (!doc.exists) {
      return null;
    }

    const entity = this.parseTimestamp(doc.data() as T);

    const subcollections = getMetadataStorage().subCollections.filter(
      sc => sc.collection === this.colName
    );

    subcollections.forEach(subCol => {
      // tslint:disable-next-line:no-shadowed-variable
      const T = subCol.entity;
      Object.assign(entity, {
        [subCol.attribute]: new BaseFirestoreRepository<T>(
          this.db,
          this.colName,
          doc.id,
          subCol.subcollection
        ),
      });
    });

    return entity;
  };

  private parseTimestamp = (obj: T): T => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && 'toDate' in obj[key]) {
        obj[key] = obj[key].toDate();
      } else if (typeof obj[key] === 'object') {
        this.parseTimestamp(obj[key]);
      }
    });

    return obj;
  };

  findById(id: string): Promise<T> {
    return this.firestoreCollection
      .doc(id)
      .get()
      .then(this.extractTFromDocSnap);
  }

  create(item: T): Promise<T> {
    // TODO: Double operation here. Should construct T myself with ref.id?

    return this.firestoreCollection
      .add(item)
      .then(ref => ref.get())
      .then(this.extractTFromDocSnap);
  }

  async update(item: T): Promise<T> {
    // TODO: handle errors
    await this.firestoreCollection.doc(item.id).update(item);
    return item;
  }

  async delete(id: string): Promise<void> {
    // TODO: handle errors
    await this.firestoreCollection.doc(id).delete();
  }

  find(): Promise<T[]> {
    return new QueryBuilder<T>(this.firestoreCollection).find();
  }

  whereEqualTo(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.firestoreCollection).whereEqualTo(
      prop,
      val
    );
  }

  whereGreaterThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.firestoreCollection).whereGreaterThan(
      prop,
      val
    );
  }

  whereGreaterOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(
      this.firestoreCollection
    ).whereGreaterOrEqualThan(prop, val);
  }

  whereLessThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.firestoreCollection).whereLessThan(
      prop,
      val
    );
  }

  whereLessOrEqualThan(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.firestoreCollection).whereLessOrEqualThan(
      prop,
      val
    );
  }

  whereArrayCointain(prop: keyof T, val: IFirestoreVal): QueryBuilder<T> {
    return new QueryBuilder<T>(this.firestoreCollection).whereArrayCointain(
      prop,
      val
    );
  }
}

// TODO: after registering repositories in metadata storage, return single instance
// TODO: or make it singleton?
export function getRepository<T extends { id: string }>(
  db: Firestore,
  dbCol: string
) {
  return new BaseFirestoreRepository<T>(db, dbCol);
}
