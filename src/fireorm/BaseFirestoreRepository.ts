import FirestoreQueryBuilder from './FirestoreQueryBuilder';
import { QuerySnapshot } from '@google-cloud/firestore';
import { DocumentSnapshot } from 'firebase-functions/lib/providers/firestore';
import { IRepository } from './types';

// TODO: pub/sub for realtime updates
export default abstract class BaseFirestoreRepository<T extends { id: string }>
  extends FirestoreQueryBuilder<T>
  implements IRepository<T> {
  // TODO: Ordering
  // TODO: limit
  // TODO: open transactions? (probably in uof)
  // TODO: had to remove constructor since is implemented in FirestoreQueryBuilder. Good shot?

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
}
