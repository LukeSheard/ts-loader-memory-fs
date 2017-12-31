import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
import MemoryFS = require('memory-fs');
import * as ts from "typescript";

const compiler = webpack({
  entry: "/foo.ts",
  output: {
    filename: "bundle-simple.js",
    path: path.resolve(__dirname),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "/tsconfig.json",
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
    modules: [
      "/"
    ],
    extensions: [
      ".js",
      ".ts"
    ]
  }
});

const inputFileSystem = new MemoryFS();

inputFileSystem.mkdirpSync("/bar");

inputFileSystem.writeFileSync("/tsconfig.json", `{
  "files": [
    "/foo.ts"
  ]
}`);

inputFileSystem.writeFileSync("/foo.ts", `
  console.log("Working!");
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

  return fs.writeFile("output-simple.json", JSON.stringify(stats.toJson(), null, 4), (err) => {
    if (err) {
      throw err;
    }
  });
});