import express from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: express.Express) {
  const publicDir = path.resolve(__dirname, "public");

  if (!fs.existsSync(publicDir)) {
    throw new Error(
      `Could not find the build directory: ${publicDir}, make sure to build the client first`
    );
  }

  app.use(express.static(publicDir));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(publicDir, "index.html"));
  });
}
