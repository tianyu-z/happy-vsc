__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diagram = void 0;
  // src/diagrams/info/infoParser.ts

  var parser = {
    parse: /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(async input => {
      const ast = await (0, require(_dependencyMap[1], "@mermaid-js/parser").parse)("info", input);
      require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").log.debug(ast);
    }, "parse")
  };

  // src/diagrams/info/infoDb.ts
  var DEFAULT_INFO_DB = {
    version: require(_dependencyMap[2], "./chunk-XAJISQIX.mjs").package_default.version + (true ? "" : "-tiny")
  };
  var getVersion = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)(() => DEFAULT_INFO_DB.version, "getVersion");
  var db = {
    getVersion
  };

  // src/diagrams/info/infoRenderer.ts
  var draw = /* @__PURE__ */(0, require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").__name)((text, id, version) => {
    require(_dependencyMap[0], "./chunk-AGHRB4JF.mjs").log.debug("rendering info diagram\n" + text);
    const svg = (0, require(_dependencyMap[3], "./chunk-EXTU4WIE.mjs").selectSvgElement)(id);
    (0, require(_dependencyMap[4], "./chunk-ABZYJK2D.mjs").configureSvgSize)(svg, 100, 400, true);
    const group = svg.append("g");
    group.append("text").attr("x", 100).attr("y", 40).attr("class", "version").attr("font-size", 32).style("text-anchor", "middle").text(`v${version}`);
  }, "draw");
  var renderer = {
    draw
  };

  // src/diagrams/info/infoDiagram.ts
  var diagram = exports.diagram = {
    parser,
    db,
    renderer
  };
},3860,[3854,3917,3885,3871,3872],"../../node_modules/mermaid/dist/chunks/mermaid.core/infoDiagram-WHAUD3N6.mjs");
//# sourceMappingURL=http://localhost:8081/packages/happy-app/index.ts.map?platform=web&dev=true&hot=false&transform.routerRoot=.%2Fsources%2Fapp&resolver.exporting=true&serializer.splitChunks=true&serializer.output=static&serializer.map=true
//# debugId=492b3404-a7c9-466e-b5c0-aaf74d009908