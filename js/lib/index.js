// Export widget models and views, and the npm package version number.
var control = require('./control.js');
var line = require('./line.js');
var scatter = require('./scatter.js');
var custom_widget = require('./custom_widget.js');

module.exports = {
    ControlModel: control.ControlModel,
    ControlView: control.ControlView,
    CustomWidgetModel: custom_widget.CustomWidgetModel,
    CustomWidgetView: custom_widget.CustomWidgetView,
    LinechartModel: line.LinechartModel,
    LinechartView: line.LinechartView,
    ScatterModel: scatter.ScatterModel,
    ScatterView: scatter.ScatterView
};

module.exports['version'] = require('../package.json').version;