import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionToAppointment1751390054367 implements MigrationInterface {
  name = 'AddSessionToAppointment1751390054367';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // The column already exists, so we skip this migration.
    // Alternatively, you could do: 
    // await queryRunner.query(`ALTER TABLE "appointment" ALTER COLUMN "session" SET DEFAULT 'morning'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "session"`);
  }
}
