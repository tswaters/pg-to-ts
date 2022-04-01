import PgPromise from 'pg-promise';

import {Queryable, TypedSQL} from './db-utils';
import {tables} from './demo-schema';

const typedDb = new TypedSQL(tables);

const userTable = typedDb.table('users');
// const commentsTable = typedDb.table('comment');
// const docTable = typedDb.table('doc');

const pgp = PgPromise();

afterAll(() => {
  pgp.end();
});

const getUserById = userTable
  .selectByPrimaryKey()
  .columns(['name', 'pronoun'])
  .fn();

const JOHN_DEERE_ID = 'dee5e220-1f62-4f80-ad29-3ad48a03a36e';

describe('update e2e', () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('Must set POSTGRES_URL to run unit tests');
  }
  const rawDb = pgp(process.env.POSTGRES_URL);
  const db: Queryable & {q: string; args: string[]} = {
    q: '',
    args: [],
    query(q, args) {
      this.q = q;
      this.args = args;
      return rawDb.query(q, args);
    },
  };

  // Run all tests in a transaction and roll it back to avoid mutating the DB.
  // This will avoid mutations even if the test fails.
  beforeEach(async () => db.query('BEGIN'));
  afterEach(async () => db.query('ROLLBACK'));

  it('should update by primary key', async () => {
    expect(await getUserById(db, {id: JOHN_DEERE_ID})).toMatchInlineSnapshot(`
      Object {
        "name": "John Deere",
        "pronoun": "he/him",
      }
    `);
    const updateByKey = userTable.updateByPrimaryKey().fn();
    expect(
      await updateByKey(
        db,
        {id: JOHN_DEERE_ID},
        {name: 'John Doe', pronoun: 'he/him/his'},
      ),
    ).toEqual({
      id: JOHN_DEERE_ID,
      name: 'John Doe',
      pronoun: 'he/him/his',
    });
    expect(await getUserById(db, {id: JOHN_DEERE_ID})).toMatchInlineSnapshot(`
      Object {
        "name": "John Doe",
        "pronoun": "he/him/his",
      }
    `);
  });

  /*
  it('should update with a where clause', async () => {
    const update = docTable.update().where(['title']).fn();
    await update(
      mockDb,
      {title: 'Great Expectations'},
      {created_by: 'Charles Dickens'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UDPATE doc SET created_by = $2 WHERE title = $1 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Great Expectations",
        "Charles Dickens",
      ]
    `);
  });

  it('should update with fixed columns', async () => {
    const update = docTable.update().set(['contents']).where(['title']).fn();
    await update(
      mockDb,
      {title: 'Great Expectations'},
      {contents: 'Twas the best of times, err, I mean…'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UDPATE doc SET contents = $1 WHERE title = $2 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Twas the best of times, err, I mean…",
        "Great Expectations",
      ]
    `);
  });

  it('should update with an any clause', async () => {
    const update = docTable
      .update()
      .set(['created_by'])
      .where([any('title')])
      .fn();
    await update(
      mockDb,
      {title: ['Great Expectations', 'Bleak House']},
      {created_by: 'Charles Dickens'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UDPATE doc SET created_by = $1 WHERE title::text = ANY($2) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Charles Dickens",
        Array [
          "Great Expectations",
          "Bleak House",
        ],
      ]
    `);
  });
  */
});
