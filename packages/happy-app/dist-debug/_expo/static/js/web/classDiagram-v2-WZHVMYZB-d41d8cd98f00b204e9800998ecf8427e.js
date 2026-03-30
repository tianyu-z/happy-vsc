__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.diagram = void 0;
  require(_dependencyMap[0], "./chunk-FMBD7UC4.mjs");
  require(_dependencyMap[1], "./chunk-55IACEB6.mjs");
  require(_dependencyMap[2], "./chunk-QN33PNHL.mjs");
  require(_dependencyMap[3], "./chunk-N4CR4FBY.mjs");
  require(_dependencyMap[4], "./chunk-QXUST7PY.mjs");
  require(_dependencyMap[5], "./chunk-HN2XXSSU.mjs");
  require(_dependencyMap[6], "./chunk-JZLCHNYA.mjs");
  require(_dependencyMap[7], "./chunk-CVBHYZKI.mjs");
  require(_dependencyMap[8], "./chunk-ATLVNIR6.mjs");
  require(_dependencyMap[9], "./chunk-JA3XYJ7Z.mjs");
  require(_dependencyMap[10], "./chunk-S3R3BYOJ.mjs");
  require(_dependencyMap[11], "./chunk-ABZYJK2D.mjs");
  // src/diagrams/class/classDiagram-v2.ts
  var diagram = exports.diagram = {
    parser: require(_dependencyMap[12], "./chunk-B4BG7PRW.mjs").classDiagram_default,
    get db() {
      return new (require(_dependencyMap[12], "./chunk-B4BG7PRW.mjs").ClassDB)();
    },
    renderer: require(_dependencyMap[12], "./chunk-B4BG7PRW.mjs").classRenderer_v3_unified_default,
    styles: require(_dependencyMap[12], "./chunk-B4BG7PRW.mjs").styles_default,
    init: /* @__PURE__ */(0, require(_dependencyMap[13], "./chunk-AGHRB4JF.mjs").__name)(cnf => {
      if (!cnf.class) {
        cnf.class = {};
      }
      cnf.class.arrowMarkerAbsolute = cnf.arrowMarkerAbsolute;
    }, "init")
  };
},3867,[3903,3901,3902,3887,3848,3849,3850,3851,3852,3888,3882,3872,3936,3854],"../../node_modules/mermaid/dist/chunks/mermaid.core/classDiagram-v2-WZHVMYZB.mjs");
//# sourceMappingURL=http://localhost:8081/packages/happy-app/index.ts.map?platform=web&dev=true&hot=false&transform.routerRoot=.%2Fsources%2Fapp&resolver.exporting=true&serializer.splitChunks=true&serializer.output=static&serializer.map=true
//# debugId=787ad36a-6262-4819-9758-c7d7199bc63d