"use strict";

const Route = use("Route");
const Helpers = use("Helpers");

// home
Route.get("/", "HomeController.home");

// course
Route.get("/course", "HomeController.course");
Route.get("/add-course", "HomeController.addCourse");
Route.post("/add-course", "HomeController.processAddCourse");
