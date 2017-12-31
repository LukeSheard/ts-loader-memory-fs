import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
import MemoryFS = require('memory-fs');

const compiler = webpack({
  entry: "/foo.js",
  output: {
    filename: "bundle-working.js",
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

inputFileSystem.writeFileSync("/foo.js", `
  const bar = require("/bar");

  bar.print();
`);

inputFileSystem.writeFileSync("/bar/index.js", `
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

  if (stats.hasErrors()) {
    stats.toJson().errors.forEach((error) => console.error(error));
  }

  if (stats.hasWarnings()) {
    stats.toJson().warnings.forEach(warning => console.warn(warning));
  }

  return fs.writeFile("output-working.json", JSON.stringify(stats.toJson(), null, 4), (err) => {
    if (err) {
      throw err;
    }
  });
});