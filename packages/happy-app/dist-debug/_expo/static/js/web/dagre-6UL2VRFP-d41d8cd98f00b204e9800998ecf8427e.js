__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.render = void 0;
  require(_dependencyMap[0], "./chunk-HN2XXSSU.mjs");
  require(_dependencyMap[1], "./chunk-ATLVNIR6.mjs");
  require(_dependencyMap[2], "./chunk-JA3XYJ7Z.mjs");
  require(_dependencyMap[3], "./chunk-S3R3BYOJ.mjs");
  var graphlibJson2 = _interopRequireWildcard(require(_dependencyMap[4], "dagre-d3-es/src/graphlib/json.js"));
  var graphlibJson = graphlibJson2;
  var graphlib2 = _interopRequireWildcard(require(_dependencyMap[5], "dagre-d3-es/src/graphlib/index.js"));
  var graphlib = graphlib2;
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  // src/rendering-util/layout-algorithms/dagre/index.js

  // src/rendering-util/layout-algorithms/dagre/mermaid-graphlib.js

  var clusterDb = /* @__PURE__ */new Map();
  var descendants = /* @__PURE__ */new Map();
  var parents = /* @__PURE__ */new Map();
  var clear4 = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(() => {
    descendants.clear();
    parents.clear();
    clusterDb.clear();
  }, "clear");
  var isDescendant = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((id, ancestorId) => {
    const ancestorDescendants = descendants.get(ancestorId) || [];
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("In isDescendant", ancestorId, " ", id, " = ", ancestorDescendants.includes(id));
    return ancestorDescendants.includes(id);
  }, "isDescendant");
  var edgeInCluster = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((edge, clusterId) => {
    const clusterDescendants = descendants.get(clusterId) || [];
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Descendants of ", clusterId, " is ", clusterDescendants);
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge is ", edge);
    if (edge.v === clusterId || edge.w === clusterId) {
      return false;
    }
    if (!clusterDescendants) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Tilt, ", clusterId, ",not in descendants");
      return false;
    }
    return clusterDescendants.includes(edge.v) || isDescendant(edge.v, clusterId) || isDescendant(edge.w, clusterId) || clusterDescendants.includes(edge.w);
  }, "edgeInCluster");
  var copy = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((clusterId, graph, newGraph, rootId) => {
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Copying children of ", clusterId, "root", rootId, "data", graph.node(clusterId), rootId);
    const nodes = graph.children(clusterId) || [];
    if (clusterId !== rootId) {
      nodes.push(clusterId);
    }
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Copying (nodes) clusterId", clusterId, "nodes", nodes);
    nodes.forEach(node => {
      if (graph.children(node).length > 0) {
        copy(node, graph, newGraph, rootId);
      } else {
        const data = graph.node(node);
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("cp ", node, " to ", rootId, " with parent ", clusterId);
        newGraph.setNode(node, data);
        if (rootId !== graph.parent(node)) {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Setting parent", node, graph.parent(node));
          newGraph.setParent(node, graph.parent(node));
        }
        if (clusterId !== rootId && node !== clusterId) {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Setting parent", node, clusterId);
          newGraph.setParent(node, clusterId);
        } else {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("In copy ", clusterId, "root", rootId, "data", graph.node(clusterId), rootId);
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Not Setting parent for node=", node, "cluster!==rootId", clusterId !== rootId, "node!==clusterId", node !== clusterId);
        }
        const edges = graph.edges(node);
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Copying Edges", edges);
        edges.forEach(edge => {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge", edge);
          const data2 = graph.edge(edge.v, edge.w, edge.name);
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge data", data2, rootId);
          try {
            if (edgeInCluster(edge, rootId)) {
              require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Copying as ", edge.v, edge.w, data2, edge.name);
              newGraph.setEdge(edge.v, edge.w, data2, edge.name);
              require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("newGraph edges ", newGraph.edges(), newGraph.edge(newGraph.edges()[0]));
            } else {
              require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Skipping copy of edge ", edge.v, "-->", edge.w, " rootId: ", rootId, " clusterId:", clusterId);
            }
          } catch (e) {
            require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.error(e);
          }
        });
      }
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Removing node", node);
      graph.removeNode(node);
    });
  }, "copy");
  var extractDescendants = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((id, graph) => {
    const children = graph.children(id);
    let res = [...children];
    for (const child of children) {
      parents.set(child, id);
      res = [...res, ...extractDescendants(child, graph)];
    }
    return res;
  }, "extractDescendants");
  var findCommonEdges = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((graph, id1, id2) => {
    const edges1 = graph.edges().filter(edge => edge.v === id1 || edge.w === id1);
    const edges2 = graph.edges().filter(edge => edge.v === id2 || edge.w === id2);
    const edges1Prim = edges1.map(edge => {
      return {
        v: edge.v === id1 ? id2 : edge.v,
        w: edge.w === id1 ? id1 : edge.w
      };
    });
    const edges2Prim = edges2.map(edge => {
      return {
        v: edge.v,
        w: edge.w
      };
    });
    const result = edges1Prim.filter(edgeIn1 => {
      return edges2Prim.some(edge => edgeIn1.v === edge.v && edgeIn1.w === edge.w);
    });
    return result;
  }, "findCommonEdges");
  var findNonClusterChild = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((id, graph, clusterId) => {
    const children = graph.children(id);
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Searching children of id ", id, children);
    if (children.length < 1) {
      return id;
    }
    let reserve;
    for (const child of children) {
      const _id = findNonClusterChild(child, graph, clusterId);
      const commonEdges = findCommonEdges(graph, clusterId, _id);
      if (_id) {
        if (commonEdges.length > 0) {
          reserve = _id;
        } else {
          return _id;
        }
      }
    }
    return reserve;
  }, "findNonClusterChild");
  var getAnchorId = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(id => {
    if (!clusterDb.has(id)) {
      return id;
    }
    if (!clusterDb.get(id).externalConnections) {
      return id;
    }
    if (clusterDb.has(id)) {
      return clusterDb.get(id).id;
    }
    return id;
  }, "getAnchorId");
  var adjustClustersAndEdges = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((graph, depth) => {
    if (!graph || depth > 10) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Opting out, no graph ");
      return;
    } else {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Opting in, graph ");
    }
    graph.nodes().forEach(function (id) {
      const children = graph.children(id);
      if (children.length > 0) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Cluster identified", id, " Replacement id in edges: ", findNonClusterChild(id, graph, id));
        descendants.set(id, extractDescendants(id, graph));
        clusterDb.set(id, {
          id: findNonClusterChild(id, graph, id),
          clusterData: graph.node(id)
        });
      }
    });
    graph.nodes().forEach(function (id) {
      const children = graph.children(id);
      const edges = graph.edges();
      if (children.length > 0) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Cluster identified", id, descendants);
        edges.forEach(edge => {
          const d1 = isDescendant(edge.v, id);
          const d2 = isDescendant(edge.w, id);
          if (d1 ^ d2) {
            require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Edge: ", edge, " leaves cluster ", id);
            require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Descendants of XXX ", id, ": ", descendants.get(id));
            clusterDb.get(id).externalConnections = true;
          }
        });
      } else {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Not a cluster ", id, descendants);
      }
    });
    for (let id of clusterDb.keys()) {
      const nonClusterChild = clusterDb.get(id).id;
      const parent = graph.parent(nonClusterChild);
      if (parent !== id && clusterDb.has(parent) && !clusterDb.get(parent).externalConnections) {
        clusterDb.get(id).id = parent;
      }
    }
    graph.edges().forEach(function (e) {
      const edge = graph.edge(e);
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(e));
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(graph.edge(e)));
      let v = e.v;
      let w = e.w;
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Fix XXX", clusterDb, "ids:", e.v, e.w, "Translating: ", clusterDb.get(e.v), " --- ", clusterDb.get(e.w));
      if (clusterDb.get(e.v) || clusterDb.get(e.w)) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Fixing and trying - removing XXX", e.v, e.w, e.name);
        v = getAnchorId(e.v);
        w = getAnchorId(e.w);
        graph.removeEdge(e.v, e.w, e.name);
        if (v !== e.v) {
          const parent = graph.parent(v);
          clusterDb.get(parent).externalConnections = true;
          edge.fromCluster = e.v;
        }
        if (w !== e.w) {
          const parent = graph.parent(w);
          clusterDb.get(parent).externalConnections = true;
          edge.toCluster = e.w;
        }
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Fix Replacing with XXX", v, w, e.name);
        graph.setEdge(v, w, edge, e.name);
      }
    });
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Adjusted Graph", graphlibJson.write(graph));
    extractor(graph, 0);
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace(clusterDb);
  }, "adjustClustersAndEdges");
  var extractor = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((graph, depth) => {
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("extractor - ", depth, graphlibJson.write(graph), graph.children("D"));
    if (depth > 10) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.error("Bailing out");
      return;
    }
    let nodes = graph.nodes();
    let hasChildren = false;
    for (const node of nodes) {
      const children = graph.children(node);
      hasChildren = hasChildren || children.length > 0;
    }
    if (!hasChildren) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Done, no node has children", graph.nodes());
      return;
    }
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Nodes = ", nodes, depth);
    for (const node of nodes) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Extracting node", node, clusterDb, clusterDb.has(node) && !clusterDb.get(node).externalConnections, !graph.parent(node), graph.node(node), graph.children("D"), " Depth ", depth);
      if (!clusterDb.has(node)) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Not a cluster", node, depth);
      } else if (!clusterDb.get(node).externalConnections && graph.children(node) && graph.children(node).length > 0) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Cluster without external connections, without a parent and with children", node, depth);
        const graphSettings = graph.graph();
        let dir = graphSettings.rankdir === "TB" ? "LR" : "TB";
        if (clusterDb.get(node)?.clusterData?.dir) {
          dir = clusterDb.get(node).clusterData.dir;
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Fixing dir", clusterDb.get(node).clusterData.dir, dir);
        }
        const clusterGraph = new graphlib.Graph({
          multigraph: true,
          compound: true
        }).setGraph({
          rankdir: dir,
          nodesep: 50,
          ranksep: 50,
          marginx: 8,
          marginy: 8
        }).setDefaultEdgeLabel(function () {
          return {};
        });
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Old graph before copy", graphlibJson.write(graph));
        copy(node, graph, clusterGraph, node);
        graph.setNode(node, {
          clusterNode: true,
          id: node,
          clusterData: clusterDb.get(node).clusterData,
          label: clusterDb.get(node).label,
          graph: clusterGraph
        });
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("New graph after copy node: (", node, ")", graphlibJson.write(clusterGraph));
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Old graph after copy", graphlibJson.write(graph));
      } else {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Cluster ** ", node, " **not meeting the criteria !externalConnections:", !clusterDb.get(node).externalConnections, " no parent: ", !graph.parent(node), " children ", graph.children(node) && graph.children(node).length > 0, graph.children("D"), depth);
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug(clusterDb);
      }
    }
    nodes = graph.nodes();
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("New list of nodes", nodes);
    for (const node of nodes) {
      const data = graph.node(node);
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn(" Now next level", node, data);
      if (data?.clusterNode) {
        extractor(data.graph, depth + 1);
      }
    }
  }, "extractor");
  var sorter = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)((graph, nodes) => {
    if (nodes.length === 0) {
      return [];
    }
    let result = Object.assign([], nodes);
    nodes.forEach(node => {
      const children = graph.children(node);
      const sorted = sorter(graph, children);
      result = [...result, ...sorted];
    });
    return result;
  }, "sorter");
  var sortNodesByHierarchy = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(graph => sorter(graph, graph.children()), "sortNodesByHierarchy");

  // src/rendering-util/layout-algorithms/dagre/index.js
  var recursiveRender = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(async (_elem, graph, diagramType, id, parentCluster, siteConfig) => {
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Graph in recursive render:XAX", graphlibJson2.write(graph), parentCluster);
    const dir = graph.graph().rankdir;
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Dir in recursive render - dir:", dir);
    const elem = _elem.insert("g").attr("class", "root");
    if (!graph.nodes()) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("No nodes found for", graph);
    } else {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Recursive render XXX", graph.nodes());
    }
    if (graph.edges().length > 0) {
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Recursive edges", graph.edge(graph.edges()[0]));
    }
    const clusters = elem.insert("g").attr("class", "clusters");
    const edgePaths = elem.insert("g").attr("class", "edgePaths");
    const edgeLabels = elem.insert("g").attr("class", "edgeLabels");
    const nodes = elem.insert("g").attr("class", "nodes");
    await Promise.all(graph.nodes().map(async function (v) {
      const node = graph.node(v);
      if (parentCluster !== void 0) {
        const data = JSON.parse(JSON.stringify(parentCluster.clusterData));
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Setting data for parent cluster XXX\n Node.id = ", v, "\n data=", data.height, "\nParent cluster", parentCluster.height);
        graph.setNode(parentCluster.id, data);
        if (!graph.parent(v)) {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Setting parent", v, parentCluster.id);
          graph.setParent(v, parentCluster.id, data);
        }
      }
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("(Insert) Node XXX" + v + ": " + JSON.stringify(graph.node(v)));
      if (node?.clusterNode) {
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Cluster identified XBX", v, node.width, graph.node(v));
        const {
          ranksep,
          nodesep
        } = graph.graph();
        node.graph.setGraph(Object.assign({}, node.graph.graph(), {
          ranksep: ranksep + 25,
          nodesep
        }));
        const o = await recursiveRender(nodes, node.graph, diagramType, id, graph.node(v), siteConfig);
        const newEl = o.elem;
        (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").updateNodeBounds)(node, newEl);
        node.diff = o.diff || 0;
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("New compound node after recursive render XAX", v, "width",
        // node,
        node.width, "height", node.height
        // node.x,
        // node.y
        );
        (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").setNodeElem)(newEl, node);
      } else {
        if (graph.children(v).length > 0) {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Cluster - the non recursive path XBX", v, node.id, node, node.width, "Graph:", graph);
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace(findNonClusterChild(node.id, graph));
          clusterDb.set(node.id, {
            id: findNonClusterChild(node.id, graph),
            node
          });
        } else {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.trace("Node - the non recursive path XAX", v, nodes, graph.node(v), dir);
          await (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").insertNode)(nodes, graph.node(v), {
            config: siteConfig,
            dir
          });
        }
      }
    }));
    const processEdges = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(async () => {
      const edgePromises = graph.edges().map(async function (e) {
        const edge = graph.edge(e.v, e.w, e.name);
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(e));
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge " + e.v + " -> " + e.w + ": ", e, " ", JSON.stringify(graph.edge(e)));
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Fix", clusterDb, "ids:", e.v, e.w, "Translating: ", clusterDb.get(e.v), clusterDb.get(e.w));
        await (0, require(_dependencyMap[8], "./chunk-QXUST7PY.mjs").insertEdgeLabel)(edgeLabels, edge);
      });
      await Promise.all(edgePromises);
    }, "processEdges");
    await processEdges();
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Graph before layout:", JSON.stringify(graphlibJson2.write(graph)));
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("############################################# XXX");
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("###                Layout                 ### XXX");
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("############################################# XXX");
    (0, require(_dependencyMap[9], "dagre-d3-es/src/dagre/index.js").layout)(graph);
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Graph after layout:", JSON.stringify(graphlibJson2.write(graph)));
    let diff = 0;
    let {
      subGraphTitleTotalMargin
    } = (0, require(_dependencyMap[10], "./chunk-CVBHYZKI.mjs").getSubGraphTitleMargins)(siteConfig);
    await Promise.all(sortNodesByHierarchy(graph).map(async function (v) {
      const node = graph.node(v);
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Position XBX => " + v + ": (" + node.x, "," + node.y, ") width: ", node.width, " height: ", node.height);
      if (node?.clusterNode) {
        node.y += subGraphTitleTotalMargin;
        require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("A tainted cluster node XBX1", v, node.id, node.width, node.height, node.x, node.y, graph.parent(v));
        clusterDb.get(node.id).node = node;
        (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").positionNode)(node);
      } else {
        if (graph.children(v).length > 0) {
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("A pure cluster node XBX1", v, node.id, node.x, node.y, node.width, node.height, graph.parent(v));
          node.height += subGraphTitleTotalMargin;
          graph.node(node.parentId);
          const halfPadding = node?.padding / 2 || 0;
          const labelHeight = node?.labelBBox?.height || 0;
          const offsetY = labelHeight - halfPadding || 0;
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("OffsetY", offsetY, "labelHeight", labelHeight, "halfPadding", halfPadding);
          await (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").insertCluster)(clusters, node);
          clusterDb.get(node.id).node = node;
        } else {
          const parent = graph.node(node.parentId);
          node.y += subGraphTitleTotalMargin / 2;
          require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("A regular node XBX1 - using the padding", node.id, "parent", node.parentId, node.width, node.height, node.x, node.y, "offsetY", node.offsetY, "parent", parent, parent?.offsetY, node);
          (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").positionNode)(node);
        }
      }
    }));
    graph.edges().forEach(function (e) {
      const edge = graph.edge(e);
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(edge), edge);
      edge.points.forEach(point => point.y += subGraphTitleTotalMargin / 2);
      const startNode = graph.node(e.v);
      var endNode = graph.node(e.w);
      const paths = (0, require(_dependencyMap[8], "./chunk-QXUST7PY.mjs").insertEdge)(edgePaths, edge, clusterDb, diagramType, startNode, endNode, id);
      (0, require(_dependencyMap[8], "./chunk-QXUST7PY.mjs").positionEdgeLabel)(edge, paths);
    });
    graph.nodes().forEach(function (v) {
      const n = graph.node(v);
      require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.info(v, n.type, n.diff);
      if (n.isGroup) {
        diff = n.diff;
      }
    });
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Returning from recursive render XAX", elem, diff);
    return {
      elem,
      diff
    };
  }, "recursiveRender");
  var render = exports.render = /* @__PURE__ */(0, require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").__name)(async (data4Layout, svg) => {
    const graph = new graphlib2.Graph({
      multigraph: true,
      compound: true
    }).setGraph({
      rankdir: data4Layout.direction,
      nodesep: data4Layout.config?.nodeSpacing || data4Layout.config?.flowchart?.nodeSpacing || data4Layout.nodeSpacing,
      ranksep: data4Layout.config?.rankSpacing || data4Layout.config?.flowchart?.rankSpacing || data4Layout.rankSpacing,
      marginx: 8,
      marginy: 8
    }).setDefaultEdgeLabel(function () {
      return {};
    });
    const element = svg.select("g");
    (0, require(_dependencyMap[8], "./chunk-QXUST7PY.mjs").markers_default)(element, data4Layout.markers, data4Layout.type, data4Layout.diagramId);
    (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").clear2)();
    (0, require(_dependencyMap[8], "./chunk-QXUST7PY.mjs").clear)();
    (0, require(_dependencyMap[7], "./chunk-JZLCHNYA.mjs").clear)();
    clear4();
    data4Layout.nodes.forEach(node => {
      graph.setNode(node.id, Object.assign({}, node));
      if (node.parentId) {
        graph.setParent(node.id, node.parentId);
      }
    });
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.debug("Edges:", data4Layout.edges);
    data4Layout.edges.forEach(edge => {
      if (edge.start === edge.end) {
        const nodeId = edge.start;
        const specialId1 = nodeId + "---" + nodeId + "---1";
        const specialId2 = nodeId + "---" + nodeId + "---2";
        const node = graph.node(nodeId);
        graph.setNode(specialId1, {
          domId: specialId1,
          id: specialId1,
          parentId: node.parentId,
          labelStyle: "",
          label: "",
          padding: 0,
          shape: "labelRect",
          // shape: 'rect',
          style: "",
          width: 10,
          height: 10
        });
        graph.setParent(specialId1, node.parentId);
        graph.setNode(specialId2, {
          domId: specialId2,
          id: specialId2,
          parentId: node.parentId,
          labelStyle: "",
          padding: 0,
          // shape: 'rect',
          shape: "labelRect",
          label: "",
          style: "",
          width: 10,
          height: 10
        });
        graph.setParent(specialId2, node.parentId);
        const edge1 = structuredClone(edge);
        const edgeMid = structuredClone(edge);
        const edge2 = structuredClone(edge);
        edge1.label = "";
        edge1.arrowTypeEnd = "none";
        edge1.id = nodeId + "-cyclic-special-1";
        edgeMid.arrowTypeStart = "none";
        edgeMid.arrowTypeEnd = "none";
        edgeMid.id = nodeId + "-cyclic-special-mid";
        edge2.label = "";
        if (node.isGroup) {
          edge1.fromCluster = nodeId;
          edge2.toCluster = nodeId;
        }
        edge2.id = nodeId + "-cyclic-special-2";
        edge2.arrowTypeStart = "none";
        graph.setEdge(nodeId, specialId1, edge1, nodeId + "-cyclic-special-0");
        graph.setEdge(specialId1, specialId2, edgeMid, nodeId + "-cyclic-special-1");
        graph.setEdge(specialId2, nodeId, edge2, nodeId + "-cyc<lic-special-2");
      } else {
        graph.setEdge(edge.start, edge.end, Object.assign({}, edge), edge.id);
      }
    });
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Graph at first:", JSON.stringify(graphlibJson2.write(graph)));
    adjustClustersAndEdges(graph);
    require(_dependencyMap[6], "./chunk-AGHRB4JF.mjs").log.warn("Graph after XAX:", JSON.stringify(graphlibJson2.write(graph)));
    const siteConfig = (0, require(_dependencyMap[11], "./chunk-ABZYJK2D.mjs").getConfig2)();
    await recursiveRender(element, graph, data4Layout.type, data4Layout.diagramId, void 0, siteConfig);
  }, "render");
},3904,[3849,3852,3888,3882,3905,3906,3854,3850,3848,3907,3851,3872],"../../node_modules/mermaid/dist/chunks/mermaid.core/dagre-6UL2VRFP.mjs");
__d(function (global, require, _$$_IMPORT_DEFAULT, _$$_IMPORT_ALL, module, exports, _dependencyMap) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.read = read;
  exports.write = write;
  var _ = _interopRequireWildcard(require(_dependencyMap[0], "lodash-es"));
  function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function (e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, default: e }; if (null === e || "object" != typeof e && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (const t in e) "default" !== t && {}.hasOwnProperty.call(e, t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, t)) && (i.get || i.set) ? o(f, t, i) : f[t] = e[t]); return f; })(e, t); }
  function write(g) {
    var json = {
      options: {
        directed: g.isDirected(),
        multigraph: g.isMultigraph(),
        compound: g.isCompound()
      },
      nodes: writeNodes(g),
      edges: writeEdges(g)
    };
    if (!_.isUndefined(g.graph())) {
      json.value = _.clone(g.graph());
    }
    return json;
  }
  function writeNodes(g) {
    return _.map(g.nodes(), function (v) {
      var nodeValue = g.node(v);
      var parent = g.parent(v);
      var node = {
        v: v
      };
      if (!_.isUndefined(nodeValue)) {
        node.value = nodeValue;
      }
      if (!_.isUndefined(parent)) {
        node.parent = parent;
      }
      return node;
    });
  }
  function writeEdges(g) {
    return _.map(g.edges(), function (e) {
      var edgeValue = g.edge(e);
      var edge = {
        v: e.v,
        w: e.w
      };
      if (!_.isUndefined(e.name)) {
        edge.name = e.name;
      }
      if (!_.isUndefined(edgeValue)) {
        edge.value = edgeValue;
      }
      return edge;
    });
  }
  function read(json) {
    var g = new (require(_dependencyMap[1], "./graph.js").Graph)(json.options).setGraph(json.value);
    _.each(json.nodes, function (entry) {
      g.setNode(entry.v, entry.value);
      if (entry.parent) {
        g.setParent(entry.v, entry.parent);
      }
    });
    _.each(json.edges, function (entry) {
      g.setEdge({
        v: entry.v,
        w: entry.w,
        name: entry.name
      }, entry.value);
    });
    return g;
  }
},3905,[3908,3909],"../../node_modules/dagre-d3-es/src/graphlib/json.js");
//# sourceMappingURL=http://localhost:8081/packages/happy-app/index.ts.map?platform=web&dev=true&hot=false&transform.routerRoot=.%2Fsources%2Fapp&resolver.exporting=true&serializer.splitChunks=true&serializer.output=static&serializer.map=true
//# debugId=12163186-72d5-465e-9e2f-15fa165fb979