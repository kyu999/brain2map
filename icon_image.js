function setIconImg(svg){
    svg.append('defs').selectAll('icon')
       .data(['arrow']).enter()
       .append('icon')
       .attr('id', function(d) { return d; })
};
