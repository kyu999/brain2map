// select nodes of the group, retrieve its positions
// and return the convex hull of the specified points
// (3 points as minimum, otherwise returns null)
function polygonGenerator(nodes, groupId) {
  var node_locations = nodes
    .filter(function(d) { return d.group == groupId; })
    .data()
    .map(function(d) { return [d.x, d.y]; });
  return d3.polygonHull(node_locations);
};

function updateGroups(nodes, groupIds, paths, scaleFactor) {
  groupIds.forEach(function(groupId) {
    var path = paths.filter(function(d) { return d == groupId;})
      .attr('transform', 'scale(1) translate(0,0)')
      .attr('d', function(d) {
        polygon = polygonGenerator(nodes, d);
        centroid = d3.polygonCentroid(polygon);

        // to scale the shape properly around its points:
        // move the 'g' element to the centroid point, translate
        // all the path around the center of the 'g' and then
        // we can scale the 'g' element properly
        return valueline(
          polygon.map(function(point) {
            return [  point[0] - centroid[0], point[1] - centroid[1] ];
          })
        );
      });

    d3.select(path.node().parentNode).attr('transform', 'translate('  + centroid[0] + ',' + (centroid[1]) + ') scale(' + scaleFactor + ')');
  });
}

// drag nodes
function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  d.fx = null;
  d.fy = null;
}

// drag groups
function group_dragstarted(groupId) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.select(this).select('path').style('stroke-width', 3);
}

function group_dragged(groupId) {
  node
    .filter(function(d) { return d.group == groupId; })
    .each(function(d) {
      d.x += d3.event.dx;
      d.y += d3.event.dy;
    })
}

function group_dragended(groupId) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.select(this).select('path').style('stroke-width', 1);
}
