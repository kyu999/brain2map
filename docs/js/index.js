var svg = d3.select('svg'),
    width = +svg.attr('width'),
    height = +svg.attr('height'),
    color = d3.scaleOrdinal(d3.schemeCategory10),
    valueline = d3.line()
                  .x(function(d) { return d[0]; })
                  .y(function(d) { return d[1]; })
                  .curve(d3.curveCatmullRomClosed),
    scaleFactor = 1.3,
    simulation = d3.forceSimulation()
                   .force('link', d3.forceLink().id(function(d) { return d.id; }).distance(160).strength(0.7))
                   .force('charge', d3.forceManyBody().strength(-200))
                   .force('center', d3.forceCenter(width / 2, height / 2))
    d3.forceCollide([-100])

var defs = svg.append("defs")

setArrow(svg);

d3.json('data/sample.json', function(error, graph) {
  if (error) { throw error; }

  var imgPattern = defs.selectAll("pattern")
                       .data(graph.nodes)
                       .enter()
                       .append("pattern")
                         .attr("id", function(d){ return d.id; })
                         .attr("width", 1)
                         .attr("height", 1)
                         .attr("patternUnits", "objectBoundingBox")
                       .append("image")
                         .attr("x", 0)
                         .attr("y", 0)
                         .attr("width", 40)
                         .attr("height", 40)
                         .attr("opacity", 0.8)
                         .attr("xlink:href", function(d) {
                           return d.img;
                         })

  // create groups, links and nodes
  var groups = svg.append('g').attr('class', 'groups');

  var link = svg.append('g')
                .attr('class', 'links')
                .selectAll('line')
                .data(graph.links)
                .enter().append('line')
                .attr('stroke-width', function(d) { return Math.sqrt(d.value); })
                .attr('class', 'link')
                .style('marker-end', function(d){ return d.arror ? 'url(#arrow)' : '' });

  var nodes_container = svg.append('g')
                           .attr('class', 'nodes')

  var nodes = nodes_container.selectAll('g')
                             .data(graph.nodes)
                             .enter()
                             .append('g')

  // count members of each group. Groups with less
  // than 3 member will not be considered (creating
  // a convex hull need 3 points at least)
  var groupIds = d3.set(graph.nodes.map(function(n) { return +n.group; }))
                   .values()
                   .map( function(groupId) {
                     return {
                       groupId : groupId,
                       count : graph.nodes.filter(function(n) { return +n.group == groupId; }).length
                     };
                   })
                   .filter( function(group) { return group.count > 2;})
                   .map( function(group) { return group.groupId; });

  var paths = groups.selectAll('.path_placeholder')
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

  var circles = nodes.append('circle')
                     .attr('r', 20)
                     .attr('stroke', function(d){ return d.img === "" ? "gray" : "#fff" })
                     .style("fill", function(d){ return d.img === "" ? color(d.group) : 'url(#' + d.id + ')'})
                     .call(d3.drag()
                     .on('start', dragstarted)
                     .on('drag', dragged)
                     .on('end', dragended));

  var texts = nodes.append('text').text(function(d){ return d.id; })

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
    nodes.attr('transform', function(d){ return 'scale(1) translate(' + d.x + ',' + d.y + ')'; })

    updateGroups(nodes, groupIds, paths, scaleFactor);
  }

});
