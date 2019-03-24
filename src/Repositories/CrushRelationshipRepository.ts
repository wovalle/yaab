import { BaseFirestoreRepository, CustomRepository } from 'fireorm';
import { CrushRelationship } from '../models';

@CustomRepository(CrushRelationship)
class CrushRelationshipRepository extends BaseFirestoreRepository<
  CrushRelationship
> {
  async getMyCrushes(userId: string) {
    return this.whereEqualTo('user_id', userId).find();
  }

  async getCrushesOfMine(userId: string) {
    return this.whereEqualTo('crush_id', userId).find();
  }
}

export default CrushRelationshipRepository;
