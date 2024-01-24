import { Router } from "express";
import { postPool } from "../utils/db.js";
const postRouter = Router();

postRouter.get("/", async (req, res) => {
  const status = req.query.status;
  const keywords = `%${req.query.keywords}%`;
  const page = req.query.page || 1;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;
  let query = "";
  let values = [];
  if (status && keywords) {
    query =
      "select * from posts where status = $1 and title ilike $2 limit $3 offset $4";
    values = [status, keywords, pageSize, offset];
  } else if (keywords) {
    query = "select * from posts where title ilike $1 limit $2 offset $3";
    values = [keywords, pageSize, offset];
  } else if (status) {
    query = "select * from posts where status =$1 limit $2 offset $3";
    values = [status, pageSize, offset];
  } else {
    query = "select * from posts limit $1 offset $2";
    values = [pageSize, offset];
  }
  try {
    const results = await postPool.query(query, values);
    return res.status(200).json({
      data: results.rows,
    });
  } catch (err) {
    return res.status(500).json({
      message: `failed to fetch data : ${err.message}`,
    });
  }
});

postRouter.get("/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    const result = await postPool.query(
      "select * from posts where post_id = $1",
      [postId]
    );
    return res.status(200).json({
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({
      message: `failed to fetch single post data : ${err.message}`,
    });
  }
});

postRouter.post("/", async (req, res) => {
  const hasPublished = req.body.status === "published";
  const newPost = {
    ...req.body,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: hasPublished ? new Date() : null,
  };
  try {
    await postPool.query(
      "insert into posts(title,content,category,status,created_at,updated_at,published_at) values($1,$2,$3,$4,$5,$6,$7)",
      [
        newPost.title,
        newPost.content,
        newPost.category,
        newPost.status,
        newPost.created_at,
        newPost.updated_at,
        newPost.published_at,
      ]
    );
    return res.status(200).json({
      message: "Post has been created.",
    });
  } catch (err) {
    return res.status(500).json({
      message: `failed to create new post ${err.message}`,
    });
  }
});

postRouter.put("/:id", async (req, res) => {
  const hasPublished = req.body.status === "published";
  const { title, content, status, category } = req.body;

  if (!title && !content && !status && !category) {
    return res.status(400).json({
      message:
        "At least one field to update (title, content, status,category) is required.",
    });
  }

  const updated_at = new Date();
  const published_at = hasPublished ? new Date() : null;

  const postId = req.params.id;
  let query = "update posts set";
  const values = [];
  if (title) {
    values.push(title);
    query += ` title = $${values.length},`;
  }
  if (content) {
    values.push(content);
    query += ` content = $${values.length},`;
  }
  if (status) {
    values.push(status);
    query += ` status = $${values.length},`;
  }
  if (category) {
    values.push(category);
    query += ` category = $${values.length},`;
  }
  if (published_at) {
    values.push(published_at);
    query += ` published_at = $${values.length},`;
  }

  values.push(updated_at);
  query += ` updated_at = $${values.length},`;
  values.push(postId);
  query = query.slice(0, -1) + ` where post_id = $${values.length}`;

  try {
    const result = await postPool.query(query, values);

    if (result.rowCount === 1) {
      return res.status(200).json({
        message: `Post ${postId} has been updated.`,
      });
    } else {
      return res.status(404).json({
        message: "Post not found.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: `Failed to update post: ${err.message}`,
    });
  }
});

postRouter.delete("/:id", async (req, res) => {
  const postId = req.params.id;
  try {
    await postPool.query("delete from posts where post_id = $1", [postId]);
    return res.json({
      message: `Post ${postId} has been deleted.`,
    });
  } catch (err) {
    return res.status(500).json({
      message: `failed to delete : ${err.message}`,
    });
  }
});

export default postRouter;
