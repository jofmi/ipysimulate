// First undefine 'circles' so we can easily reload this file.
var d3 = require('d3');

var linechart = function (container, data, width, height) {

	console.log(d3)

	// Measures
    //width = width || 600;
    //height = height || 200;
    var margin = {top: 20, right: 30, bottom: 30, left: 40}

    // Create canvas
    var svg = d3.select(container).append("svg")
        .attr("viewBox", [0, 0, width, height])
        //.attr("preserveAspectRatio", "none")
        //.attr('width', width)
        //.attr('height', height)
        .append("g");

    // Scale functions:
	var x = d3.scaleLinear()
	  .range([margin.left, width - margin.right])
	  .domain([0, 0]);
	var y = d3.scaleLinear()
	  .range([height - margin.bottom, margin.top])
	  .domain([0, 0]);

	// Axis
	var xAxis = d3.axisBottom().scale(x);
	var yAxis = d3.axisLeft().scale(y);
	svg.append("g")
	  .attr("transform", `translate(0,${height - margin.bottom})`)
	  .attr("class","myXaxis")
	svg.append("g")
	  .attr("transform", `translate(${margin.left},0)`)
	  .attr("class","myYaxis")

	// Create a function that takes a dataset as input and updates the plot:
	function update(data) {

	  // Create a update selection: bind to the new data
	  var u = svg.selectAll(".lineTest")
	    .data([data], function(d){ return d.t });

	  // Add new point to line TODO IMPROVE
	  u
	    .enter()
	    .append("path")
	    .attr("class","lineTest")
	    .merge(u)
	    .attr("d", d3.line()
	      .x(function(d) { return x(d.t); })
	      .y(function(d) { return y(d.v); }))
	    .attr("fill", "none")
	    .attr("stroke", "steelblue")

	  // Update scale
	  x.domain([0, d3.max(data, function(d) { return d.t }) ]);
	  y.domain([d3.min(data, function(d) { return d.v  }), 
	  			d3.max(data, function(d) { return d.v  }) ]);

	  // Update line
	  u
	    .transition()
	    .duration(100)
	    .attr("d", d3.line()
	      .x(function(d) { return x(d.t); })
	      .y(function(d) { return y(d.v); }))

	  // Update axis
	  svg.selectAll(".myXaxis")
	    .transition()
	    .duration(100)
	    .call(xAxis);
	  svg.selectAll(".myYaxis")
	    .transition()
	    .duration(100)
	    .call(yAxis);

	}

    update(data)

    return update

};


module.exports = {
	linechart: linechart,
};




