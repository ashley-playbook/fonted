#!/usr/bin/env node
/** Repo-root entry point for Cloudflare build (build.js lives in glyph/). */
const { execSync } = require("child_process");
const path = require("path");

const glyph = path.join(__dirname, "glyph");

execSync("npm install --prefix glyph", { stdio: "inherit" });
execSync("node build.js", { stdio: "inherit", cwd: glyph });
