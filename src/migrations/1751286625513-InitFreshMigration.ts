import { MigrationInterface, QueryRunner } from "typeorm";

export class InitFreshMigration1751286625513 implements MigrationInterface {
    name = 'InitFreshMigration1751286625513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" ADD "is_dummy" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "appointment" DROP COLUMN "is_dummy"`);
    }

}
