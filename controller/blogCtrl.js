const Blog = require("../models/blogModel");
const User = require("../models/userModel")
const asyncHandler = require("express-async-handler")
const validateMongoDbId = require("../utils/validateMingodbid");

// создание блога
const createBlog = asyncHandler(async(req, res) => {
    try {
        const newBlog = await Blog.create(req.body);
        res.json(newBlog)
    } catch (error) {
        throw new Error(error)
    }
})

//Обновление блога
const updateBlog = asyncHandler(async(req, res) => {
    const { id } = req.params
    validateMongoDbId(id)
    try {
        const updateBlog = await Blog.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        res.json(updateBlog)
    } catch (error) {
        throw new Error(error)
    }
})

//Получение блога
const getBlog = asyncHandler(async(req, res) => {
    const { id } = req.params
    validateMongoDbId(id)
    try {
        const getBlog = await Blog.findById(id)
            .populate("likes")
            .populate("dislikes");
        const updateViews = await Blog.findByIdAndUpdate(id, {
            $inc: { numViews: 1 },
        }, 
        {new: true}
    );
        res.json(getBlog)
    } catch (error) {
        throw new Error(error)
    }
});

//Получение всех блогов 
const getAllBlogs = asyncHandler( async(req, res) => {
    try {
        const getBlogs = await Blog.find();
        res.json(getBlogs)
    } catch (error) {
        throw new Error(error)
    }
})

//Удаление Блогов 
const deleteBlog = asyncHandler(async(req, res) => {
    const { id } = req.params
    validateMongoDbId(id)
    try {
        const deleteBlog = await Blog.findByIdAndDelete(id);
        res.json(deleteBlog)
    } catch (error) {
        throw new Error(error)
    }
})


//Понравившиеся блоги
const likeBlog = asyncHandler(async(req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId)

    // Поиск блога который вы лайкнули
    const blog = await Blog.findById(blogId);
    // Поиск пользователя
    const loginUserId = req?.user?._id;
    // Поиск если пользователю понравился блог
    const isLiked = blog?.isLiked;
    // Поиск если пользователю не понравился блог
    const alreadeDisliked = blog?.dislikes?.find(
        (userId) => userId?.toString() === loginUserId?.toString()
    );
    if (alreadeDisliked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: {dislikes: loginUserId},
            isDisliked: false,
        }, 
        { new: true }
      );
      res.json(blog)
    }
    if (isLiked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { likes: loginUserId },
            isLiked: false,
        }, 
        { new: true }
      );
      res.json(blog)
    }
    else {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { likes: loginUserId },
            isLiked: true,
        }, 
        { new: true }
      );
      res.json(blog)
    }
})

//Непонравившиеся блоги
const dislikeBlog = asyncHandler(async(req, res) => {
    const { blogId } = req.body;
    validateMongoDbId(blogId)

    // Поиск блога который вы лайкнули
    const blog = await Blog.findById(blogId);
    // Поиск пользователя
    const loginUserId = req?.user?._id;
    // Поиск если пользователю понравился блог
    const isDisliked = blog?.isDisliked;
    // Поиск если пользователю не понравился блог
    const alreadeLiked = blog?.likes?.find(
        (userId) => userId?.toString() === loginUserId?.toString()
    );
    if (alreadeLiked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: {likes: loginUserId},
            isLiked: false,
        }, 
        { new: true }
      );
      res.json(blog)
    }
    if (isDisliked) {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $pull: { dislikes: loginUserId },
            isDisliked: false,
        }, 
        { new: true }
      );
      res.json(blog)
    }
    else {
        const blog = await Blog.findByIdAndUpdate(blogId, {
            $push: { dislikes: loginUserId },
            isDisliked: true,
        }, 
        { new: true }
      );
      res.json(blog)
    }
})

module.exports = { createBlog, updateBlog, getBlog, getAllBlogs, deleteBlog, likeBlog, dislikeBlog }