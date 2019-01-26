import { Collection } from 'fireorm';

type CrushStatus = 'active' | 'blocked';

@Collection('crush_relationships')
export class CrushRelationship {
  public id: string;
  public chat_id: string;
  public user_id: string;
  public crush_id: string;
  public user_nickname: string;
  public crush_status: CrushStatus;
  public created_on: Date;

  constructor() {
    this.id = null;
    this.chat_id = null;
    this.user_id = null;
    this.crush_id = null;
    this.user_nickname = null;
    this.crush_status = 'active';
    this.created_on = new Date();
  }
}
