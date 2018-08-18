"use strict";

const Schema = use("Schema");

class CourseSchema extends Schema {
  up() {
    this.create("courses", table => {
      table.increments();
      table.string("course_name");
      table.text("course_overview", "longtext");
      table.string("course_url");
      table.string("course_directory_path");
      table.string("course_directory_name");
      table.string("course_image");
      table.timestamps();
    });
  }

  down() {
    this.drop("courses");
  }
}

module.exports = CourseSchema;
