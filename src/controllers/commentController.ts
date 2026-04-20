import asyncHandler from "../utils/asyncHandler";
import * as commentService from "../services/commentService";

const createComment = asyncHandler(async (req, res) => {
  const comment = await commentService.createComment(String(req.params.id), req.body, req.user!);
  res.status(201).json({ success: true, message: "Comment added", data: comment });
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await commentService.listComments(String(req.params.id), req.user!);
  res.json({ success: true, data: comments });
});

export { createComment, listComments };
