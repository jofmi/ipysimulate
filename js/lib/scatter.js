var widgets = require('@jupyter-widgets/base');
var semver_range = require('../package.json').version;
var d3 = require('d3');
require('./charts.css');
require('lodash');


var ScatterModel = widgets.DOMWidgetModel.extend({

    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ScatterModel',
        _view_name : 'ScatterView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : semver_range,
        _view_module_version : semver_range,
    }),

	initialize: function (attributes, options) {
        widgets.DOMWidgetModel.prototype
			.initialize.call(this, attributes, options);
		this.on('msg:custom', this._on_msg.bind(this));
		this.initial = true  // Trigger initial_update in view
    },

	_on_msg: function (command, buffers) {
        if (command.what) {
            switch (command.what) {
                case 'new_data':
                    this.update(command.data);
                    break;
                case 'reset_data':
                    this.reset(command.data);
                    break;
            }
        }
    },

	update: function(data) {
    	// Send data to all views
		for (var key in this.views) {
			this.views[key].then(this._update_view.bind(null, data))
		}
	},

	reset: function(data) {
    	this.initial = true;  // Trigger initial_update in view
    	this.update(data);
    },

	_update_view: function(data, view) {view.update(data);},

});


var ScatterView = widgets.DOMWidgetView.extend({

    // Render view --------------------------------------------------------- //
    render: function() {

    	this.r = 3  // TODO Dot radius

		// Create output area ---------------------------------------------- //

        this.container = document.createElement("div");
        this.container.className = 'ipysimulate-chart'
        this.el.appendChild(this.container);

		var width = 400;
		var height = 400;
		var margin = {top: 20, right: 30, bottom: 40, left: 30}

		this.svg = d3.select(this.container).append("svg")
			.attr("style", "width: 100%; height: 100%")
			.attr("viewBox", [0, 0, width, height])
			.append("g");

		this.x = d3.scaleLinear().range([margin.left, width - margin.right]);
		this.y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

		// Axis (will be completed in initial_update) ---------------------- //

		this.xAxis = d3.axisBottom().scale(this.x);
		this.yAxis = d3.axisLeft().scale(this.y);
		this.svg.append("g")
		  .attr("transform",
			    `translate(0,${height - margin.bottom + this.r * 2})`)
		  .attr("class", "myXaxis")
		this.svg.append("g")
		  .attr("transform",
			    `translate(${margin.left - this.r * 2},0)`)
		  .attr("class", "myYaxis")

		// Content --------------------------------------------------------- //

		// Dot collection (g)
		this.dots = this.svg.append("g")

	},

	initial_update: function(data) {

		// Update scale (extra space to keep dots within)
		this.x.domain(d3.extent(data, d => d.x));
		this.y.domain(d3.extent(data, d => d.y));

		// Set up colormap
		this.color = d3.scaleOrdinal(data.map(d => d.c), d3.schemeCategory10);

		// Update axis
		this.svg.selectAll(".myXaxis")
			.transition()
			.duration(100)
			.call(this.xAxis);
		this.svg.selectAll(".myYaxis")
			.transition()
			.duration(100)
			.call(this.yAxis);

		this.model.initial = false
	},

	update: function (data) {

    	if (this.model.initial === true){
    		this.initial_update(data)
		}

    	// Create an update selection: bind to the new data
		var x = this.x
		var y = this.y
		var r = this.r
		var color = this.color

		// Clear dots
		this.svg
			.selectAll("circle")
			.remove()

		// Dot objects
		this.dots
			.selectAll("dot")
			.data(data)
			.enter()
			.append("circle")
			  .attr("cx", function (d) { return x(d.x); } )
			  .attr("cy", function (d) { return y(d.y); } )
			  .attr("r", r)
			  .style("fill", d => color(d.c))

		},

});

module.exports = {
    ScatterModel: ScatterModel,
    ScatterView: ScatterView,
};




