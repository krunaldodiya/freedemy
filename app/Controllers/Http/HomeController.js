"use strict";

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const Course = use("App/Models/Course");

const extensions = [".mp4", ".m4v", ".html", ".txt", ".pdf"];

class HomeController {
  async addCourse({ request, view }) {
    const data = request.all();

    let course_data = {
      id: null,
      course_name: "",
      course_directory_path: "",
      course_directory_name: "",
      course_url: "",
      course_image: "",
      course_overview: ""
    };

    const course_exists = data.hasOwnProperty("course_id");
    if (course_exists) {
      const course = await Course.find(data["course_id"]);
      course_data = { ...course_data, ...course.toJSON() };
    }

    return view.render("add_course", { course_data });
  }

  processAddCourse({ request, response }) {
    const data = request.all();

    // extracting info
    const id = data["id"];
    const course_name = data["name"];
    const course_directory = data["directory"];
    const course_url = data["url"];
    const course_image = data["image"];
    const course_overview = data["overview"];

    // check if data valid
    if (
      !course_name ||
      !course_directory ||
      !course_url ||
      !course_image ||
      !course_overview
    ) {
      return response.redirect("back");
    }

    const course_directory_path = course_directory.replace(/\/\s*$/, "");
    const course_directory_name = course_directory_path.split("/").pop();

    const pathExists = fs.lstatSync(course_directory_path).isDirectory();
    if (!pathExists) {
      return response.redirect("back");
    }

    // adding symlink
    const child = spawn("ln", ["-s", course_directory_path, "public/videos"]);
    child.stderr.on("data", data => {
      console.log(data.toString());
    });

    const course_data = {
      course_name,
      course_directory_path,
      course_directory_name,
      course_url,
      course_image,
      course_overview
    };

    if (id != "null") {
      return Course.query()
        .where("id", id)
        .update(course_data)
        .then(() => {
          return response.redirect("/");
        })
        .catch(e => {
          console.log(e);
        });
    }

    return Course.create(course_data)
      .then(() => {
        return response.redirect("/");
      })
      .catch(e => {
        console.log(e);
      });
  }

  isDirectory(path) {
    return fs.lstatSync(path).isDirectory();
  }

  async home({ view, request }) {
    const data = request.all();
    const keywords = data["keywords"];

    const course_list = await Course.query()
      .where(builder => {
        if (keywords) {
          builder.where("course_name", "LIKE", `%${keywords}%`);
        }
      })
      .paginate();

    return view.render("home", { course_list, keywords });
  }

  async course({ view, request }) {
    const data = request.all();
    const course = await Course.find(data["course_id"]);

    const course_directory_path = course.course_directory_path;
    const course_directory_name = course.course_directory_name;

    const tree = [];

    fs.readdirSync(course_directory_path).forEach((section, section_index) => {
      const section_path = course_directory_path + "/" + section;
      const isDirectory = this.isDirectory(section_path);

      if (isDirectory) {
        tree.push({
          section,
          section_index,
          courses: []
        });

        fs.readdirSync(course_directory_path + "/" + section).forEach(
          lecture => {
            const lecture_path =
              course_directory_path + "/" + section + "/" + lecture;
            const isDirectory = this.isDirectory(lecture_path);
            const ext = path.extname(lecture_path);

            if (!isDirectory && extensions.indexOf(ext) > -1) {
              tree.forEach(section => {
                if (section.section_index == section_index) {
                  section.courses.push({
                    section: section.section,
                    lecture: lecture
                  });
                }
              });
            }
          }
        );
      }
    });

    const section_exists = data.hasOwnProperty("section");
    const lecture_exists = data.hasOwnProperty("lecture");

    const initial_course = tree[0]["courses"][0];
    const section = section_exists ? data["section"] : initial_course.section;
    const lecture = lecture_exists ? data["lecture"] : initial_course.lecture;
    const file = `/videos/${course_directory_name}/${section}/${lecture}`;

    return view.render("course", {
      tree,
      course,
      selected_lecture: lecture,
      file: encodeURI(file)
    });
  }
}

module.exports = HomeController;
