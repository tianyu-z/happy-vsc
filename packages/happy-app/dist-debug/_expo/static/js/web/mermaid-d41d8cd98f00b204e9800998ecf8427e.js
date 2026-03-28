__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  require(_dependencyMap[1], "./chunks/mermaid.core/chunk-QXUST7PY.mjs");
  require(_dependencyMap[2], "./chunks/mermaid.core/chunk-HN2XXSSU.mjs");
  require(_dependencyMap[3], "./chunks/mermaid.core/chunk-JZLCHNYA.mjs");
  require(_dependencyMap[4], "./chunks/mermaid.core/chunk-CVBHYZKI.mjs");
  require(_dependencyMap[5], "./chunks/mermaid.core/chunk-ATLVNIR6.mjs");
  var _dompurify = _interopRequireDefault(require(_dependencyMap[6], "dompurify"));
  var _isEmpty = _interopRequireDefault(require(_dependencyMap[7], "lodash-es/isEmpty.js"));
  var _Diagram2; // src/mermaid.ts
  // src/diagrams/c4/c4Detector.ts
  var id = "c4";
  var detector = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*C4Context|C4Container|C4Component|C4Dynamic|C4Deployment/.test(txt);
  }, "detector");
  var loader = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[9], _dependencyMap.paths, "./chunks/mermaid.core/c4Diagram-YG6GDRKO.mjs");
    return {
      id,
      diagram: diagram2
    };
  }, "loader");
  var plugin = {
    id,
    detector,
    loader
  };
  var c4Detector_default = plugin;

  // src/diagrams/flowchart/flowDetector.ts
  var id2 = "flowchart";
  var detector2 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (config?.flowchart?.defaultRenderer === "dagre-wrapper" || config?.flowchart?.defaultRenderer === "elk") {
      return false;
    }
    return /^\s*graph/.test(txt);
  }, "detector");
  var loader2 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[11], _dependencyMap.paths, "./chunks/mermaid.core/flowDiagram-NV44I4VS.mjs");
    return {
      id: id2,
      diagram: diagram2
    };
  }, "loader");
  var plugin2 = {
    id: id2,
    detector: detector2,
    loader: loader2
  };
  var flowDetector_default = plugin2;

  // src/diagrams/flowchart/flowDetector-v2.ts
  var id3 = "flowchart-v2";
  var detector3 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (config?.flowchart?.defaultRenderer === "dagre-d3") {
      return false;
    }
    if (config?.flowchart?.defaultRenderer === "elk") {
      config.layout = "elk";
    }
    if (/^\s*graph/.test(txt) && config?.flowchart?.defaultRenderer === "dagre-wrapper") {
      return true;
    }
    return /^\s*flowchart/.test(txt);
  }, "detector");
  var loader3 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[11], _dependencyMap.paths, "./chunks/mermaid.core/flowDiagram-NV44I4VS.mjs");
    return {
      id: id3,
      diagram: diagram2
    };
  }, "loader");
  var plugin3 = {
    id: id3,
    detector: detector3,
    loader: loader3
  };
  var flowDetector_v2_default = plugin3;

  // src/diagrams/er/erDetector.ts
  var id4 = "er";
  var detector4 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*erDiagram/.test(txt);
  }, "detector");
  var loader4 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[12], _dependencyMap.paths, "./chunks/mermaid.core/erDiagram-Q2GNP2WA.mjs");
    return {
      id: id4,
      diagram: diagram2
    };
  }, "loader");
  var plugin4 = {
    id: id4,
    detector: detector4,
    loader: loader4
  };
  var erDetector_default = plugin4;

  // src/diagrams/git/gitGraphDetector.ts
  var id5 = "gitGraph";
  var detector5 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*gitGraph/.test(txt);
  }, "detector");
  var loader5 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[13], _dependencyMap.paths, "./chunks/mermaid.core/gitGraphDiagram-NY62KEGX.mjs");
    return {
      id: id5,
      diagram: diagram2
    };
  }, "loader");
  var plugin5 = {
    id: id5,
    detector: detector5,
    loader: loader5
  };
  var gitGraphDetector_default = plugin5;

  // src/diagrams/gantt/ganttDetector.ts
  var id6 = "gantt";
  var detector6 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*gantt/.test(txt);
  }, "detector");
  var loader6 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[14], _dependencyMap.paths, "./chunks/mermaid.core/ganttDiagram-JELNMOA3.mjs");
    return {
      id: id6,
      diagram: diagram2
    };
  }, "loader");
  var plugin6 = {
    id: id6,
    detector: detector6,
    loader: loader6
  };
  var ganttDetector_default = plugin6;

  // src/diagrams/info/infoDetector.ts
  var id7 = "info";
  var detector7 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*info/.test(txt);
  }, "detector");
  var loader7 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[15], _dependencyMap.paths, "./chunks/mermaid.core/infoDiagram-WHAUD3N6.mjs");
    return {
      id: id7,
      diagram: diagram2
    };
  }, "loader");
  var info = {
    id: id7,
    detector: detector7,
    loader: loader7
  };

  // src/diagrams/pie/pieDetector.ts
  var id8 = "pie";
  var detector8 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*pie/.test(txt);
  }, "detector");
  var loader8 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[16], _dependencyMap.paths, "./chunks/mermaid.core/pieDiagram-ADFJNKIX.mjs");
    return {
      id: id8,
      diagram: diagram2
    };
  }, "loader");
  var pie = {
    id: id8,
    detector: detector8,
    loader: loader8
  };

  // src/diagrams/quadrant-chart/quadrantDetector.ts
  var id9 = "quadrantChart";
  var detector9 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*quadrantChart/.test(txt);
  }, "detector");
  var loader9 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[17], _dependencyMap.paths, "./chunks/mermaid.core/quadrantDiagram-AYHSOK5B.mjs");
    return {
      id: id9,
      diagram: diagram2
    };
  }, "loader");
  var plugin7 = {
    id: id9,
    detector: detector9,
    loader: loader9
  };
  var quadrantDetector_default = plugin7;

  // src/diagrams/xychart/xychartDetector.ts
  var id10 = "xychart";
  var detector10 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*xychart(-beta)?/.test(txt);
  }, "detector");
  var loader10 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[18], _dependencyMap.paths, "./chunks/mermaid.core/xychartDiagram-PRI3JC2R.mjs");
    return {
      id: id10,
      diagram: diagram2
    };
  }, "loader");
  var plugin8 = {
    id: id10,
    detector: detector10,
    loader: loader10
  };
  var xychartDetector_default = plugin8;

  // src/diagrams/requirement/requirementDetector.ts
  var id11 = "requirement";
  var detector11 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*requirement(Diagram)?/.test(txt);
  }, "detector");
  var loader11 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[19], _dependencyMap.paths, "./chunks/mermaid.core/requirementDiagram-UZGBJVZJ.mjs");
    return {
      id: id11,
      diagram: diagram2
    };
  }, "loader");
  var plugin9 = {
    id: id11,
    detector: detector11,
    loader: loader11
  };
  var requirementDetector_default = plugin9;

  // src/diagrams/sequence/sequenceDetector.ts
  var id12 = "sequence";
  var detector12 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*sequenceDiagram/.test(txt);
  }, "detector");
  var loader12 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[20], _dependencyMap.paths, "./chunks/mermaid.core/sequenceDiagram-WL72ISMW.mjs");
    return {
      id: id12,
      diagram: diagram2
    };
  }, "loader");
  var plugin10 = {
    id: id12,
    detector: detector12,
    loader: loader12
  };
  var sequenceDetector_default = plugin10;

  // src/diagrams/class/classDetector.ts
  var id13 = "class";
  var detector13 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (config?.class?.defaultRenderer === "dagre-wrapper") {
      return false;
    }
    return /^\s*classDiagram/.test(txt);
  }, "detector");
  var loader13 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[21], _dependencyMap.paths, "./chunks/mermaid.core/classDiagram-2ON5EDUG.mjs");
    return {
      id: id13,
      diagram: diagram2
    };
  }, "loader");
  var plugin11 = {
    id: id13,
    detector: detector13,
    loader: loader13
  };
  var classDetector_default = plugin11;

  // src/diagrams/class/classDetector-V2.ts
  var id14 = "classDiagram";
  var detector14 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (/^\s*classDiagram/.test(txt) && config?.class?.defaultRenderer === "dagre-wrapper") {
      return true;
    }
    return /^\s*classDiagram-v2/.test(txt);
  }, "detector");
  var loader14 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[22], _dependencyMap.paths, "./chunks/mermaid.core/classDiagram-v2-WZHVMYZB.mjs");
    return {
      id: id14,
      diagram: diagram2
    };
  }, "loader");
  var plugin12 = {
    id: id14,
    detector: detector14,
    loader: loader14
  };
  var classDetector_V2_default = plugin12;

  // src/diagrams/state/stateDetector.ts
  var id15 = "state";
  var detector15 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (config?.state?.defaultRenderer === "dagre-wrapper") {
      return false;
    }
    return /^\s*stateDiagram/.test(txt);
  }, "detector");
  var loader15 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[23], _dependencyMap.paths, "./chunks/mermaid.core/stateDiagram-FKZM4ZOC.mjs");
    return {
      id: id15,
      diagram: diagram2
    };
  }, "loader");
  var plugin13 = {
    id: id15,
    detector: detector15,
    loader: loader15
  };
  var stateDetector_default = plugin13;

  // src/diagrams/state/stateDetector-V2.ts
  var id16 = "stateDiagram";
  var detector16 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config) => {
    if (/^\s*stateDiagram-v2/.test(txt)) {
      return true;
    }
    if (/^\s*stateDiagram/.test(txt) && config?.state?.defaultRenderer === "dagre-wrapper") {
      return true;
    }
    return false;
  }, "detector");
  var loader16 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[24], _dependencyMap.paths, "./chunks/mermaid.core/stateDiagram-v2-4FDKWEC3.mjs");
    return {
      id: id16,
      diagram: diagram2
    };
  }, "loader");
  var plugin14 = {
    id: id16,
    detector: detector16,
    loader: loader16
  };
  var stateDetector_V2_default = plugin14;

  // src/diagrams/user-journey/journeyDetector.ts
  var id17 = "journey";
  var detector17 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*journey/.test(txt);
  }, "detector");
  var loader17 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[25], _dependencyMap.paths, "./chunks/mermaid.core/journeyDiagram-XKPGCS4Q.mjs");
    return {
      id: id17,
      diagram: diagram2
    };
  }, "loader");
  var plugin15 = {
    id: id17,
    detector: detector17,
    loader: loader17
  };
  var journeyDetector_default = plugin15;

  // src/diagrams/error/errorRenderer.ts
  var draw = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((_text, id28, version) => {
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug("rendering svg for syntax error\n");
    const svg = (0, require(_dependencyMap[26], "./chunks/mermaid.core/chunk-EXTU4WIE.mjs").selectSvgElement)(id28);
    const g = svg.append("g");
    svg.attr("viewBox", "0 0 2412 512");
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").configureSvgSize)(svg, 100, 512, true);
    g.append("path").attr("class", "error-icon").attr("d", "m411.313,123.313c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32-9.375,9.375-20.688-20.688c-12.484-12.5-32.766-12.5-45.25,0l-16,16c-1.261,1.261-2.304,2.648-3.31,4.051-21.739-8.561-45.324-13.426-70.065-13.426-105.867,0-192,86.133-192,192s86.133,192 192,192 192-86.133 192-192c0-24.741-4.864-48.327-13.426-70.065 1.402-1.007 2.79-2.049 4.051-3.31l16-16c12.5-12.492 12.5-32.758 0-45.25l-20.688-20.688 9.375-9.375 32.001-31.999zm-219.313,100.687c-52.938,0-96,43.063-96,96 0,8.836-7.164,16-16,16s-16-7.164-16-16c0-70.578 57.422-128 128-128 8.836,0 16,7.164 16,16s-7.164,16-16,16z");
    g.append("path").attr("class", "error-icon").attr("d", "m459.02,148.98c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l16,16c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16.001-16z");
    g.append("path").attr("class", "error-icon").attr("d", "m340.395,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688 6.25-6.25 6.25-16.375 0-22.625l-16-16c-6.25-6.25-16.375-6.25-22.625,0s-6.25,16.375 0,22.625l15.999,16z");
    g.append("path").attr("class", "error-icon").attr("d", "m400,64c8.844,0 16-7.164 16-16v-32c0-8.836-7.156-16-16-16-8.844,0-16,7.164-16,16v32c0,8.836 7.156,16 16,16z");
    g.append("path").attr("class", "error-icon").attr("d", "m496,96.586h-32c-8.844,0-16,7.164-16,16 0,8.836 7.156,16 16,16h32c8.844,0 16-7.164 16-16 0-8.836-7.156-16-16-16z");
    g.append("path").attr("class", "error-icon").attr("d", "m436.98,75.605c3.125,3.125 7.219,4.688 11.313,4.688 4.094,0 8.188-1.563 11.313-4.688l32-32c6.25-6.25 6.25-16.375 0-22.625s-16.375-6.25-22.625,0l-32,32c-6.251,6.25-6.251,16.375-0.001,22.625z");
    g.append("text").attr("class", "error-text").attr("x", 1440).attr("y", 250).attr("font-size", "150px").style("text-anchor", "middle").text("Syntax error in text");
    g.append("text").attr("class", "error-text").attr("x", 1250).attr("y", 400).attr("font-size", "100px").style("text-anchor", "middle").text(`mermaid version ${version}`);
  }, "draw");
  var renderer = {
    draw
  };
  var errorRenderer_default = renderer;

  // src/diagrams/error/errorDiagram.ts
  var diagram = {
    db: {},
    renderer,
    parser: {
      parse: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
        return;
      }, "parse")
    }
  };
  var errorDiagram_default = diagram;

  // src/diagrams/flowchart/elk/detector.ts
  var id18 = "flowchart-elk";
  var detector18 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((txt, config = {}) => {
    if (
    // If diagram explicitly states flowchart-elk
    /^\s*flowchart-elk/.test(txt) ||
    // If a flowchart/graph diagram has their default renderer set to elk
    /^\s*(flowchart|graph)/.test(txt) && config?.flowchart?.defaultRenderer === "elk") {
      config.layout = "elk";
      return true;
    }
    return false;
  }, "detector");
  var loader18 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[11], _dependencyMap.paths, "./chunks/mermaid.core/flowDiagram-NV44I4VS.mjs");
    return {
      id: id18,
      diagram: diagram2
    };
  }, "loader");
  var plugin16 = {
    id: id18,
    detector: detector18,
    loader: loader18
  };
  var detector_default = plugin16;

  // src/diagrams/timeline/detector.ts
  var id19 = "timeline";
  var detector19 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*timeline/.test(txt);
  }, "detector");
  var loader19 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[28], _dependencyMap.paths, "./chunks/mermaid.core/timeline-definition-IT6M3QCI.mjs");
    return {
      id: id19,
      diagram: diagram2
    };
  }, "loader");
  var plugin17 = {
    id: id19,
    detector: detector19,
    loader: loader19
  };
  var detector_default2 = plugin17;

  // src/diagrams/mindmap/detector.ts
  var id20 = "mindmap";
  var detector20 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*mindmap/.test(txt);
  }, "detector");
  var loader20 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[29], _dependencyMap.paths, "./chunks/mermaid.core/mindmap-definition-VGOIOE7T.mjs");
    return {
      id: id20,
      diagram: diagram2
    };
  }, "loader");
  var plugin18 = {
    id: id20,
    detector: detector20,
    loader: loader20
  };
  var detector_default3 = plugin18;

  // src/diagrams/kanban/detector.ts
  var id21 = "kanban";
  var detector21 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*kanban/.test(txt);
  }, "detector");
  var loader21 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[30], _dependencyMap.paths, "./chunks/mermaid.core/kanban-definition-3W4ZIXB7.mjs");
    return {
      id: id21,
      diagram: diagram2
    };
  }, "loader");
  var plugin19 = {
    id: id21,
    detector: detector21,
    loader: loader21
  };
  var detector_default4 = plugin19;

  // src/diagrams/sankey/sankeyDetector.ts
  var id22 = "sankey";
  var detector22 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*sankey(-beta)?/.test(txt);
  }, "detector");
  var loader22 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[31], _dependencyMap.paths, "./chunks/mermaid.core/sankeyDiagram-TZEHDZUN.mjs");
    return {
      id: id22,
      diagram: diagram2
    };
  }, "loader");
  var plugin20 = {
    id: id22,
    detector: detector22,
    loader: loader22
  };
  var sankeyDetector_default = plugin20;

  // src/diagrams/packet/detector.ts
  var id23 = "packet";
  var detector23 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*packet(-beta)?/.test(txt);
  }, "detector");
  var loader23 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[32], _dependencyMap.paths, "./chunks/mermaid.core/diagram-S2PKOQOG.mjs");
    return {
      id: id23,
      diagram: diagram2
    };
  }, "loader");
  var packet = {
    id: id23,
    detector: detector23,
    loader: loader23
  };

  // src/diagrams/radar/detector.ts
  var id24 = "radar";
  var detector24 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*radar-beta/.test(txt);
  }, "detector");
  var loader24 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[33], _dependencyMap.paths, "./chunks/mermaid.core/diagram-QEK2KX5R.mjs");
    return {
      id: id24,
      diagram: diagram2
    };
  }, "loader");
  var radar = {
    id: id24,
    detector: detector24,
    loader: loader24
  };

  // src/diagrams/block/blockDetector.ts
  var id25 = "block";
  var detector25 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*block(-beta)?/.test(txt);
  }, "detector");
  var loader25 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[34], _dependencyMap.paths, "./chunks/mermaid.core/blockDiagram-VD42YOAC.mjs");
    return {
      id: id25,
      diagram: diagram2
    };
  }, "loader");
  var plugin21 = {
    id: id25,
    detector: detector25,
    loader: loader25
  };
  var blockDetector_default = plugin21;

  // src/diagrams/architecture/architectureDetector.ts
  var id26 = "architecture";
  var detector26 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*architecture/.test(txt);
  }, "detector");
  var loader26 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[35], _dependencyMap.paths, "./chunks/mermaid.core/architectureDiagram-VXUJARFQ.mjs");
    return {
      id: id26,
      diagram: diagram2
    };
  }, "loader");
  var architecture = {
    id: id26,
    detector: detector26,
    loader: loader26
  };
  var architectureDetector_default = architecture;

  // src/diagrams/treemap/detector.ts
  var id27 = "treemap";
  var detector27 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(txt => {
    return /^\s*treemap/.test(txt);
  }, "detector");
  var loader27 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    const {
      diagram: diagram2
    } = await require(_dependencyMap[10], "expo/internal/async-require-module")(_dependencyMap[36], _dependencyMap.paths, "./chunks/mermaid.core/diagram-PSM6KHXK.mjs");
    return {
      id: id27,
      diagram: diagram2
    };
  }, "loader");
  var treemap = {
    id: id27,
    detector: detector27,
    loader: loader27
  };

  // src/diagram-api/diagram-orchestration.ts
  var hasLoadedDiagrams = false;
  var addDiagrams = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
    if (hasLoadedDiagrams) {
      return;
    }
    hasLoadedDiagrams = true;
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerDiagram)("error", errorDiagram_default, text => {
      return text.toLowerCase().trim() === "error";
    });
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerDiagram)("---",
    // --- diagram type may appear if YAML front-matter is not parsed correctly
    {
      db: {
        clear: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {}, "clear")
      },
      styles: {},
      // should never be used
      renderer: {
        draw: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {}, "draw")
      },
      parser: {
        parse: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
          throw new Error("Diagrams beginning with --- are not valid. If you were trying to use a YAML front-matter, please ensure that you've correctly opened and closed the YAML front-matter with un-indented `---` blocks");
        }, "parse")
      },
      init: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => null, "init")
      // no op
    }, text => {
      return text.toLowerCase().trimStart().startsWith("---");
    });
    if (true) {
      (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerLazyLoadedDiagrams)(detector_default, detector_default3, architectureDetector_default);
    }
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerLazyLoadedDiagrams)(c4Detector_default, detector_default4, classDetector_V2_default, classDetector_default, erDetector_default, ganttDetector_default, info, pie, requirementDetector_default, sequenceDetector_default, flowDetector_v2_default, flowDetector_default, detector_default2, gitGraphDetector_default, stateDetector_V2_default, stateDetector_default, journeyDetector_default, quadrantDetector_default, sankeyDetector_default, packet, xychartDetector_default, blockDetector_default, radar, treemap);
  }, "addDiagrams");

  // src/diagram-api/loadDiagram.ts
  var loadRegisteredDiagrams = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug(`Loading registered diagrams`);
    const results = await Promise.allSettled(Object.entries(require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").detectors).map(async ([key, {
      detector: detector28,
      loader: loader28
    }]) => {
      if (!loader28) {
        return;
      }
      try {
        (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getDiagram)(key);
      } catch {
        try {
          const {
            diagram: diagram2,
            id: id28
          } = await loader28();
          (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerDiagram)(id28, diagram2, detector28);
        } catch (err) {
          require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error(`Failed to load external diagram with key ${key}. Removing from detectors.`);
          delete require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").detectors[key];
          throw err;
        }
      }
    }));
    const failed = results.filter(result => result.status === "rejected");
    if (failed.length > 0) {
      require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error(`Failed to load ${failed.length} external diagrams`);
      for (const res of failed) {
        require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error(res);
      }
      throw new Error(`Failed to load ${failed.length} external diagrams`);
    }
  }, "loadRegisteredDiagrams");

  // src/mermaidAPI.ts

  // src/accessibility.ts
  var SVG_ROLE = "graphics-document document";
  function setA11yDiagramInfo(svg, diagramType) {
    svg.attr("role", SVG_ROLE);
    if (diagramType !== "") {
      svg.attr("aria-roledescription", diagramType);
    }
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(setA11yDiagramInfo, "setA11yDiagramInfo");
  function addSVGa11yTitleDescription(svg, a11yTitle, a11yDesc, baseId) {
    if (svg.insert === void 0) {
      return;
    }
    if (a11yDesc) {
      const descId = `chart-desc-${baseId}`;
      svg.attr("aria-describedby", descId);
      svg.insert("desc", ":first-child").attr("id", descId).text(a11yDesc);
    }
    if (a11yTitle) {
      const titleId = `chart-title-${baseId}`;
      svg.attr("aria-labelledby", titleId);
      svg.insert("title", ":first-child").attr("id", titleId).text(a11yTitle);
    }
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(addSVGa11yTitleDescription, "addSVGa11yTitleDescription");

  // src/Diagram.ts
  var Diagram = (_Diagram2 = class _Diagram {
    constructor(type, text, db, parser, renderer2) {
      this.type = type;
      this.text = text;
      this.db = db;
      this.parser = parser;
      this.renderer = renderer2;
    }
    static async fromText(text, metadata = {}) {
      const config = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getConfig)();
      const type = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").detectType)(text, config);
      text = (0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").encodeEntities)(text) + "\n";
      try {
        (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getDiagram)(type);
      } catch {
        const loader28 = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getDiagramLoader)(type);
        if (!loader28) {
          throw new (require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").UnknownDiagramError)(`Diagram ${type} not found.`);
        }
        const {
          id: id28,
          diagram: diagram2
        } = await loader28();
        (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerDiagram)(id28, diagram2);
      }
      const {
        db,
        parser,
        renderer: renderer2,
        init: init2
      } = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getDiagram)(type);
      if (parser.parser) {
        parser.parser.yy = db;
      }
      db.clear?.();
      init2?.(config);
      if (metadata.title) {
        db.setDiagramTitle?.(metadata.title);
      }
      await parser.parse(text);
      return new _Diagram(type, text, db, parser, renderer2);
    }
    async render(id28, version) {
      await this.renderer.draw(this.text, id28, version, this);
    }
    getParser() {
      return this.parser;
    }
    getType() {
      return this.type;
    }
  }, (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(_Diagram2, "Diagram"), _Diagram2);

  // src/interactionDb.ts
  var interactionFunctions = [];
  var attachFunctions = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
    interactionFunctions.forEach(f => {
      f();
    });
    interactionFunctions = [];
  }, "attachFunctions");

  // src/diagram-api/comments.ts
  var cleanupComments = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(text => {
    return text.replace(/^\s*%%(?!{)[^\n]+\n?/gm, "").trimStart();
  }, "cleanupComments");

  // src/diagram-api/frontmatter.ts
  function extractFrontMatter(text) {
    const matches = text.match(require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").frontMatterRegex);
    if (!matches) {
      return {
        text,
        metadata: {}
      };
    }
    let parsed = (0, require(_dependencyMap[38], "./chunks/mermaid.core/chunk-MI3HLSF2.mjs").load)(matches[1], {
      // To support config, we need JSON schema.
      // https://www.yaml.org/spec/1.2/spec.html#id2803231
      schema: require(_dependencyMap[38], "./chunks/mermaid.core/chunk-MI3HLSF2.mjs").JSON_SCHEMA
    }) ?? {};
    parsed = typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    const metadata = {};
    if (parsed.displayMode) {
      metadata.displayMode = parsed.displayMode.toString();
    }
    if (parsed.title) {
      metadata.title = parsed.title.toString();
    }
    if (parsed.config) {
      metadata.config = parsed.config;
    }
    return {
      text: text.slice(matches[0].length),
      metadata
    };
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(extractFrontMatter, "extractFrontMatter");

  // src/preprocess.ts
  var cleanupText = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(code => {
    return code.replace(/\r\n?/g, "\n").replace(/<(\w+)([^>]*)>/g, (match, tag, attributes) => "<" + tag + attributes.replace(/="([^"]*)"/g, "='$1'") + ">");
  }, "cleanupText");
  var processFrontmatter = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(code => {
    const {
      text,
      metadata
    } = extractFrontMatter(code);
    const {
      displayMode,
      title,
      config = {}
    } = metadata;
    if (displayMode) {
      if (!config.gantt) {
        config.gantt = {};
      }
      config.gantt.displayMode = displayMode;
    }
    return {
      title,
      config,
      text
    };
  }, "processFrontmatter");
  var processDirectives = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(code => {
    const initDirective = require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").utils_default.detectInit(code) ?? {};
    const wrapDirectives = require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").utils_default.detectDirective(code, "wrap");
    if (Array.isArray(wrapDirectives)) {
      initDirective.wrap = wrapDirectives.some(({
        type
      }) => type === "wrap");
    } else if (wrapDirectives?.type === "wrap") {
      initDirective.wrap = true;
    }
    return {
      text: (0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").removeDirectives)(code),
      directive: initDirective
    };
  }, "processDirectives");
  function preprocessDiagram(code) {
    const cleanedCode = cleanupText(code);
    const frontMatterResult = processFrontmatter(cleanedCode);
    const directiveResult = processDirectives(frontMatterResult.text);
    const config = (0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").cleanAndMerge)(frontMatterResult.config, directiveResult.directive);
    code = cleanupComments(directiveResult.text);
    return {
      code,
      title: frontMatterResult.title,
      config
    };
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(preprocessDiagram, "preprocessDiagram");

  // src/utils/base64.ts
  function toBase64(str) {
    const utf8Bytes = new TextEncoder().encode(str);
    const utf8Str = Array.from(utf8Bytes, byte => String.fromCodePoint(byte)).join("");
    return btoa(utf8Str);
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(toBase64, "toBase64");

  // src/mermaidAPI.ts
  var MAX_TEXTLENGTH = 5e4;
  var MAX_TEXTLENGTH_EXCEEDED_MSG = "graph TB;a[Maximum text size in diagram exceeded];style a fill:#faa";
  var SECURITY_LVL_SANDBOX = "sandbox";
  var SECURITY_LVL_LOOSE = "loose";
  var XMLNS_SVG_STD = "http://www.w3.org/2000/svg";
  var XMLNS_XLINK_STD = "http://www.w3.org/1999/xlink";
  var XMLNS_XHTML_STD = "http://www.w3.org/1999/xhtml";
  var IFRAME_WIDTH = "100%";
  var IFRAME_HEIGHT = "100%";
  var IFRAME_STYLES = "border:0;margin:0;";
  var IFRAME_BODY_STYLE = "margin:0";
  var IFRAME_SANDBOX_OPTS = "allow-top-navigation-by-user-activation allow-popups";
  var IFRAME_NOT_SUPPORTED_MSG = 'The "iframe" tag is not supported by your browser.';
  var DOMPURIFY_TAGS = ["foreignobject"];
  var DOMPURIFY_ATTR = ["dominant-baseline"];
  function processAndSetConfigs(text) {
    const processed = preprocessDiagram(text);
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").reset)();
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").addDirective)(processed.config ?? {});
    return processed;
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(processAndSetConfigs, "processAndSetConfigs");
  async function parse(text, parseOptions) {
    addDiagrams();
    try {
      const {
        code,
        config
      } = processAndSetConfigs(text);
      const diagram2 = await getDiagramFromText(code);
      return {
        diagramType: diagram2.type,
        config
      };
    } catch (error) {
      if (parseOptions?.suppressErrors) {
        return false;
      }
      throw error;
    }
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(parse, "parse");
  var cssImportantStyles = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((cssClass, element, cssClasses = []) => {
    return `
.${cssClass} ${element} { ${cssClasses.join(" !important; ")} !important; }`;
  }, "cssImportantStyles");
  var createCssStyles = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((config, classDefs = /* @__PURE__ */new Map()) => {
    let cssStyles = "";
    if (config.themeCSS !== void 0) {
      cssStyles += `
${config.themeCSS}`;
    }
    if (config.fontFamily !== void 0) {
      cssStyles += `
:root { --mermaid-font-family: ${config.fontFamily}}`;
    }
    if (config.altFontFamily !== void 0) {
      cssStyles += `
:root { --mermaid-alt-font-family: ${config.altFontFamily}}`;
    }
    if (classDefs instanceof Map) {
      const htmlLabels = config.htmlLabels ?? config.flowchart?.htmlLabels;
      const cssHtmlElements = ["> *", "span"];
      const cssShapeElements = ["rect", "polygon", "ellipse", "circle", "path"];
      const cssElements = htmlLabels ? cssHtmlElements : cssShapeElements;
      classDefs.forEach(styleClassDef => {
        if (!(0, _isEmpty.default)(styleClassDef.styles)) {
          cssElements.forEach(cssElement => {
            cssStyles += cssImportantStyles(styleClassDef.id, cssElement, styleClassDef.styles);
          });
        }
        if (!(0, _isEmpty.default)(styleClassDef.textStyles)) {
          cssStyles += cssImportantStyles(styleClassDef.id, "tspan", (styleClassDef?.textStyles || []).map(s => s.replace("color", "fill")));
        }
      });
    }
    return cssStyles;
  }, "createCssStyles");
  var createUserStyles = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((config, graphType, classDefs, svgId) => {
    const userCSSstyles = createCssStyles(config, classDefs);
    const allStyles = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").styles_default)(graphType, userCSSstyles, config.themeVariables);
    return (0, require(_dependencyMap[39], "stylis").serialize)((0, require(_dependencyMap[39], "stylis").compile)(`${svgId}{${allStyles}}`), require(_dependencyMap[39], "stylis").stringify);
  }, "createUserStyles");
  var cleanUpSvgCode = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((svgCode = "", inSandboxMode, useArrowMarkerUrls) => {
    let cleanedUpSvg = svgCode;
    if (!useArrowMarkerUrls && !inSandboxMode) {
      cleanedUpSvg = cleanedUpSvg.replace(/marker-end="url\([\d+./:=?A-Za-z-]*?#/g, 'marker-end="url(#');
    }
    cleanedUpSvg = (0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").decodeEntities)(cleanedUpSvg);
    cleanedUpSvg = cleanedUpSvg.replace(/<br>/g, "<br/>");
    return cleanedUpSvg;
  }, "cleanUpSvgCode");
  var putIntoIFrame = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((svgCode = "", svgElement) => {
    const height = svgElement?.viewBox?.baseVal?.height ? svgElement.viewBox.baseVal.height + "px" : IFRAME_HEIGHT;
    const base64encodedSrc = toBase64(`<body style="${IFRAME_BODY_STYLE}">${svgCode}</body>`);
    return `<iframe style="width:${IFRAME_WIDTH};height:${height};${IFRAME_STYLES}" src="data:text/html;charset=UTF-8;base64,${base64encodedSrc}" sandbox="${IFRAME_SANDBOX_OPTS}">
  ${IFRAME_NOT_SUPPORTED_MSG}
</iframe>`;
  }, "putIntoIFrame");
  var appendDivSvgG = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((parentRoot, id28, enclosingDivId, divStyle, svgXlink) => {
    const enclosingDiv = parentRoot.append("div");
    enclosingDiv.attr("id", enclosingDivId);
    if (divStyle) {
      enclosingDiv.attr("style", divStyle);
    }
    const svgNode = enclosingDiv.append("svg").attr("id", id28).attr("width", "100%").attr("xmlns", XMLNS_SVG_STD);
    if (svgXlink) {
      svgNode.attr("xmlns:xlink", svgXlink);
    }
    svgNode.append("g");
    return parentRoot;
  }, "appendDivSvgG");
  function sandboxedIframe(parentNode, iFrameId) {
    return parentNode.append("iframe").attr("id", iFrameId).attr("style", "width: 100%; height: 100%;").attr("sandbox", "");
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(sandboxedIframe, "sandboxedIframe");
  var removeExistingElements = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((doc, id28, divId, iFrameId) => {
    doc.getElementById(id28)?.remove();
    doc.getElementById(divId)?.remove();
    doc.getElementById(iFrameId)?.remove();
  }, "removeExistingElements");
  var render = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async function (id28, text, svgContainingElement) {
    addDiagrams();
    const processed = processAndSetConfigs(text);
    text = processed.code;
    const config = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getConfig)();
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug(config);
    if (text.length > (config?.maxTextSize ?? MAX_TEXTLENGTH)) {
      text = MAX_TEXTLENGTH_EXCEEDED_MSG;
    }
    const idSelector = "#" + id28;
    const iFrameID = "i" + id28;
    const iFrameID_selector = "#" + iFrameID;
    const enclosingDivID = "d" + id28;
    const enclosingDivID_selector = "#" + enclosingDivID;
    const removeTempElements = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
      const tmpElementSelector = isSandboxed ? iFrameID_selector : enclosingDivID_selector;
      const node = (0, require(_dependencyMap[40], "d3").select)(tmpElementSelector).node();
      if (node && "remove" in node) {
        node.remove();
      }
    }, "removeTempElements");
    let root = (0, require(_dependencyMap[40], "d3").select)("body");
    const isSandboxed = config.securityLevel === SECURITY_LVL_SANDBOX;
    const isLooseSecurityLevel = config.securityLevel === SECURITY_LVL_LOOSE;
    const fontFamily = config.fontFamily;
    if (svgContainingElement !== void 0) {
      if (svgContainingElement) {
        svgContainingElement.innerHTML = "";
      }
      if (isSandboxed) {
        const iframe = sandboxedIframe((0, require(_dependencyMap[40], "d3").select)(svgContainingElement), iFrameID);
        root = (0, require(_dependencyMap[40], "d3").select)(iframe.nodes()[0].contentDocument.body);
        root.node().style.margin = 0;
      } else {
        root = (0, require(_dependencyMap[40], "d3").select)(svgContainingElement);
      }
      appendDivSvgG(root, id28, enclosingDivID, `font-family: ${fontFamily}`, XMLNS_XLINK_STD);
    } else {
      removeExistingElements(document, id28, enclosingDivID, iFrameID);
      if (isSandboxed) {
        const iframe = sandboxedIframe((0, require(_dependencyMap[40], "d3").select)("body"), iFrameID);
        root = (0, require(_dependencyMap[40], "d3").select)(iframe.nodes()[0].contentDocument.body);
        root.node().style.margin = 0;
      } else {
        root = (0, require(_dependencyMap[40], "d3").select)("body");
      }
      appendDivSvgG(root, id28, enclosingDivID);
    }
    let diag;
    let parseEncounteredException;
    try {
      diag = await Diagram.fromText(text, {
        title: processed.title
      });
    } catch (error) {
      if (config.suppressErrorRendering) {
        removeTempElements();
        throw error;
      }
      diag = await Diagram.fromText("error");
      parseEncounteredException = error;
    }
    const element = root.select(enclosingDivID_selector).node();
    const diagramType = diag.type;
    const svg = element.firstChild;
    const firstChild = svg.firstChild;
    const diagramClassDefs = diag.renderer.getClasses?.(text, diag);
    const rules = createUserStyles(config, diagramType, diagramClassDefs, idSelector);
    const style1 = document.createElement("style");
    style1.innerHTML = rules;
    svg.insertBefore(style1, firstChild);
    try {
      await diag.renderer.draw(text, id28, require(_dependencyMap[41], "./chunks/mermaid.core/chunk-XAJISQIX.mjs").package_default.version, diag);
    } catch (e) {
      if (config.suppressErrorRendering) {
        removeTempElements();
      } else {
        errorRenderer_default.draw(text, id28, require(_dependencyMap[41], "./chunks/mermaid.core/chunk-XAJISQIX.mjs").package_default.version);
      }
      throw e;
    }
    const svgNode = root.select(`${enclosingDivID_selector} svg`);
    const a11yTitle = diag.db.getAccTitle?.();
    const a11yDescr = diag.db.getAccDescription?.();
    addA11yInfo(diagramType, svgNode, a11yTitle, a11yDescr);
    root.select(`[id="${id28}"]`).selectAll("foreignobject > *").attr("xmlns", XMLNS_XHTML_STD);
    let svgCode = root.select(enclosingDivID_selector).node().innerHTML;
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug("config.arrowMarkerAbsolute", config.arrowMarkerAbsolute);
    svgCode = cleanUpSvgCode(svgCode, isSandboxed, (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").evaluate)(config.arrowMarkerAbsolute));
    if (isSandboxed) {
      const svgEl = root.select(enclosingDivID_selector + " svg").node();
      svgCode = putIntoIFrame(svgCode, svgEl);
    } else if (!isLooseSecurityLevel) {
      svgCode = _dompurify.default.sanitize(svgCode, {
        ADD_TAGS: DOMPURIFY_TAGS,
        ADD_ATTR: DOMPURIFY_ATTR,
        HTML_INTEGRATION_POINTS: {
          foreignobject: true
        }
      });
    }
    attachFunctions();
    if (parseEncounteredException) {
      throw parseEncounteredException;
    }
    removeTempElements();
    return {
      diagramType,
      svg: svgCode,
      bindFunctions: diag.db.bindFunctions
    };
  }, "render");
  function initialize(userOptions = {}) {
    const options = (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").assignWithDepth_default)({}, userOptions);
    if (options?.fontFamily && !options.themeVariables?.fontFamily) {
      if (!options.themeVariables) {
        options.themeVariables = {};
      }
      options.themeVariables.fontFamily = options.fontFamily;
    }
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").saveConfigFromInitialize)(options);
    if (options?.theme && options.theme in require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").themes_default) {
      options.themeVariables = require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").themes_default[options.theme].getThemeVariables(options.themeVariables);
    } else if (options) {
      options.themeVariables = require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").themes_default.default.getThemeVariables(options.themeVariables);
    }
    const config = typeof options === "object" ? (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").setSiteConfig)(options) : (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getSiteConfig)();
    (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").setLogLevel)(config.logLevel);
    addDiagrams();
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(initialize, "initialize");
  var getDiagramFromText = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((text, metadata = {}) => {
    const {
      code
    } = preprocessDiagram(text);
    return Diagram.fromText(code, metadata);
  }, "getDiagramFromText");
  function addA11yInfo(diagramType, svgNode, a11yTitle, a11yDescr) {
    setA11yDiagramInfo(svgNode, diagramType);
    addSVGa11yTitleDescription(svgNode, a11yTitle, a11yDescr, svgNode.attr("id"));
  }
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(addA11yInfo, "addA11yInfo");
  var mermaidAPI = Object.freeze({
    render,
    parse,
    getDiagramFromText,
    initialize,
    getConfig: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getConfig,
    setConfig: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").setConfig,
    getSiteConfig: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getSiteConfig,
    updateSiteConfig: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").updateSiteConfig,
    reset: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
      (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").reset)();
    }, "reset"),
    globalReset: /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
      (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").reset)(require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").defaultConfig);
    }, "globalReset"),
    defaultConfig: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").defaultConfig
  });
  (0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").setLogLevel)((0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getConfig)().logLevel);
  (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").reset)((0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").getConfig)());

  // src/mermaid.ts
  var handleError = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((error, errors, parseError) => {
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.warn(error);
    if ((0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").isDetailedError)(error)) {
      if (parseError) {
        parseError(error.str, error.hash);
      }
      errors.push(Object.assign({}, error, {
        message: error.str,
        error
      }));
    } else {
      if (parseError) {
        parseError(error);
      }
      if (error instanceof Error) {
        errors.push({
          str: error.message,
          message: error.message,
          hash: error.name,
          error
        });
      }
    }
  }, "handleError");
  var run = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async function (options = {
    querySelector: ".mermaid"
  }) {
    try {
      await runThrowsErrors(options);
    } catch (e) {
      if ((0, require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").isDetailedError)(e)) {
        require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error(e.str);
      }
      if (mermaid.parseError) {
        mermaid.parseError(e);
      }
      if (!options.suppressErrors) {
        require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error("Use the suppressErrors option to suppress these errors");
        throw e;
      }
    }
  }, "run");
  var runThrowsErrors = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async function ({
    postRenderCallback,
    querySelector,
    nodes
  } = {
    querySelector: ".mermaid"
  }) {
    const conf = mermaidAPI.getConfig();
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug(`${!postRenderCallback ? "No " : ""}Callback function found`);
    let nodesToProcess;
    if (nodes) {
      nodesToProcess = nodes;
    } else if (querySelector) {
      nodesToProcess = document.querySelectorAll(querySelector);
    } else {
      throw new Error("Nodes and querySelector are both undefined");
    }
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug(`Found ${nodesToProcess.length} diagrams`);
    if (conf?.startOnLoad !== void 0) {
      require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug("Start On Load: " + conf?.startOnLoad);
      mermaidAPI.updateSiteConfig({
        startOnLoad: conf?.startOnLoad
      });
    }
    const idGenerator = new (require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").utils_default.InitIDGenerator)(conf.deterministicIds, conf.deterministicIDSeed);
    let txt;
    const errors = [];
    for (const element of Array.from(nodesToProcess)) {
      require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.info("Rendering diagram: " + element.id);
      if (element.getAttribute("data-processed")) {
        continue;
      }
      element.setAttribute("data-processed", "true");
      const id28 = `mermaid-${idGenerator.next()}`;
      txt = element.innerHTML;
      txt = (0, require(_dependencyMap[42], "ts-dedent").dedent)(require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").utils_default.entityDecode(txt)).trim().replace(/<br\s*\/?>/gi, "<br/>");
      const init2 = require(_dependencyMap[37], "./chunks/mermaid.core/chunk-S3R3BYOJ.mjs").utils_default.detectInit(txt);
      if (init2) {
        require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.debug("Detected early reinit: ", init2);
      }
      try {
        const {
          svg,
          bindFunctions
        } = await render2(id28, txt, element);
        element.innerHTML = svg;
        if (postRenderCallback) {
          await postRenderCallback(id28);
        }
        if (bindFunctions) {
          bindFunctions(element);
        }
      } catch (error) {
        handleError(error, errors, mermaid.parseError);
      }
    }
    if (errors.length > 0) {
      throw errors[0];
    }
  }, "runThrowsErrors");
  var initialize2 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(function (config) {
    mermaidAPI.initialize(config);
  }, "initialize");
  var init = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async function (config, nodes, callback) {
    require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.warn("mermaid.init is deprecated. Please use run instead.");
    if (config) {
      initialize2(config);
    }
    const runOptions = {
      postRenderCallback: callback,
      querySelector: ".mermaid"
    };
    if (typeof nodes === "string") {
      runOptions.querySelector = nodes;
    } else if (nodes) {
      if (nodes instanceof HTMLElement) {
        runOptions.nodes = [nodes];
      } else {
        runOptions.nodes = nodes;
      }
    }
    await run(runOptions);
  }, "init");
  var registerExternalDiagrams = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async (diagrams, {
    lazyLoad = true
  } = {}) => {
    addDiagrams();
    (0, require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").registerLazyLoadedDiagrams)(...diagrams);
    if (lazyLoad === false) {
      await loadRegisteredDiagrams();
    }
  }, "registerExternalDiagrams");
  var contentLoaded = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(function () {
    if (mermaid.startOnLoad) {
      const {
        startOnLoad
      } = mermaidAPI.getConfig();
      if (startOnLoad) {
        mermaid.run().catch(err => require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error("Mermaid failed to initialize", err));
      }
    }
  }, "contentLoaded");
  if (typeof document !== "undefined") {
    window.addEventListener("load", contentLoaded, false);
  }
  var setParseErrorHandler = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(function (parseErrorHandler) {
    mermaid.parseError = parseErrorHandler;
  }, "setParseErrorHandler");
  var executionQueue = [];
  var executionQueueRunning = false;
  var executeQueue = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async () => {
    if (executionQueueRunning) {
      return;
    }
    executionQueueRunning = true;
    while (executionQueue.length > 0) {
      const f = executionQueue.shift();
      if (f) {
        try {
          await f();
        } catch (e) {
          require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error("Error executing queue", e);
        }
      }
    }
    executionQueueRunning = false;
  }, "executeQueue");
  var parse2 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(async (text, parseOptions) => {
    return new Promise((resolve, reject) => {
      const performCall = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => new Promise((res, rej) => {
        mermaidAPI.parse(text, parseOptions).then(r => {
          res(r);
          resolve(r);
        }, e => {
          require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error("Error parsing", e);
          mermaid.parseError?.(e);
          rej(e);
          reject(e);
        });
      }), "performCall");
      executionQueue.push(performCall);
      executeQueue().catch(reject);
    });
  }, "parse");
  var render2 = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)((id28, text, container) => {
    return new Promise((resolve, reject) => {
      const performCall = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => new Promise((res, rej) => {
        mermaidAPI.render(id28, text, container).then(r => {
          res(r);
          resolve(r);
        }, e => {
          require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").log.error("Error parsing", e);
          mermaid.parseError?.(e);
          rej(e);
          reject(e);
        });
      }), "performCall");
      executionQueue.push(performCall);
      executeQueue().catch(reject);
    });
  }, "render");
  var getRegisteredDiagramsMetadata = /* @__PURE__ */(0, require(_dependencyMap[8], "./chunks/mermaid.core/chunk-AGHRB4JF.mjs").__name)(() => {
    return Object.keys(require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").detectors).map(id28 => ({
      id: id28
    }));
  }, "getRegisteredDiagramsMetadata");
  var mermaid = {
    startOnLoad: true,
    mermaidAPI,
    parse: parse2,
    render: render2,
    init,
    run,
    registerExternalDiagrams,
    registerLayoutLoaders: require(_dependencyMap[43], "./chunks/mermaid.core/chunk-N4CR4FBY.mjs").registerLayoutLoaders,
    initialize: initialize2,
    parseError: void 0,
    contentLoaded,
    setParseErrorHandler,
    detectType: require(_dependencyMap[27], "./chunks/mermaid.core/chunk-ABZYJK2D.mjs").detectType,
    registerIconPacks: require(_dependencyMap[44], "./chunks/mermaid.core/chunk-JA3XYJ7Z.mjs").registerIconPacks,
    getRegisteredDiagramsMetadata
  };
  var mermaid_default = exports.default = mermaid;

  /*! Check if previously processed */
  /*!
   * Wait for document loaded before starting the execution
   */
},3838,{"0":10,"1":3848,"2":3849,"3":3850,"4":3851,"5":3852,"6":3853,"7":3839,"8":3854,"9":3855,"10":1793,"11":3856,"12":3857,"13":3858,"14":3859,"15":3860,"16":3861,"17":3862,"18":3863,"19":3864,"20":3865,"21":3866,"22":3867,"23":3868,"24":3869,"25":3870,"26":3871,"27":3872,"28":3873,"29":3874,"30":3875,"31":3876,"32":3877,"33":3878,"34":3879,"35":3880,"36":3881,"37":3882,"38":3883,"39":3840,"40":3884,"41":3885,"42":3886,"43":3887,"44":3888,"paths":{"3855":"/_expo/static/js/web/c4Diagram-YG6GDRKO-d41d8cd98f00b204e9800998ecf8427e.js","3856":"/_expo/static/js/web/flowDiagram-NV44I4VS-d41d8cd98f00b204e9800998ecf8427e.js","3857":"/_expo/static/js/web/erDiagram-Q2GNP2WA-d41d8cd98f00b204e9800998ecf8427e.js","3858":"/_expo/static/js/web/gitGraphDiagram-NY62KEGX-d41d8cd98f00b204e9800998ecf8427e.js","3859":"/_expo/static/js/web/ganttDiagram-JELNMOA3-d41d8cd98f00b204e9800998ecf8427e.js","3860":"/_expo/static/js/web/infoDiagram-WHAUD3N6-d41d8cd98f00b204e9800998ecf8427e.js","3861":"/_expo/static/js/web/pieDiagram-ADFJNKIX-d41d8cd98f00b204e9800998ecf8427e.js","3862":"/_expo/static/js/web/quadrantDiagram-AYHSOK5B-d41d8cd98f00b204e9800998ecf8427e.js","3863":"/_expo/static/js/web/xychartDiagram-PRI3JC2R-d41d8cd98f00b204e9800998ecf8427e.js","3864":"/_expo/static/js/web/requirementDiagram-UZGBJVZJ-d41d8cd98f00b204e9800998ecf8427e.js","3865":"/_expo/static/js/web/sequenceDiagram-WL72ISMW-d41d8cd98f00b204e9800998ecf8427e.js","3866":"/_expo/static/js/web/classDiagram-2ON5EDUG-d41d8cd98f00b204e9800998ecf8427e.js","3867":"/_expo/static/js/web/classDiagram-v2-WZHVMYZB-d41d8cd98f00b204e9800998ecf8427e.js","3868":"/_expo/static/js/web/stateDiagram-FKZM4ZOC-d41d8cd98f00b204e9800998ecf8427e.js","3869":"/_expo/static/js/web/stateDiagram-v2-4FDKWEC3-d41d8cd98f00b204e9800998ecf8427e.js","3870":"/_expo/static/js/web/journeyDiagram-XKPGCS4Q-d41d8cd98f00b204e9800998ecf8427e.js","3873":"/_expo/static/js/web/timeline-definition-IT6M3QCI-d41d8cd98f00b204e9800998ecf8427e.js","3874":"/_expo/static/js/web/mindmap-definition-VGOIOE7T-d41d8cd98f00b204e9800998ecf8427e.js","3875":"/_expo/static/js/web/kanban-definition-3W4ZIXB7-d41d8cd98f00b204e9800998ecf8427e.js","3876":"/_expo/static/js/web/sankeyDiagram-TZEHDZUN-d41d8cd98f00b204e9800998ecf8427e.js","3877":"/_expo/static/js/web/diagram-S2PKOQOG-d41d8cd98f00b204e9800998ecf8427e.js","3878":"/_expo/static/js/web/diagram-QEK2KX5R-d41d8cd98f00b204e9800998ecf8427e.js","3879":"/_expo/static/js/web/blockDiagram-VD42YOAC-d41d8cd98f00b204e9800998ecf8427e.js","3880":"/_expo/static/js/web/architectureDiagram-VXUJARFQ-d41d8cd98f00b204e9800998ecf8427e.js","3881":"/_expo/static/js/web/diagram-PSM6KHXK-d41d8cd98f00b204e9800998ecf8427e.js"}},"../../node_modules/mermaid/dist/mermaid.core.mjs");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  var _interopRequireDefault = require(_dependencyMap[0], "@babel/runtime/helpers/interopRequireDefault");
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = void 0;
  var _baseKeys = _interopRequireDefault(require(_dependencyMap[1], "./_baseKeys.js"));
  var _getTag = _interopRequireDefault(require(_dependencyMap[2], "./_getTag.js"));
  var _isArguments = _interopRequireDefault(require(_dependencyMap[3], "./isArguments.js"));
  var _isArray = _interopRequireDefault(require(_dependencyMap[4], "./isArray.js"));
  var _isArrayLike = _interopRequireDefault(require(_dependencyMap[5], "./isArrayLike.js"));
  var _isBuffer = _interopRequireDefault(require(_dependencyMap[6], "./isBuffer.js"));
  var _isPrototype = _interopRequireDefault(require(_dependencyMap[7], "./_isPrototype.js"));
  var _isTypedArray = _interopRequireDefault(require(_dependencyMap[8], "./isTypedArray.js"));
  /** `Object#toString` result references. */
  var mapTag = '[object Map]',
    setTag = '[object Set]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Checks if `value` is an empty object, collection, map, or set.
   *
   * Objects are considered empty if they have no own enumerable string keyed
   * properties.
   *
   * Array-like values such as `arguments` objects, arrays, buffers, strings, or
   * jQuery-like collections are considered empty if they have a `length` of `0`.
   * Similarly, maps and sets are considered empty if they have a `size` of `0`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is empty, else `false`.
   * @example
   *
   * _.isEmpty(null);
   * // => true
   *
   * _.isEmpty(true);
   * // => true
   *
   * _.isEmpty(1);
   * // => true
   *
   * _.isEmpty([1, 2, 3]);
   * // => false
   *
   * _.isEmpty({ 'a': 1 });
   * // => false
   */
  function isEmpty(value) {
    if (value == null) {
      return true;
    }
    if ((0, _isArrayLike.default)(value) && ((0, _isArray.default)(value) || typeof value == 'string' || typeof value.splice == 'function' || (0, _isBuffer.default)(value) || (0, _isTypedArray.default)(value) || (0, _isArguments.default)(value))) {
      return !value.length;
    }
    var tag = (0, _getTag.default)(value);
    if (tag == mapTag || tag == setTag) {
      return !value.size;
    }
    if ((0, _isPrototype.default)(value)) {
      return !(0, _baseKeys.default)(value).length;
    }
    for (var key in value) {
      if (hasOwnProperty.call(value, key)) {
        return false;
      }
    }
    return true;
  }
  var _default = exports.default = isEmpty;
},3839,[10,3889,3890,3891,3892,3893,3894,3895,3896],"../../node_modules/mermaid/node_modules/lodash-es/isEmpty.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.keys(require(_dependencyMap[0], "./src/Enum.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[0], "./src/Enum.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[0], "./src/Enum.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[1], "./src/Utility.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[1], "./src/Utility.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[1], "./src/Utility.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[2], "./src/Parser.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[2], "./src/Parser.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[2], "./src/Parser.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[3], "./src/Prefixer.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[3], "./src/Prefixer.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[3], "./src/Prefixer.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[4], "./src/Tokenizer.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[4], "./src/Tokenizer.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[4], "./src/Tokenizer.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[5], "./src/Serializer.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[5], "./src/Serializer.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[5], "./src/Serializer.js")[key];
      }
    });
  });
  Object.keys(require(_dependencyMap[6], "./src/Middleware.js")).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    if (key in exports && exports[key] === require(_dependencyMap[6], "./src/Middleware.js")[key]) return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return require(_dependencyMap[6], "./src/Middleware.js")[key];
      }
    });
  });
},3840,[3841,3842,3843,3845,3844,3846,3847],"../../node_modules/stylis/index.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.WEBKIT = exports.VIEWPORT = exports.SUPPORTS = exports.SCOPE = exports.RULESET = exports.PAGE = exports.NAMESPACE = exports.MS = exports.MOZ = exports.MEDIA = exports.LAYER = exports.KEYFRAMES = exports.IMPORT = exports.FONT_FEATURE_VALUES = exports.FONT_FACE = exports.DOCUMENT = exports.DECLARATION = exports.COUNTER_STYLE = exports.COMMENT = exports.CHARSET = void 0;
  var MS = exports.MS = '-ms-';
  var MOZ = exports.MOZ = '-moz-';
  var WEBKIT = exports.WEBKIT = '-webkit-';
  var COMMENT = exports.COMMENT = 'comm';
  var RULESET = exports.RULESET = 'rule';
  var DECLARATION = exports.DECLARATION = 'decl';
  var PAGE = exports.PAGE = '@page';
  var MEDIA = exports.MEDIA = '@media';
  var IMPORT = exports.IMPORT = '@import';
  var CHARSET = exports.CHARSET = '@charset';
  var VIEWPORT = exports.VIEWPORT = '@viewport';
  var SUPPORTS = exports.SUPPORTS = '@supports';
  var DOCUMENT = exports.DOCUMENT = '@document';
  var NAMESPACE = exports.NAMESPACE = '@namespace';
  var KEYFRAMES = exports.KEYFRAMES = '@keyframes';
  var FONT_FACE = exports.FONT_FACE = '@font-face';
  var COUNTER_STYLE = exports.COUNTER_STYLE = '@counter-style';
  var FONT_FEATURE_VALUES = exports.FONT_FEATURE_VALUES = '@font-feature-values';
  var LAYER = exports.LAYER = '@layer';
  var SCOPE = exports.SCOPE = '@scope';
},3841,[],"../../node_modules/stylis/src/Enum.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.abs = void 0;
  exports.append = append;
  exports.assign = void 0;
  exports.charat = charat;
  exports.combine = combine;
  exports.filter = filter;
  exports.from = void 0;
  exports.hash = hash;
  exports.indexof = indexof;
  exports.match = match;
  exports.replace = replace;
  exports.sizeof = sizeof;
  exports.strlen = strlen;
  exports.substr = substr;
  exports.trim = trim;
  /**
   * @param {number}
   * @return {number}
   */
  var abs = exports.abs = Math.abs;

  /**
   * @param {number}
   * @return {string}
   */
  var from = exports.from = String.fromCharCode;

  /**
   * @param {object}
   * @return {object}
   */
  var assign = exports.assign = Object.assign;

  /**
   * @param {string} value
   * @param {number} length
   * @return {number}
   */
  function hash(value, length) {
    return charat(value, 0) ^ 45 ? (((length << 2 ^ charat(value, 0)) << 2 ^ charat(value, 1)) << 2 ^ charat(value, 2)) << 2 ^ charat(value, 3) : 0;
  }

  /**
   * @param {string} value
   * @return {string}
   */
  function trim(value) {
    return value.trim();
  }

  /**
   * @param {string} value
   * @param {RegExp} pattern
   * @return {string?}
   */
  function match(value, pattern) {
    return (value = pattern.exec(value)) ? value[0] : value;
  }

  /**
   * @param {string} value
   * @param {(string|RegExp)} pattern
   * @param {string} replacement
   * @return {string}
   */
  function replace(value, pattern, replacement) {
    return value.replace(pattern, replacement);
  }

  /**
   * @param {string} value
   * @param {string} search
   * @param {number} position
   * @return {number}
   */
  function indexof(value, search, position) {
    return value.indexOf(search, position);
  }

  /**
   * @param {string} value
   * @param {number} index
   * @return {number}
   */
  function charat(value, index) {
    return value.charCodeAt(index) | 0;
  }

  /**
   * @param {string} value
   * @param {number} begin
   * @param {number} end
   * @return {string}
   */
  function substr(value, begin, end) {
    return value.slice(begin, end);
  }

  /**
   * @param {string} value
   * @return {number}
   */
  function strlen(value) {
    return value.length;
  }

  /**
   * @param {any[]} value
   * @return {number}
   */
  function sizeof(value) {
    return value.length;
  }

  /**
   * @param {any} value
   * @param {any[]} array
   * @return {any}
   */
  function append(value, array) {
    return array.push(value), value;
  }

  /**
   * @param {string[]} array
   * @param {function} callback
   * @return {string}
   */
  function combine(array, callback) {
    return array.map(callback).join('');
  }

  /**
   * @param {string[]} array
   * @param {RegExp} pattern
   * @return {string[]}
   */
  function filter(array, pattern) {
    return array.filter(function (value) {
      return !match(value, pattern);
    });
  }
},3842,[],"../../node_modules/stylis/src/Utility.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.comment = comment;
  exports.compile = compile;
  exports.declaration = declaration;
  exports.parse = parse;
  exports.ruleset = ruleset;
  /**
   * @param {string} value
   * @return {object[]}
   */
  function compile(value) {
    return (0, require(_dependencyMap[0], "./Tokenizer.js").dealloc)(parse('', null, null, null, [''], value = (0, require(_dependencyMap[0], "./Tokenizer.js").alloc)(value), 0, [0], value));
  }

  /**
   * @param {string} value
   * @param {object} root
   * @param {object?} parent
   * @param {string[]} rule
   * @param {string[]} rules
   * @param {string[]} rulesets
   * @param {number[]} pseudo
   * @param {number[]} points
   * @param {string[]} declarations
   * @return {object}
   */
  function parse(value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
    var index = 0;
    var offset = 0;
    var length = pseudo;
    var atrule = 0;
    var property = 0;
    var previous = 0;
    var variable = 1;
    var scanning = 1;
    var ampersand = 1;
    var character = 0;
    var type = '';
    var props = rules;
    var children = rulesets;
    var reference = rule;
    var characters = type;
    while (scanning) switch (previous = character, character = (0, require(_dependencyMap[0], "./Tokenizer.js").next)()) {
      // (
      case 40:
        if (previous != 108 && (0, require(_dependencyMap[1], "./Utility.js").charat)(characters, length - 1) == 58) {
          if ((0, require(_dependencyMap[1], "./Utility.js").indexof)(characters += (0, require(_dependencyMap[1], "./Utility.js").replace)((0, require(_dependencyMap[0], "./Tokenizer.js").delimit)(character), '&', '&\f'), '&\f', (0, require(_dependencyMap[1], "./Utility.js").abs)(index ? points[index - 1] : 0)) != -1) ampersand = -1;
          break;
        }
      // " ' [
      case 34:
      case 39:
      case 91:
        characters += (0, require(_dependencyMap[0], "./Tokenizer.js").delimit)(character);
        break;
      // \t \n \r \s
      case 9:
      case 10:
      case 13:
      case 32:
        characters += (0, require(_dependencyMap[0], "./Tokenizer.js").whitespace)(previous);
        break;
      // \
      case 92:
        characters += (0, require(_dependencyMap[0], "./Tokenizer.js").escaping)((0, require(_dependencyMap[0], "./Tokenizer.js").caret)() - 1, 7);
        continue;
      // /
      case 47:
        switch ((0, require(_dependencyMap[0], "./Tokenizer.js").peek)()) {
          case 42:
          case 47:
            (0, require(_dependencyMap[1], "./Utility.js").append)(comment((0, require(_dependencyMap[0], "./Tokenizer.js").commenter)((0, require(_dependencyMap[0], "./Tokenizer.js").next)(), (0, require(_dependencyMap[0], "./Tokenizer.js").caret)()), root, parent, declarations), declarations);
            if (((0, require(_dependencyMap[0], "./Tokenizer.js").token)(previous || 1) == 5 || (0, require(_dependencyMap[0], "./Tokenizer.js").token)((0, require(_dependencyMap[0], "./Tokenizer.js").peek)() || 1) == 5) && (0, require(_dependencyMap[1], "./Utility.js").strlen)(characters) && (0, require(_dependencyMap[1], "./Utility.js").substr)(characters, -1, void 0) !== ' ') characters += ' ';
            break;
          default:
            characters += '/';
        }
        break;
      // {
      case 123 * variable:
        points[index++] = (0, require(_dependencyMap[1], "./Utility.js").strlen)(characters) * ampersand;
      // } ; \0
      case 125 * variable:
      case 59:
      case 0:
        switch (character) {
          // \0 }
          case 0:
          case 125:
            scanning = 0;
          // ;
          case 59 + offset:
            if (ampersand == -1) characters = (0, require(_dependencyMap[1], "./Utility.js").replace)(characters, /\f/g, '');
            if (property > 0 && ((0, require(_dependencyMap[1], "./Utility.js").strlen)(characters) - length || variable === 0 && previous === 47)) (0, require(_dependencyMap[1], "./Utility.js").append)(property > 32 ? declaration(characters + ';', rule, parent, length - 1, declarations) : declaration((0, require(_dependencyMap[1], "./Utility.js").replace)(characters, ' ', '') + ';', rule, parent, length - 2, declarations), declarations);
            break;
          // @ ;
          case 59:
            characters += ';';
          // { rule/at-rule
          default:
            (0, require(_dependencyMap[1], "./Utility.js").append)(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length, rulesets), rulesets);
            if (character === 123) if (offset === 0) parse(characters, root, reference, reference, props, rulesets, length, points, children);else {
              switch (atrule) {
                // c(ontainer)
                case 99:
                  if ((0, require(_dependencyMap[1], "./Utility.js").charat)(characters, 3) === 110) break;
                // l(ayer)
                case 108:
                  if ((0, require(_dependencyMap[1], "./Utility.js").charat)(characters, 2) === 97) break;
                default:
                  offset = 0;
                // d(ocument) m(edia) s(upports)
                case 100:
                case 109:
                case 115:
              }
              if (offset) parse(value, reference, reference, rule && (0, require(_dependencyMap[1], "./Utility.js").append)(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length, children), children), rules, children, length, points, rule ? props : children);else parse(characters, reference, reference, reference, [''], children, 0, points, children);
            }
        }
        index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo;
        break;
      // :
      case 58:
        length = 1 + (0, require(_dependencyMap[1], "./Utility.js").strlen)(characters), property = previous;
      default:
        if (variable < 1) if (character == 123) --variable;else if (character == 125 && variable++ == 0 && (0, require(_dependencyMap[0], "./Tokenizer.js").prev)() == 125) continue;
        switch (characters += (0, require(_dependencyMap[1], "./Utility.js").from)(character), character * variable) {
          // &
          case 38:
            ampersand = offset > 0 ? 1 : (characters += '\f', -1);
            break;
          // ,
          case 44:
            points[index++] = ((0, require(_dependencyMap[1], "./Utility.js").strlen)(characters) - 1) * ampersand, ampersand = 1;
            break;
          // @
          case 64:
            // -
            if ((0, require(_dependencyMap[0], "./Tokenizer.js").peek)() === 45) characters += (0, require(_dependencyMap[0], "./Tokenizer.js").delimit)((0, require(_dependencyMap[0], "./Tokenizer.js").next)());
            atrule = (0, require(_dependencyMap[0], "./Tokenizer.js").peek)(), offset = length = (0, require(_dependencyMap[1], "./Utility.js").strlen)(type = characters += (0, require(_dependencyMap[0], "./Tokenizer.js").identifier)((0, require(_dependencyMap[0], "./Tokenizer.js").caret)())), character++;
            break;
          // -
          case 45:
            if (previous === 45 && (0, require(_dependencyMap[1], "./Utility.js").strlen)(characters) == 2) variable = 0;
        }
    }
    return rulesets;
  }

  /**
   * @param {string} value
   * @param {object} root
   * @param {object?} parent
   * @param {number} index
   * @param {number} offset
   * @param {string[]} rules
   * @param {number[]} points
   * @param {string} type
   * @param {string[]} props
   * @param {string[]} children
   * @param {number} length
   * @param {object[]} siblings
   * @return {object}
   */
  function ruleset(value, root, parent, index, offset, rules, points, type, props, children, length, siblings) {
    var post = offset - 1;
    var rule = offset === 0 ? rules : [''];
    var size = (0, require(_dependencyMap[1], "./Utility.js").sizeof)(rule);
    for (var i = 0, j = 0, k = 0; i < index; ++i) for (var x = 0, y = (0, require(_dependencyMap[1], "./Utility.js").substr)(value, post + 1, post = (0, require(_dependencyMap[1], "./Utility.js").abs)(j = points[i])), z = value; x < size; ++x) if (z = (0, require(_dependencyMap[1], "./Utility.js").trim)(j > 0 ? rule[x] + ' ' + y : (0, require(_dependencyMap[1], "./Utility.js").replace)(y, /&\f/g, rule[x]))) props[k++] = z;
    return (0, require(_dependencyMap[0], "./Tokenizer.js").node)(value, root, parent, offset === 0 ? require(_dependencyMap[2], "./Enum.js").RULESET : type, props, children, length, siblings);
  }

  /**
   * @param {number} value
   * @param {object} root
   * @param {object?} parent
   * @param {object[]} siblings
   * @return {object}
   */
  function comment(value, root, parent, siblings) {
    return (0, require(_dependencyMap[0], "./Tokenizer.js").node)(value, root, parent, require(_dependencyMap[2], "./Enum.js").COMMENT, (0, require(_dependencyMap[1], "./Utility.js").from)((0, require(_dependencyMap[0], "./Tokenizer.js").char)()), (0, require(_dependencyMap[1], "./Utility.js").substr)(value, 2, -2), 0, siblings);
  }

  /**
   * @param {string} value
   * @param {object} root
   * @param {object?} parent
   * @param {number} length
   * @param {object[]} siblings
   * @return {object}
   */
  function declaration(value, root, parent, length, siblings) {
    return (0, require(_dependencyMap[0], "./Tokenizer.js").node)(value, root, parent, require(_dependencyMap[2], "./Enum.js").DECLARATION, (0, require(_dependencyMap[1], "./Utility.js").substr)(value, 0, length), (0, require(_dependencyMap[1], "./Utility.js").substr)(value, length + 1, -1), length, siblings);
  }
},3843,[3844,3842,3841],"../../node_modules/stylis/src/Parser.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.alloc = alloc;
  exports.caret = caret;
  exports.char = char;
  exports.column = exports.characters = exports.character = void 0;
  exports.commenter = commenter;
  exports.copy = copy;
  exports.dealloc = dealloc;
  exports.delimit = delimit;
  exports.delimiter = delimiter;
  exports.escaping = escaping;
  exports.identifier = identifier;
  exports.length = void 0;
  exports.lift = lift;
  exports.line = void 0;
  exports.next = next;
  exports.node = node;
  exports.peek = peek;
  exports.position = void 0;
  exports.prev = prev;
  exports.slice = slice;
  exports.token = token;
  exports.tokenize = tokenize;
  exports.tokenizer = tokenizer;
  exports.whitespace = whitespace;
  var _column, _line, _position, _column2, _line2;
  var line = exports.line = 1;
  var column = exports.column = 1;
  var length = exports.length = 0;
  var position = exports.position = 0;
  var character = exports.character = 0;
  var characters = exports.characters = '';

  /**
   * @param {string} value
   * @param {object | null} root
   * @param {object | null} parent
   * @param {string} type
   * @param {string[] | string} props
   * @param {object[] | string} children
   * @param {object[]} siblings
   * @param {number} length
   */
  function node(value, root, parent, type, props, children, length, siblings) {
    return {
      value: value,
      root: root,
      parent: parent,
      type: type,
      props: props,
      children: children,
      line: line,
      column: column,
      length: length,
      return: '',
      siblings: siblings
    };
  }

  /**
   * @param {object} root
   * @param {object} props
   * @return {object}
   */
  function copy(root, props) {
    return (0, require(_dependencyMap[0], "./Utility.js").assign)(node('', null, null, '', null, null, 0, root.siblings), root, {
      length: -root.length
    }, props);
  }

  /**
   * @param {object} root
   */
  function lift(root) {
    while (root.root) root = copy(root.root, {
      children: [root]
    });
    (0, require(_dependencyMap[0], "./Utility.js").append)(root, root.siblings);
  }

  /**
   * @return {number}
   */
  function char() {
    return character;
  }

  /**
   * @return {number}
   */
  function prev() {
    exports.character = character = position > 0 ? (0, require(_dependencyMap[0], "./Utility.js").charat)(characters, exports.position = --position) : 0;
    if (_column = column--, exports.column = column, _column, character === 10) exports.column = column = 1, _line = line--, exports.line = line, _line;
    return character;
  }

  /**
   * @return {number}
   */
  function next() {
    exports.character = character = position < length ? (0, require(_dependencyMap[0], "./Utility.js").charat)(characters, (_position = position++, exports.position = position, _position)) : 0;
    if (_column2 = column++, exports.column = column, _column2, character === 10) exports.column = column = 1, _line2 = line++, exports.line = line, _line2;
    return character;
  }

  /**
   * @return {number}
   */
  function peek() {
    return (0, require(_dependencyMap[0], "./Utility.js").charat)(characters, position);
  }

  /**
   * @return {number}
   */
  function caret() {
    return position;
  }

  /**
   * @param {number} begin
   * @param {number} end
   * @return {string}
   */
  function slice(begin, end) {
    return (0, require(_dependencyMap[0], "./Utility.js").substr)(characters, begin, end);
  }

  /**
   * @param {number} type
   * @return {number}
   */
  function token(type) {
    switch (type) {
      // \0 \t \n \r \s whitespace token
      case 0:
      case 9:
      case 10:
      case 13:
      case 32:
        return 5;
      // ! + , / > @ ~ isolate token
      case 33:
      case 43:
      case 44:
      case 47:
      case 62:
      case 64:
      case 126:
      // ; { } breakpoint token
      case 59:
      case 123:
      case 125:
        return 4;
      // : accompanied token
      case 58:
        return 3;
      // " ' ( [ opening delimit token
      case 34:
      case 39:
      case 40:
      case 91:
        return 2;
      // ) ] closing delimit token
      case 41:
      case 93:
        return 1;
    }
    return 0;
  }

  /**
   * @param {string} value
   * @return {any[]}
   */
  function alloc(value) {
    return exports.line = line = exports.column = column = 1, exports.length = length = (0, require(_dependencyMap[0], "./Utility.js").strlen)(exports.characters = characters = value), exports.position = position = 0, [];
  }

  /**
   * @param {any} value
   * @return {any}
   */
  function dealloc(value) {
    return exports.characters = characters = '', value;
  }

  /**
   * @param {number} type
   * @return {string}
   */
  function delimit(type) {
    return (0, require(_dependencyMap[0], "./Utility.js").trim)(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)));
  }

  /**
   * @param {string} value
   * @return {string[]}
   */
  function tokenize(value) {
    return dealloc(tokenizer(alloc(value)));
  }

  /**
   * @param {number} type
   * @return {string}
   */
  function whitespace(type) {
    while (exports.character = character = peek()) if (character < 33) next();else break;
    return token(type) > 2 || token(character) > 3 ? '' : ' ';
  }

  /**
   * @param {string[]} children
   * @return {string[]}
   */
  function tokenizer(children) {
    while (next()) switch (token(character)) {
      case 0:
        (0, require(_dependencyMap[0], "./Utility.js").append)(identifier(position - 1), children);
        break;
      case 2:
        (0, require(_dependencyMap[0], "./Utility.js").append)(delimit(character), children);
        break;
      default:
        (0, require(_dependencyMap[0], "./Utility.js").append)((0, require(_dependencyMap[0], "./Utility.js").from)(character), children);
    }
    return children;
  }

  /**
   * @param {number} index
   * @param {number} count
   * @return {string}
   */
  function escaping(index, count) {
    while (--count && next())
    // not 0-9 A-F a-f
    if (character < 48 || character > 102 || character > 57 && character < 65 || character > 70 && character < 97) break;
    return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32));
  }

  /**
   * @param {number} type
   * @return {number}
   */
  function delimiter(type) {
    while (next()) switch (character) {
      // ] ) " '
      case type:
        return position;
      // " '
      case 34:
      case 39:
        if (type !== 34 && type !== 39) delimiter(character);
        break;
      // (
      case 40:
        if (type === 41) delimiter(type);
        break;
      // \
      case 92:
        next();
        break;
    }
    return position;
  }

  /**
   * @param {number} type
   * @param {number} index
   * @return {number}
   */
  function commenter(type, index) {
    while (next())
    // //
    if (type + character === 47 + 10) break;
    // /*
    else if (type + character === 42 + 42 && peek() === 47) break;
    return '/*' + slice(index, position - 1) + '*' + (0, require(_dependencyMap[0], "./Utility.js").from)(type === 47 ? type : next());
  }

  /**
   * @param {number} index
   * @return {string}
   */
  function identifier(index) {
    while (!token(peek())) next();
    return slice(index, position);
  }
},3844,[3842],"../../node_modules/stylis/src/Tokenizer.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.prefix = prefix;
  /**
   * @param {string} value
   * @param {number} length
   * @param {object[]} children
   * @return {string}
   */
  function prefix(value, length, children) {
    switch ((0, require(_dependencyMap[0], "./Utility.js").hash)(value, length)) {
      // color-adjust
      case 5103:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + 'print-' + value + value;
      // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
      case 5737:
      case 4201:
      case 3177:
      case 3433:
      case 1641:
      case 4457:
      case 2921:
      // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
      case 5572:
      case 6356:
      case 5844:
      case 3191:
      case 6645:
      case 3005:
      // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
      case 4215:
      case 6389:
      case 5109:
      case 5365:
      case 5621:
      case 3829:
      // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position
      case 6391:
      case 5879:
      case 5623:
      case 6135:
      case 4599:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + value;
      // mask-composite
      case 4855:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value.replace('add', 'source-over').replace('substract', 'source-out').replace('intersect', 'source-in').replace('exclude', 'xor') + value;
      // tab-size
      case 4789:
        return require(_dependencyMap[1], "./Enum.js").MOZ + value + value;
      // appearance, user-select, transform, hyphens, text-size-adjust
      case 5349:
      case 4246:
      case 4810:
      case 6968:
      case 2756:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MOZ + value + require(_dependencyMap[1], "./Enum.js").MS + value + value;
      // writing-mode
      case 5936:
        switch ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, length + 11)) {
          // vertical-l(r)
          case 114:
            return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /[svh]\w+-[tblr]{2}/, 'tb') + value;
          // vertical-r(l)
          case 108:
            return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value;
          // horizontal(-)tb
          case 45:
            return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /[svh]\w+-[tblr]{2}/, 'lr') + value;
          // default: fallthrough to below
        }
      // flex, flex-direction, scroll-snap-type, writing-mode
      case 6828:
      case 4268:
      case 2903:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + value + value;
      // order
      case 6165:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + 'flex-' + value + value;
      // align-items
      case 5187:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(\w+).+(:[^]+)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + 'box-$1$2' + require(_dependencyMap[1], "./Enum.js").MS + 'flex-$1$2') + value;
      // align-self
      case 5443:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + 'flex-item-' + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /flex-|-self/g, '') + (!(0, require(_dependencyMap[0], "./Utility.js").match)(value, /flex-|baseline/) ? require(_dependencyMap[1], "./Enum.js").MS + 'grid-row-' + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /flex-|-self/g, '') : '') + value;
      // align-content
      case 4675:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + 'flex-line-pack' + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /align-content|flex-|-self/g, '') + value;
      // flex-shrink
      case 5548:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'shrink', 'negative') + value;
      // flex-basis
      case 5292:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'basis', 'preferred-size') + value;
      // flex-grow
      case 6060:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + 'box-' + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, '-grow', '') + require(_dependencyMap[1], "./Enum.js").WEBKIT + value + require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'grow', 'positive') + value;
      // transition
      case 4554:
        return require(_dependencyMap[1], "./Enum.js").WEBKIT + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /([^-])(transform)/g, '$1' + require(_dependencyMap[1], "./Enum.js").WEBKIT + '$2') + value;
      // cursor
      case 6187:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)((0, require(_dependencyMap[0], "./Utility.js").replace)((0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(zoom-|grab)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + '$1'), /(image-set)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + '$1'), value, '') + value;
      // background, background-image
      case 5495:
      case 3959:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(image-set\([^]*)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + '$1' + '$`$1');
      // justify-content
      case 4968:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)((0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(.+:)(flex-)?(.*)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + 'box-pack:$3' + require(_dependencyMap[1], "./Enum.js").MS + 'flex-pack:$3'), /space-between/, 'justify') + require(_dependencyMap[1], "./Enum.js").WEBKIT + value + value;
      // justify-self
      case 4200:
        if (!(0, require(_dependencyMap[0], "./Utility.js").match)(value, /flex-|baseline/)) return require(_dependencyMap[1], "./Enum.js").MS + 'grid-column-align' + (0, require(_dependencyMap[0], "./Utility.js").substr)(value, length) + value;
        break;
      // grid-template-(columns|rows)
      case 2592:
      case 3360:
        return require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'template-', '') + value;
      // grid-(row|column)-start
      case 4384:
      case 3616:
        if (children && children.some(function (element, index) {
          return length = index, (0, require(_dependencyMap[0], "./Utility.js").match)(element.props, /grid-\w+-end/);
        })) {
          return ~(0, require(_dependencyMap[0], "./Utility.js").indexof)(value + (children = children[length].value), 'span', 0) ? value : require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, '-start', '') + value + require(_dependencyMap[1], "./Enum.js").MS + 'grid-row-span:' + (~(0, require(_dependencyMap[0], "./Utility.js").indexof)(children, 'span', 0) ? (0, require(_dependencyMap[0], "./Utility.js").match)(children, /\d+/) : +(0, require(_dependencyMap[0], "./Utility.js").match)(children, /\d+/) - +(0, require(_dependencyMap[0], "./Utility.js").match)(value, /\d+/)) + ';';
        }
        return require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)(value, '-start', '') + value;
      // grid-(row|column)-end
      case 4896:
      case 4128:
        return children && children.some(function (element) {
          return (0, require(_dependencyMap[0], "./Utility.js").match)(element.props, /grid-\w+-start/);
        }) ? value : require(_dependencyMap[1], "./Enum.js").MS + (0, require(_dependencyMap[0], "./Utility.js").replace)((0, require(_dependencyMap[0], "./Utility.js").replace)(value, '-end', '-span'), 'span ', '') + value;
      // (margin|padding)-inline-(start|end)
      case 4095:
      case 3583:
      case 4068:
      case 2532:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(.+)-inline(.+)/, require(_dependencyMap[1], "./Enum.js").WEBKIT + '$1$2') + value;
      // (min|max)?(width|height|inline-size|block-size)
      case 8116:
      case 7059:
      case 5753:
      case 5535:
      case 5445:
      case 5701:
      case 4933:
      case 4677:
      case 5533:
      case 5789:
      case 5021:
      case 4765:
        // stretch, max-content, min-content, fill-available
        if ((0, require(_dependencyMap[0], "./Utility.js").strlen)(value) - 1 - length > 6) switch ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, length + 1)) {
          // (m)ax-content, (m)in-content
          case 109:
            // -
            if ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, length + 4) !== 45) break;
          // (f)ill-available, (f)it-content
          case 102:
            return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(.+:)(.+)-([^]+)/, '$1' + require(_dependencyMap[1], "./Enum.js").WEBKIT + '$2-$3' + '$1' + require(_dependencyMap[1], "./Enum.js").MOZ + ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, length + 3) == 108 ? '$3' : '$2-$3')) + value;
          // (s)tretch
          case 115:
            return ~(0, require(_dependencyMap[0], "./Utility.js").indexof)(value, 'stretch', 0) ? prefix((0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'stretch', 'fill-available'), length, children) + value : value;
        }
        break;
      // grid-(column|row)
      case 5152:
      case 5920:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/, function (_, a, b, c, d, e, f) {
          return require(_dependencyMap[1], "./Enum.js").MS + a + ':' + b + f + (c ? require(_dependencyMap[1], "./Enum.js").MS + a + '-span:' + (d ? e : +e - +b) + f : '') + value;
        });
      // position: sticky
      case 4949:
        // stick(y)?
        if ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, length + 6) === 121) return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, ':', ':' + require(_dependencyMap[1], "./Enum.js").WEBKIT) + value;
        break;
      // display: (flex|inline-flex|grid|inline-grid)
      case 6444:
        switch ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, (0, require(_dependencyMap[0], "./Utility.js").charat)(value, 14) === 45 ? 18 : 11)) {
          // (inline-)?fle(x)
          case 120:
            return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, /(.+:)([^;\s!]+)(;|(\s+)?!.+)?/, '$1' + require(_dependencyMap[1], "./Enum.js").WEBKIT + ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + require(_dependencyMap[1], "./Enum.js").WEBKIT + '$2$3' + '$1' + require(_dependencyMap[1], "./Enum.js").MS + '$2box$3') + value;
          // (inline-)?gri(d)
          case 100:
            return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, ':', ':' + require(_dependencyMap[1], "./Enum.js").MS) + value;
        }
        break;
      // scroll-margin, scroll-margin-(top|right|bottom|left)
      case 5719:
      case 2647:
      case 2135:
      case 3927:
      case 2391:
        return (0, require(_dependencyMap[0], "./Utility.js").replace)(value, 'scroll-', 'scroll-snap-') + value;
    }
    return value;
  }
},3845,[3842,3841],"../../node_modules/stylis/src/Prefixer.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.serialize = serialize;
  exports.stringify = stringify;
  /**
   * @param {object[]} children
   * @param {function} callback
   * @return {string}
   */
  function serialize(children, callback) {
    var output = '';
    for (var i = 0; i < children.length; i++) output += callback(children[i], i, children, callback) || '';
    return output;
  }

  /**
   * @param {object} element
   * @param {number} index
   * @param {object[]} children
   * @param {function} callback
   * @return {string}
   */
  function stringify(element, index, children, callback) {
    switch (element.type) {
      case require(_dependencyMap[0], "./Enum.js").LAYER:
        if (element.children.length) break;
      case require(_dependencyMap[0], "./Enum.js").IMPORT:
      case require(_dependencyMap[0], "./Enum.js").NAMESPACE:
      case require(_dependencyMap[0], "./Enum.js").DECLARATION:
        return element.return = element.return || element.value;
      case require(_dependencyMap[0], "./Enum.js").COMMENT:
        return '';
      case require(_dependencyMap[0], "./Enum.js").KEYFRAMES:
        return element.return = element.value + '{' + serialize(element.children, callback) + '}';
      case require(_dependencyMap[0], "./Enum.js").RULESET:
        if (!(0, require(_dependencyMap[1], "./Utility.js").strlen)(element.value = element.props.join(','))) return '';
    }
    return (0, require(_dependencyMap[1], "./Utility.js").strlen)(children = serialize(element.children, callback)) ? element.return = element.value + '{' + children + '}' : '';
  }
},3846,[3841,3842],"../../node_modules/stylis/src/Serializer.js");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.middleware = middleware;
  exports.namespace = namespace;
  exports.prefixer = prefixer;
  exports.rulesheet = rulesheet;
  /**
   * @param {function[]} collection
   * @return {function}
   */
  function middleware(collection) {
    var length = (0, require(_dependencyMap[0], "./Utility.js").sizeof)(collection);
    return function (element, index, children, callback) {
      var output = '';
      for (var i = 0; i < length; i++) output += collection[i](element, index, children, callback) || '';
      return output;
    };
  }

  /**
   * @param {function} callback
   * @return {function}
   */
  function rulesheet(callback) {
    return function (element) {
      if (!element.root) if (element = element.return) callback(element);
    };
  }

  /**
   * @param {object} element
   * @param {number} index
   * @param {object[]} children
   * @param {function} callback
   */
  function prefixer(element, index, children, callback) {
    if (element.length > -1) if (!element.return) switch (element.type) {
      case require(_dependencyMap[1], "./Enum.js").DECLARATION:
        element.return = (0, require(_dependencyMap[2], "./Prefixer.js").prefix)(element.value, element.length, children);
        return;
      case require(_dependencyMap[1], "./Enum.js").KEYFRAMES:
        return (0, require(_dependencyMap[3], "./Serializer.js").serialize)([(0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
          value: (0, require(_dependencyMap[0], "./Utility.js").replace)(element.value, '@', '@' + require(_dependencyMap[1], "./Enum.js").WEBKIT)
        })], callback);
      case require(_dependencyMap[1], "./Enum.js").RULESET:
        if (element.length) return (0, require(_dependencyMap[0], "./Utility.js").combine)(children = element.props, function (value) {
          switch ((0, require(_dependencyMap[0], "./Utility.js").match)(value, callback = /(::plac\w+|:read-\w+)/)) {
            // :read-(only|write)
            case ':read-only':
            case ':read-write':
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [(0, require(_dependencyMap[0], "./Utility.js").replace)(value, /:(read-\w+)/, ':' + require(_dependencyMap[1], "./Enum.js").MOZ + '$1')]
              }));
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [value]
              }));
              (0, require(_dependencyMap[0], "./Utility.js").assign)(element, {
                props: (0, require(_dependencyMap[0], "./Utility.js").filter)(children, callback)
              });
              break;
            // :placeholder
            case '::placeholder':
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [(0, require(_dependencyMap[0], "./Utility.js").replace)(value, /:(plac\w+)/, ':' + require(_dependencyMap[1], "./Enum.js").WEBKIT + 'input-$1')]
              }));
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [(0, require(_dependencyMap[0], "./Utility.js").replace)(value, /:(plac\w+)/, ':' + require(_dependencyMap[1], "./Enum.js").MOZ + '$1')]
              }));
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [(0, require(_dependencyMap[0], "./Utility.js").replace)(value, /:(plac\w+)/, require(_dependencyMap[1], "./Enum.js").MS + 'input-$1')]
              }));
              (0, require(_dependencyMap[4], "./Tokenizer.js").lift)((0, require(_dependencyMap[4], "./Tokenizer.js").copy)(element, {
                props: [value]
              }));
              (0, require(_dependencyMap[0], "./Utility.js").assign)(element, {
                props: (0, require(_dependencyMap[0], "./Utility.js").filter)(children, callback)
              });
              break;
          }
          return '';
        });
    }
  }

  /**
   * @param {object} element
   * @param {number} index
   * @param {object[]} children
   */
  function namespace(element) {
    switch (element.type) {
      case require(_dependencyMap[1], "./Enum.js").RULESET:
        element.props = element.props.map(function (value) {
          return (0, require(_dependencyMap[0], "./Utility.js").combine)((0, require(_dependencyMap[4], "./Tokenizer.js").tokenize)(value), function (value, index, children) {
            switch ((0, require(_dependencyMap[0], "./Utility.js").charat)(value, 0)) {
              // \f
              case 12:
                return (0, require(_dependencyMap[0], "./Utility.js").substr)(value, 1, (0, require(_dependencyMap[0], "./Utility.js").strlen)(value));
              // \0 ( + > ~
              case 0:
              case 40:
              case 43:
              case 62:
              case 126:
                return value;
              // :
              case 58:
                if (children[++index] === 'global') children[index] = '', children[++index] = '\f' + (0, require(_dependencyMap[0], "./Utility.js").substr)(children[index], index = 1, -1);
              // \s
              case 32:
                return index === 1 ? '' : value;
              default:
                switch (index) {
                  case 0:
                    element = value;
                    return (0, require(_dependencyMap[0], "./Utility.js").sizeof)(children) > 1 ? '' : value;
                  case index = (0, require(_dependencyMap[0], "./Utility.js").sizeof)(children) - 1:
                  case 2:
                    return index === 2 ? value + element + element : value + element;
                  default:
                    return value;
                }
            }
          });
        });
    }
  }
},3847,[3842,3841,3845,3846,3844],"../../node_modules/stylis/src/Middleware.js");
//# sourceMappingURL=http://localhost:8081/packages/happy-app/index.ts.map?platform=web&dev=true&hot=false&transform.routerRoot=.%2Fsources%2Fapp&resolver.exporting=true&serializer.splitChunks=true&serializer.output=static&serializer.map=true
//# debugId=985b09a5-22c4-48d0-b349-e061ebce1540