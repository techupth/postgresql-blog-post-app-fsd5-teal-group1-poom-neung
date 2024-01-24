// Creating PostgreSQL Client here
import * as pg from "pg";
const { Pool } = pg.default;

const postPool = new Pool({
  connectionString: "postgresql://postgres:000006@localhost:5432/post_test",
});

postPool
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("Error acquiring client", err.stack);
  });

export { postPool };
