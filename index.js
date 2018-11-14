var svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height'),
    color = d3.scaleOrdinal(d3.schemeCategory20),
    valueline = d3.line()
                  .x(function(d) { return d[0]; })
                  .y(function(d) { return d[1]; })
                  .curve(d3.curveCatmullRomClosed),
    paths,
    groups,
    groupIds,
    scaleFactor = 1.2,
    polygon,
    centroid,
    node,
    link,
    curveTypes = ['curveBasisClosed', 'curveCardinalClosed', 'curveCatmullRomClosed', 'curveLinearClosed'],
    simulation = d3.forceSimulation()
                   .force('link', d3.forceLink().id(function(d) { return d.id; }).distance(30).strength(0.05))
                   .force('charge', d3.forceManyBody())
                   .force('center', d3.forceCenter(width / 2, height / 2))

var defs = svg.append("defs")
var imgPattern = defs.selectAll("pattern").data([0])
  .enter()
.append("pattern")
    .attr("id", 'img_7')
    .attr("width", 1)
    .attr("height", 1)
    .attr("patternUnits", "objectBoundingBox")
  .append("image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 40)
    .attr("height", 40)
    .attr("xlink:href", function(d) {
      return "http://image.news.livedoor.com/newsimage/9/2/92c5a_137_db5bac69_2ac8288c-cm.jpg?v=20170820144734";
    })

setArrow(svg);

d3.json('data.json', function(error, graph) {
  if (error) throw error;

  // create selector for curve types
  var select = d3.select('#curveSettings')
                 .append('select')
                 .attr('class','select')
                 .on('change', function() {
                     var val = d3.select('select').property('value');
                     d3.select('#curveLabel').text(val);
                     valueline.curve(d3[val]);
                     updateGroups();
                 });

  var options = select
    .selectAll('option')
    .data(curveTypes).enter()
    .append('option')
    .text(function (d) { return d; });

  // create groups, links and nodes
  groups = svg.append('g').attr('class', 'groups');

  link = svg.append('g')
            .attr('class', 'links')
              .selectAll('line')
              .data(graph.links)
              .enter().append('line')
              .attr('stroke-width', function(d) { return Math.sqrt(d.value); })
              .attr('class', 'link')
              .style('stroke-width', 1)
              .style('marker-end', 'url(#arrow)');

  node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
              .data(graph.nodes)
              .enter().append('circle')
              .attr('r', 20)
              .style("fill", "url(#img_7)")
              .call(d3.drag()
                    .on('start', dragstarted)
                    .on('drag', dragged)
                    .on('end', dragended));

  // count members of each group. Groups with less
  // than 3 member will not be considered (creating
  // a convex hull need 3 points at least)
  groupIds = d3.set(graph.nodes.map(function(n) { return +n.group; }))
    .values()
    .map( function(groupId) {
      return {
        groupId : groupId,
        count : graph.nodes.filter(function(n) { return +n.group == groupId; }).length
      };
    })
    .filter( function(group) { return group.count > 2;})
    .map( function(group) { return group.groupId; });

  paths = groups.selectAll('.path_placeholder')
    .data(groupIds, function(d) { return +d; })
    .enter()
    .append('g')
    .attr('class', 'path_placeholder')
    .append('path')
    .attr('stroke', function(d) { return color(d); })
    .attr('fill', function(d) { return color(d); })
    .attr('opacity', 0);

  paths
    .transition()
    .duration(2000)
    .attr('opacity', 1);

  // add interaction to the groups
  groups.selectAll('.path_placeholder')
    .call(d3.drag()
      .on('start', group_dragstarted)
      .on('drag', group_dragged)
      .on('end', group_dragended)
      );

  node.append('title')
      .text(function(d) { return d.id; });

  simulation
      .nodes(graph.nodes)
      .on('tick', ticked)
      .force('link')
      .links(graph.links);

  function ticked() {
    link
        .attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });
    node
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });

    updateGroups();
  }

});

// select nodes of the group, retrieve its positions
// and return the convex hull of the specified points
// (3 points as minimum, otherwise returns null)
var polygonGenerator = function(groupId) {
  var node_coords = node
    .filter(function(d) { return d.group == groupId; })
    .data()
    .map(function(d) { return [d.x, d.y]; });

  return d3.polygonHull(node_coords);
};
