"use strict";
exports.__esModule = true;
exports.markdown = void 0;
var fs = require("fs");
function markdown(options) {
    if (!options) {
        options = { name: "README" };
    }
    var name = options.name;
    return {
        targetDirHandler: function (dirs) {
            var mdPaths = dirs.map(function (path) { return "".concat(path, "/").concat(name, ".md"); });
            var mdPathContent = mdPaths
                .filter(function (path) { return fs.existsSync(path) && fs.statSync(path).isFile(); })
                .map(function (path) {
                var content = fs.readFileSync(path, "utf-8");
                return {
                    path: path,
                    content: content
                };
            });
            console.log(mdPathContent);
        }
    };
}
exports.markdown = markdown;
