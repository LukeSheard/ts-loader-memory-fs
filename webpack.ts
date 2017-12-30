import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
import MemoryFS = require('memory-fs');
import * as ts from "typescript";

const compiler = webpack({
  entry: "/foo.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          compilerOptions: {
            baseUrl: "/",
            paths: {
              "*": [
                "/"
              ]
            },
            target: "es5",
            module: "commonjs",
            moduleResolution: "node",
            sourceMap: true
          }
        }
      }
    ]
  },
  resolve: {
    extensions: [
      ".js",
      ".ts"
    ]
  }
});

const inputFileSystem = new MemoryFS();

inputFileSystem.mkdirpSync("/bar");

inputFileSystem.writeFileSync("/foo.ts", `
  const bar = require("/bar");

  bar.print();
`);

inputFileSystem.writeFileSync("/bar/index.ts", `
  module.exports.print = function () {
    console.log("PRINTING");
  }
`);

(compiler as any).inputFileSystem = inputFileSystem;
(compiler as any).resolvers.normal.fileSystem = inputFileSystem;
(compiler as any).resolvers.context.fileSystem = inputFileSystem;

compiler.run((err, stats) => {
  if (err) {
    throw err;
  }

  return fs.writeFile("output.json", JSON.stringify(stats.toJson(), null, 4), (err) => {
    if (err) {
      throw err;
    }
  });
});