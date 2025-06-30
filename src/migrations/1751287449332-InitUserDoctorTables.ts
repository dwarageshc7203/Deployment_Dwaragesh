import { MigrationInterface, QueryRunner } from "typeorm";

export class InitUserDoctorTables1751287449332 implements MigrationInterface {
    name = 'InitUserDoctorTables1751287449332'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "is_dummy" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "is_dummy"`);
    }

}
