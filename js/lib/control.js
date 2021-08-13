// Interactive control panel for simulations
// See control.py for the kernel counterpart to this file.

var widgets = require('@jupyter-widgets/base');
var semver_range = require('../package.json').version;
require('./control.css');
require('lodash');


var ControlModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ControlModel',
        _view_name : 'ControlView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : semver_range,
        _view_module_version : semver_range,
    }),

    initialize: function (attributes, options) {
        widgets.DOMWidgetModel.prototype
            .initialize.call(this, attributes, options);
        this.charts = [];
    },

});


var ControlView = widgets.DOMWidgetView.extend({
        
    // React to control button events -------------------------------------- //
    click_play: function(inputEvent) {
        // Continue simulation if model is idle, else pause.
        if (this.model.get('is_running') === false) {
            this.send({event: 'continue_simulation'});
        } else {  
            this.model.set({'is_running':false});
            this.touch(); // Sync JS & Python
        }
    },
    
    click_step: function(inputEvent) {
        // Run single step if model is idle.
        if (this.model.get('is_running') == false) {
            this.send({event: 'increment_simulation'});
        }
    },
    
    click_redo: function(inputEvent) {
        // Set to reset after end of step, if model is runnning.
        // Reset through function call if model is idle.
        if (this.model.get('is_running') == true) {
            this.model.set({'do_reset':true, 'is_running':false});
            this.touch(); // Sync JS & Python 
        } else {
            this.send({event: 'reset_simulation'});
        }
    },

    click_info: function(inputEvent) {
        // TODO Do something useful with this button
        // alert(this.model.get(''))
    },

    param_label_change: function(name, value, label) {
        // For updates after release
        label.textContent = value
        this.param_change(name, value)
    },

    param_change: function(name, value) {
        // For updates after release
        this.send({
            event: 'update_parameter',
            k: name,
            v: value,
        })
    },

    // Render control interface -------------------------------------------- //
    render: function() {

        // Handle traitlet changes
        this.model.on('change:is_running', this.is_running_changed, this);
        this.model.on('change:_variables', this.variables_changed, this);
        
        // Control interface ----------------------------------------------- //
        this.control = document.createElement("div");
        this.control.className = 'ipysimulate-control'
        this.el.appendChild(this.control);

        // Button row
        this.control_line = document.createElement("div");
        this.control_line.className = "button-row"
        this.control.appendChild(this.control_line);
        
        // Play/Pause button
        this.play_button = document.createElement("BUTTON");
        this.play_button.className = "ctr_btn fa fa-play";
        this.play_button.setAttribute('title', 'Run simulation');
        this.control_line.appendChild(this.play_button);
        this.play_button.addEventListener("click",
            (inputEvent => this.click_play()), false);
        
        // Step button
        this.step_button = document.createElement("BUTTON");
        this.step_button.className = "ctr_btn fa fa-step-forward";
        this.step_button.setAttribute('title', 'Run single step')
        this.control_line.appendChild(this.step_button);
        this.step_button.addEventListener("click",
            (inputEvent => this.click_step()), false);

        // Restart button
        this.redo_button = document.createElement("BUTTON");
        this.redo_button.className = "ctr_btn last fa fa-repeat";
        this.redo_button.setAttribute('title', 'Reset simulation');
        this.control_line.appendChild(this.redo_button);
        this.redo_button.addEventListener("click",
            (inputEvent => this.click_redo()), false);

        // Variable widgets ------------------------------------------------ //
        this.var_displays = {}
        let variables = this.model.get('_variables');
        for (const [key, value] of Object.entries(variables)) {

            // Create new row
            let row = document.createElement("div");
            this.control.appendChild(row);
            row.className = "row";

            // Create labels
            let label = document.createElement("span");
            label.textContent = key + ' ';
            label.className = "plabel";
            row.appendChild(label);

            let label2 = document.createElement("span");
            label2.textContent = value
            row.appendChild(label2);
            this.var_displays[key] = label2
        }

        // Parameter widgets ----------------------------------------------- //

        var i;
        let pwidgets = this.model.get('_pwidgets')
        for (i = 0; i < pwidgets.length; i++) {
            let pwidget = pwidgets[i]
            let row = document.createElement("div");
            row.className = "row"

            let label = document.createElement("span");
            label.className = "plabel"
            label.textContent = pwidget.name + " "

            row.appendChild(label)
            this.control.appendChild(row);

            switch(pwidget.type)
            {
            // Slider widget ----------------------------------------------- //
                case 'slider':

                    let label3 = document.createElement("span");
                    label3.textContent = pwidget.vdef.toString()
                    row.appendChild(label3)

                    let slider = document.createElement("input");
                    slider.className = "slider"
                    slider.setAttribute('id', 'myRange')
                    slider.setAttribute('type', 'range')
                    slider.setAttribute('step', pwidget.step)
                    slider.setAttribute('min', pwidget.vmin.toString())
                    slider.setAttribute('max', pwidget.vmax.toString())
                    slider.setAttribute('value', pwidget.vdef.toString())
                    slider.addEventListener("change",
                            inputEvent => this.param_label_change(
                                pwidget.name, slider.value, label3));
                    slider.addEventListener("input",
                            inputEvent => this.param_label_change(
                                pwidget.name, slider.value, label3));
                    row.appendChild(slider)

                break;

            // Select widget ----------------------------------------------- //
            case 'select':
                let options = pwidget.values;
                let select = document.createElement("select");
                select.setAttribute('class', 'select')

                //Create and append the options
                var j;
                for (j = 0; j < options.length; j++) {
                    let option = document.createElement("option");
                    option.value = options[j];
                    option.text = options[j];
                    select.appendChild(option);
                }
                select.addEventListener("change",
                        inputEvent => this.param_change(pwidget.name, select.value));

                row.appendChild(select);
                break;
            }
        }

        // Setup ----------------------------------------------------------- //
        this.send({event: 'setup_simulation'});
    },

    // React to tratilet changes ------------------------------------------- //
    is_running_changed: function() {
        if (this.model.get('is_running') === true) {
            this.play_button.className = "ctr_btn fa fa-pause";
            this.play_button.setAttribute('title', 'Pause simulation');
        } else {
            this.play_button.className = "ctr_btn fa fa-play";
            this.play_button.setAttribute('title', 'Run simulation');
        }
    },

    variables_changed: function() {
        let variables = this.model.get('_variables');
        for (const [key, value] of Object.entries(variables)) {
			this.var_displays[key].textContent = value
		}
        //this.output2.textContent = this.model.get('t');
    },
    
    reset_changed: function() {
        this.model.data = []
    }

});


module.exports = {
    ControlModel: ControlModel,
    ControlView: ControlView,
};


