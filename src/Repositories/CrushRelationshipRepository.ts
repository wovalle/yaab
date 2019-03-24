import { BaseFirestoreRepository, CustomRepository } from 'fireorm';
import { CrushRelationship } from '../models';

@CustomRepository(CrushRelationship)
class CrushRelationshipRepository extends BaseFirestoreRepository<
  CrushRelationship
> {
  async getByNick(nick: string) {
    return this.whereEqualTo('user_nickname', nick)
      .find()
      .then(r => r[0]);
  }

  async getMyCrushes(userId: string, status?: string) {
    let query = this.whereEqualTo('user_id', userId);
    if (status) {
      query = query.whereEqualTo('crush_status', status);
    }
    return query.find();
  }

  async getCrushesOfMine(userId: string, status?: string) {
    let query = this.whereEqualTo('crush_id', userId);
    if (status) {
      query = query.whereEqualTo('crush_status', status);
    }
    return query.find();
  }
}

export default CrushRelationshipRepository;
