import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddAvatarUrlToUsers1777920116936 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL
        `);
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS avatar_url
        `);
    }
}
