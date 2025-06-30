import { MigrationInterface, QueryRunner } from "typeorm";

export class InitMigration1751284992245 implements MigrationInterface {
    name = 'InitMigration1751284992245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "is_dummy" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "is_dummy"`);
    }

}
