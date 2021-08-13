var widgets = require('@jupyter-widgets/base');
var semver_range = require('../package.json').version;
var d3 = require('d3');
require('./charts.css');
require('lodash');


var CustomWidgetModel = widgets.DOMWidgetModel.extend({

    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'CustomWidgetModel',
        _view_name : 'CustomWidgetView',
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

		let source = this.get('source');
        this.setup_func = Function('view', 'd3', source.setup)  // render
        this.update_func = Function('view', 'd3', 'data', source.update)
        this.reset_func = Function('view', 'd3', source.reset)
    },

	_on_msg: function (command, buffers) {
        if (command.what) {
            switch (command.what) {
                case 'new_data':
                    this.update_views(command.data);
                    break;
                case 'reset_data':
                    this.reset_views(command.data);
                    break;
            }
        }
    },

	update_views: function(data) {
		for (var key in this.views) {  // Send data to all views
			this.views[key].then(this._update_view.bind(null, data))
		}
	},
    _update_view: function(data, view) {view.update(data);},

	reset_views: function() {
    	for (var key in this.views) {
			this.views[key].then(this._reset_view.bind(null))
		}
    },
    _reset_view: function(view) {view.reset();},


});


var CustomWidgetView = widgets.DOMWidgetView.extend({
    render: function() {this.model.setup_func(this, d3)},
    update: function(data) {this.model.update_func(this, d3, data)},
    reset: function() {this.model.reset_func(this, d3)},
});


module.exports = {
    CustomWidgetModel: CustomWidgetModel,
    CustomWidgetView: CustomWidgetView,
};




