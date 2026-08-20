import pg from 'pg';

const ref = 'oqdbvbhxpejckppluais';
const password = 'bHcLD2VQPIF9rnh2';
const host = 'aws-0-us-west-2.pooler.supabase.com';

async function main() {
  const client = new pg.Client({
    user: `postgres.${ref}`,
    host: host,
    database: 'postgres',
    password: password,
    port: 5432,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();

    const res = await client.query(`SELECT id, email, password, role, tier, status FROM public.profiles WHERE LOWER(email) = 'herissonvinicius52@gmail.com'`);
    console.log('Student account info:', res.rows);

  } catch (err) {
    console.error('Error fetching student info:', err);
  } finally {
    await client.end();
  }
}

main();
