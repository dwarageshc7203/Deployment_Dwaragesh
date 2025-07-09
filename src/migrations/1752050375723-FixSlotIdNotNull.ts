import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixSlotIdNotNull1752050375723 implements MigrationInterface {
  name = 'FixSlotIdNotNull1752050375723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Delete bad data (safe and deployable)
    await queryRunner.query(`
      DELETE FROM "appointment" WHERE "slot_id" IS NULL;
    `);

    // Step 2: Make slot_id NOT NULL
    await queryRunner.query(`
      ALTER TABLE "appointment"
      ALTER COLUMN "slot_id" SET NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Optional rollback: make it nullable again
    await queryRunner.query(`
      ALTER TABLE "appointment"
      ALTER COLUMN "slot_id" DROP NOT NULL;
    `);
  }
}
