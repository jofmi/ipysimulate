var widgets = require('@jupyter-widgets/base');
var d3 = require('d3');
require('./charts.css');
require('lodash');


var LinechartModel = widgets.DOMWidgetModel.extend({

    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'LinechartModel',
        _view_name : 'LinechartView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
    }),

	initialize: function (attributes, options) {
        widgets.DOMWidgetModel.prototype.initialize.call(this, attributes, options);
		let promise = this.widget_manager.get_model(this.get('_control_id'))
		promise.then(this.connect_control.bind(this));
    },

    connect_control: function(control_model) {
    	// Connect chart to control
		this.control = control_model
		this.control.charts.push(this)
	},

	update: function(data) {
    	// Send data to all views
		for (var key in this.views){
			this.views[key].then(this.update_view.bind(null, data))
		}
	},

	update_view: function(data, view) {
    	// Send data to view
    	view.update(data)
	}

});


function responsivefy(svg) {
    // get container + svg aspect ratio
    var container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

    // add viewBox and preserveAspectRatio properties,
    // and call resize so that svg resizes on inital page load
    svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

    // to register multiple listeners for same event type,
    // you need to add namespace, i.e., 'click.foo'
    // necessary if you call invoke this function for multiple svgs
    // api docs: https://github.com/mbostock/d3/wiki/Selections#on
    d3.select(window).on("resize." + container.attr("id"), resize);

    // get width of container and resize svg to fit it
    function resize() {
        var targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
    }
}


var LinechartView = widgets.DOMWidgetView.extend({

    // Render view --------------------------------------------------------- //
    render: function() {

		// Create output area
        this.container = document.createElement("div");
        this.container.className = 'ipysimulate-chart'
        this.el.appendChild(this.container);

		// this.output, this.model.control.data, 500, 200
		// container, data, width, height

		// Measures
		var width = 600; // width || 600;
		var height = 400; // height || 200;
		var margin = {top: 20, right: 30, bottom: 30, left: 40}

		// Create canvas
		var svg = d3.select(this.container).append("svg")
			.attr("viewBox", [0, 0, width, height])
			//.attr("preserveAspectRatio", "xMinYMin meet")
			//.attr('width', width)
			//.attr('height', height)
			//.call(responsivefy);
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

		// References
		this.svg = svg
		this.x = x
		this.y = y
		this.xAxis = xAxis
		this.yAxis = yAxis

		this.update(this.model.control.data)

	},

	update: function (data) {

		// Create a update selection: bind to the new data
		var x = this.x
		var y = this.y
		var u = this.svg.selectAll(".lineTest")
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
		this.x.domain([0, d3.max(data, function(d) { return d.t }) ]);
		this.y.domain([d3.min(data, function(d) { return d.v  }),
				d3.max(data, function(d) { return d.v  }) ]);

		// Update line
		u
		.transition()
		.duration(100)
		.attr("d", d3.line()
		  .x(function(d) { return x(d.t); })
		  .y(function(d) { return y(d.v); }))

		// Update axis
		this.svg.selectAll(".myXaxis")
		.transition()
		.duration(100)
		.call(this.xAxis);
		this.svg.selectAll(".myYaxis")
		.transition()
		.duration(100)
		.call(this.yAxis);

		},

});

module.exports = {
    LinechartModel: LinechartModel,
    LinechartView: LinechartView,
};




