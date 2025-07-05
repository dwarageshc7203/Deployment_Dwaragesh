import { MigrationInterface, QueryRunner } from "typeorm";

export class AddReportingTimeToAppointment1751427782177 implements MigrationInterface {
    name = 'AddReportingTimeToAppointment1751427782177'

  public async up(queryRunner: QueryRunner): Promise<void> {
    /*await queryRunner.query(`
      ALTER TABLE "appointment" ADD COLUMN "reporting_time" VARCHAR(10)
    `);*/
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment" DROP COLUMN "reporting_time"
    `);
  }

}
