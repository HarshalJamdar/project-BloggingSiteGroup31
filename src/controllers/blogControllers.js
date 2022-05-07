const authorModel = require("../models/authorModel");
const blogModel = require("../models/blogModel");
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');



//---CREATE BLOG
const createBlog = async function (req, res) {

  //try-statement defines a code-block to run if there is an error or undefined variable then it handle catch-statement to handle the error.
  try {
    let author = req.body.authorId;
    let blog = req.body
    let arr = Object.keys(blog)

    if (arr.length == 0) return res.status(400).send({ staus: false, Error: "Invalid request. Please provide Details" })
    else if (!blog.title) return res.status(400).send({ staus: false, Error: "title is required" })
    else if (!blog.body) return res.status(400).send({ staus: false, Error: "Blog body is required" })
    else if (!blog.authorId) return res.status(400).send({ staus: false, Error: "authorId is required" })
    else if (mongoose.Types.ObjectId.isValid(req.body.authorId) == false) return res.status(400).send({ staus: false, Error: "Author Id is Invalid" })
    else if (!blog.tags) return res.status(400).send({ staus: false, Error: "tags is required" })
    else if (!blog.category) return res.status(400).send({ staus: false, Error: "category is required" })

    if (req.body.isDeleted === true) {
      req.body.deletedAt = new Date()
    }
    if (req.body.ispublished === true) {
      req.body.publishedAt = new Date()
    }

    //findById is used to find the single author _id, that matches the given id, given by the frontend.
    let Id = await authorModel.findById({ _id: author });

    if (Id) {
      let dataCreated = await blogModel.create(blog);
      res.status(201).send({ status: true, data: dataCreated });
    } else {
      res.status(400).send({ status: false, Error: "Author does not exist!" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        Error: "Server not responding.",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//



//---GET BLOGS(ALL BLOGS OR USING FILTER)
const getBlog = async function (req, res) {
  try {

    let Category = req.query.category;
    let SubCategory = req.query.subCategory;
    let Id = req.query.authorId;
    let Tags = req.query.tags;


    if (!Category && !SubCategory && !Id && !Tags) {
      let blog = await blogModel.find({ ispublished: true, isDeleted: false });
      return res.status(200).send({ status: true, Data: blog });
    }

    if (Id) {
      if (mongoose.Types.ObjectId.isValid(Id) == false) {
        return res.status(400).send({ status: false, Error: "AuthorId Invalid" });
      }
    }


    let division = await blogModel.find({
      $or: [
        { authorId: Id },
        { category: Category },
        { subCategory: SubCategory },
        { tags: Tags },
      ],
    });


    if (division.length === 0) {
      return res.status(404).send({ Error: "Not Found" })
    }

    if (division.length != 0) {
      var data = division.filter(
        (x) => x.ispublished === true && x.isDeleted === false
      );
    }
    console.log(data)
    if (data.length === 0) {
      return res.status(404).send({ Error: "Blog does not exist" })
    }
    else if (data) {
      return res.status(200).send({ status: true, Data: data });
    }
  }
  catch (err) {
    res
      .status(500)
      .send({
        status: false,
        Error: "Server not responding",
        error: err.message,
      });
  }
};



//-----------------------------------------------------------------------------------------//

//NOTE:Author can delete and update only his blogs not others.

//---UPDATE BLOG
const updateBlog = async function (req, res) {
  try {

    let authorLoggedIn = req["authorId"]
    let blogId = req.params.blogId;

    let Body = req.body;


    let arr = Object.keys(Body)

    if (arr.length == 0) return res.status(400).send({ staus: false, Error: "Invalid request. Please provide Details" })
    const { title, body, tags, subCategory } = Body;
    let blog = await blogModel
      .findOne({ _id: blogId })
      .select({ _id: 0, authorId: 1, isDeleted: 1 });

    if (blog == null) {
      res.status(404).send({ status: false, Error: "Blog does not exist." });
    }
    else if (blog.isDeleted === true) {
      res.status(404).send({ status: false, Error: "Blog does not exist." });
    }
    else if (authorLoggedIn == blog.authorId) {
      const updateBlogs = await blogModel
        .findOneAndUpdate(
          { _id: blogId },
          {
            title: title,
            body: body,
            $addToSet: { tags: tags, subCategory: subCategory },  //we are adding tags and subcategory not replacing it, thats why using $addToSet
            ispublished: Body.ispublished,
          },
          { new: true }
        )
        .populate("authorId");
      if (updateBlogs.ispublished === true) {
        const updateNew = await blogModel.findOneAndUpdate({ _id: updateBlogs._id },
          { $set: { publishedAt: new Date() }, },
          { new: true }
        )
        res.status(200).send({ status: true, Data: updateNew });
      }
      else {
        res.status(200).send({ status: true, Data: updateBlogs });
      }

    } else if(authorLoggedIn !== blog.authorId) {
      res.status(401).send({ status: false, Error: "Not authorised" });
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        Error: "Server not responding",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//


//---DELETE BLOG USING BLOG ID
const deleteBlog = async function (req, res) {
  try {
    let authorLoggedIn = req["authorId"]

    let blogId = req.params.blogId;

    const isValidObjectId = function (objectId) {
      return mongoose.Types.ObjectId.isValid(objectId)
    }

    if (isValidObjectId(blogId) == false) {
      res.status(400).send({ Error: "Please Provide valid Blog Id." });
    } else {
      let blog = await blogModel
        .findOne({ _id: blogId, isDeleted: false })
        .select({ authorId: 1, _id: 0 });

      if (blog == null) {
        res.status(404).send({ status: false, Error: "Blog does not exist." });
      }
      else if (authorLoggedIn == blog.authorId) {

        const deleteBlogs = await blogModel
          .findOneAndUpdate(
            { _id: req.params.blogId },
            { isDeleted: true, $set: { deletedAt: new Date() }, },
            { new: true }
          )
          .populate("authorId");
        res.status(200).send({ status: true, Data: deleteBlogs });
      } else {
        res.status(401).send({ status: false, Error: "Not authorised" });
      }
    }
  } catch (err) {
    res
      .status(500)
      .send({
        status: false,
        Error: "Server not responding",
        error: err.message,
      });
  }
};

//------------------------------------------------------------------------------------------//


//---DELETE BLOG USING FILTER
const deleteBlog1 = async function (req, res) {
  try {

    let authorLoggedIn = req["authorId"]

    let Category = req.query.category;
    let SubCategory = req.query.subCategory;
    let Id = req.query.authorId;
    let Tags = req.query.tags;

    let division = await blogModel.find({
      $or: [
        { authorId: Id },
        { category: Category },
        { subCategory: SubCategory },
        { tags: Tags },
      ],
      isDeleted: false,
    })


    if (division.length == 0) {
      res.status(404).send({ status: false, Error: "Blog does not exist!" });
    } else {
      let NotAuth = []
      let Deleted = []

      for (i = 0; i < division.length; i++) {

        if (authorLoggedIn != division[i].authorId) {

          NotAuth.push(division[i])

        } else {
          var deleteBlogs = await blogModel.updateOne(
            { _id: division[i]._id },
            { $set: { isDeleted: true, $set: { deletedAt: new Date() }, } },

            { new: true }
          );
          Deleted.push(deleteBlogs)
        }
      }

      if (Deleted.length == 0) {
        res.status(401).send({ status: false, Error: "Not authorised!" });
      } else {
        return res.status(200).send({ status: true, Data: Deleted });
      }
    }
  }
  catch (err) {
    res
      .status(500)
      .send({
        status: false,
        Error: "Server not responding",
        error: err.message,
      });
  }
}




//------------------------------------------------------------------------------------------//

module.exports.createBlog = createBlog;
module.exports.getBlog = getBlog;
module.exports.updateBlog = updateBlog;
module.exports.deleteBlog = deleteBlog;
module.exports.deleteBlog1 = deleteBlog1;



















//-------------------------------------------------------------------//
//----------NOTE-----------------//

//NOTE: NEED TO GIVE TOKEN IN REQUEST HEADER FOR EACH API.
//CREATE BLOG INPUT
// {
//   "title":"Happy's blog",
//   "body":"Language",
//   "authorId":"627138ed82ff026a2ad2837b",     //whoever login only his authorid should come here. otherwise update and delete will not work.
//   "tags":"tech",
//   "category":"Language",
//   "subCategory":"Software",
//   "isDeleted":"true",
//   "ispublished":"true"
// }


//GET INPUT 
//only token in header and you can also give filters(combinations of tags, category, subcategory, authorid) in query param.
















































