import * as fs from "fs";
import * as path from "path";
import * as webpack from "webpack";
import MemoryFS = require('memory-fs');

const compiler = webpack({
  context: __dirname,
  entry: path.join(__dirname, "foo.ts"),
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

inputFileSystem.mkdirpSync(__dirname);
inputFileSystem.mkdirpSync(path.join(__dirname, "bar"));

inputFileSystem.writeFileSync(path.join(__dirname, "foo.ts"), `
  import * as bar from "bar;

  bar.print();
`);

inputFileSystem.writeFileSync(path.join(__dirname, "bar/index.ts"), `
  export function print() {
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