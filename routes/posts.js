const express = require('express');
const Post = require('../models/Post');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ GET /api/posts - 검색 + 페이지네이션 포함 전체 조회
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { search } = req.query;
  let query = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    query = {
      $or: [
        { title: regex },
        { content: regex }
      ]
    };
  }

  try {
    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate('author', 'email nickname')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ total, page, limit, posts });
  } catch (err) {
    console.error("🔥 Error fetching posts:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ POST /api/posts - 게시글 작성
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({ title, content, author: req.user.userId });
    await newPost.save();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
  } catch (err) {
    console.error("🔥 Error creating post:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET /api/posts/:id - 게시글 상세 조회
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'email nickname');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error("🔥 Error fetching post:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

  router.put('/:id', verifyToken, async (req, res) => {
    try {
      const { title, content } = req.body;
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      post.title = title || post.title;
      post.content = content || post.content;
      await post.save();
      res.json({ message: 'Post updated successfully', post });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      if (post.author.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Permission denied' });
      }
      await Post.findByIdAndDelete(req.params.id);
      res.json({ message: 'Post deleted successfully' });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const comment = { user: req.user.userId, text: req.body.text, createdAt: new Date() };
      post.comments = post.comments || [];
      post.comments.push(comment);
      await post.save();
      res.status(201).json({ message: 'Comment added', comment });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.post('/:id/like', verifyToken, async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      post.likes = post.likes || [];
      const index = post.likes.indexOf(req.user.userId);
      if (index === -1) {
        post.likes.push(req.user.userId);
        await post.save();
        return res.json({ message: 'Liked the post' });
      } else {
        post.likes.splice(index, 1);
        await post.save();
        return res.json({ message: 'Unliked the post' });
      }
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
module.exports = router;
