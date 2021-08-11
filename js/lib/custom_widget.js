var widgets = require('@jupyter-widgets/base');
var semver_range = require('../package.json').version;
var d3 = require('d3');
require('./charts.css');
require('lodash');


var CustomWidgetModel = widgets.DOMWidgetModel.extend({

    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'PlotModel',
        _view_name : 'PlotView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : semver_range,
        _view_module_version : semver_range,
    }),

	initialize: function (attributes, options) {
        widgets.DOMWidgetModel.prototype
			.initialize.call(this, attributes, options);
		this.on('msg:custom', this._on_msg.bind(this));
		this.config = this.get('config');
		this.source = this.get('source');
		this.initial = true  // Trigger initial_update in view

        this.reset_func = Function('view', 'd3', this.source.reset)
        this.render_func = Function('view', 'd3', this.source.render)
        this.update_func = Function('view', 'd3', 'data', this.source.update)
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
    	for (var key in this.views) {
			this.views[key].then(this._reset_view.bind(null))
		}
    	this.update(data);
    },

    _reset_view: function(view) {view.reset();},
	_update_view: function(data, view) {view.update(data);},

});


var CustomWidgetView = widgets.DOMWidgetView.extend({
    reset: function() {this.model.reset_func(this, d3)},
    render: function() {this.model.render_func(this, d3)},
    update: function(data) {this.model.update_func(this, d3, data)},
});


module.exports = {
    CustomWidgetModel: CustomWidgetModel,
    CustomWidgetView: CustomWidgetView,
};




