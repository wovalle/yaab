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

  async getMyCrushes(userId: string) {
    return this.whereEqualTo('user_id', userId).find();
  }

  async getCrushesOfMine(userId: string) {
    return this.whereEqualTo('crush_id', userId).find();
  }
}

export default CrushRelationshipRepository;
