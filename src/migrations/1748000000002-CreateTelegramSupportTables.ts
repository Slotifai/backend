import {MigrationInterface, QueryRunner} from 'typeorm';

export class CreateTelegramSupportTables1748000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS telegram_sessions (
                chat_id BIGINT PRIMARY KEY,
                data JSONB NOT NULL DEFAULT '{}',
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS favorite_masters (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                master_id INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(user_id, master_id)
            );
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS slot_watchers (
                id SERIAL PRIMARY KEY,
                chat_id BIGINT NOT NULL,
                user_id INT NULL REFERENCES users(id) ON DELETE CASCADE,
                master_id INT NOT NULL REFERENCES masters(id) ON DELETE CASCADE,
                service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS slot_watchers;`);
        await queryRunner.query(`DROP TABLE IF EXISTS favorite_masters;`);
        await queryRunner.query(`DROP TABLE IF EXISTS telegram_sessions;`);
    }
}
