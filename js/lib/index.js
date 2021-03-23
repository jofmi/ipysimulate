// Export widget models and views, and the npm package version number.
var control = require('./control.js');
var charts = require('./charts.js');

module.exports = {
    ControlModel: control.ControlModel,
    ControlView: control.ControlView,
    LinechartModel: charts.LinechartModel,
    LinechartView: charts.LinechartView
};

module.exports['version'] = require('../package.json').version;