import {MigrationInterface, QueryRunner} from 'typeorm';

export class AddTelegramFieldsToUsers1748000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
                ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT NULL,
                ADD COLUMN IF NOT EXISTS tg_link_token_hash VARCHAR(64) NULL;
        `);
        await queryRunner.query(`
            ALTER TABLE users
                ADD CONSTRAINT uq_users_telegram_chat_id UNIQUE (telegram_chat_id),
                ADD CONSTRAINT uq_users_tg_link_token_hash UNIQUE (tg_link_token_hash);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
                DROP CONSTRAINT IF EXISTS uq_users_telegram_chat_id,
                DROP CONSTRAINT IF EXISTS uq_users_tg_link_token_hash;
        `);
        await queryRunner.query(`
            ALTER TABLE users
                DROP COLUMN IF EXISTS telegram_chat_id,
                DROP COLUMN IF EXISTS tg_link_token_hash;
        `);
    }
}
