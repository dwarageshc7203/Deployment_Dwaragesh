import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSessionToAppointmentFix1751427040950 implements MigrationInterface {

    name = 'AddSessionToAppointmentFix1751427040950'

  public async up(queryRunner: QueryRunner): Promise<void> {
   /* await queryRunner.query(`
      ALTER TABLE "appointment" ADD COLUMN "session" VARCHAR(20) DEFAULT 'morning'
    `);*/
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment" DROP COLUMN "session"
    `);
  }

}
