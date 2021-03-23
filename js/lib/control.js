var widgets = require('@jupyter-widgets/base');
//var linechart = require('./charts');
require('lodash');
require('./control.css');


/*var LinkModel = widgets.DOMWidgetModel.extend({
    serializers

}
export class DirectionalLinkModel extends CoreWidgetModel {
  static serializers = {
    ...CoreWidgetModel.serializers,
    target: { deserialize: unpack_models },
    source: { deserialize: unpack_models }
  };*/



// See control.py for the kernel counterpart to this file.


var ControlModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ControlModel',
        _view_name : 'ControlView',
        _model_module : 'ipysimulate',
        _view_module : 'ipysimulate',
        _model_module_version : '0.1.0',
        _view_module_version : '0.1.0',
    }),

    initialize: function (attributes, options) {
        widgets.DOMWidgetModel.prototype.initialize.call(this, attributes, options);
    	this.data = [];
        this.charts = [];
    },
});


var ControlView = widgets.DOMWidgetView.extend({
        
    // React to control button events -------------------------------------- //
    click_play: function(inputEvent) {
        // Continue simulation if model is idle, else pause.
        if (this.model.get('running') === false) {
            this.send({event: 'continue_simulation'});
        } else {  
            this.model.set({'running':false}); 
            this.touch(); // Sync JS & Python              
        }
    },
    
    click_step: function(inputEvent) {
        // Run single step if model is idle.
        if (this.model.get('running') == false) {  
            this.send({event: 'increment_simulation'});
        }
    },
    
    click_redo: function(inputEvent) {
        // Set to reset after end of step, if model is runnning.
        // Reset through function call if model is idle.
        if (this.model.get('running') == true) {
            this.model.set({'reset':true, 'running':false});
            this.touch(); // Sync JS & Python 
        } else {
            this.send({event: 'reset_simulation'});
        }
    },

    click_info: function(inputEvent) {
        alert(this.model.get('sim_info'))
    },

    // Render control interface -------------------------------------------- //
    render: function() {

        // Handle traitlet changes
        this.model.on('change:running', this.running_changed, this);
        this.model.on('change:t', this.t_changed, this);
        this.model.on('change:new_data', this.data_changed, this);
        this.model.on('change:reset_counter', this.reset_changed, this);
        
        // Control interface
        this.control = document.createElement("div");
        this.control.className = 'ipysimulate-control'
        this.el.appendChild(this.control);

        // Heading
        this.heading = document.createElement("div");
        this.heading.className = "heading"
        this.heading.textContent = this.model.get('sim_name')
        this.control.appendChild(this.heading);

        // Control buttons ------------------------------------------------- //
        this.control_line = document.createElement("div");
        this.control_line.className = "row"
        this.control.appendChild(this.control_line);
        
        // Play/Pause button
        this.play_button = document.createElement("BUTTON");
        this.play_button.className = "ctr_btn fa fa-play";
        this.control_line.appendChild(this.play_button);
        
        // Step button
        this.step_button = document.createElement("BUTTON");
        this.step_button.className = "ctr_btn fa fa-step-forward";
        this.control_line.appendChild(this.step_button);
        
        // Restart button
        this.redo_button = document.createElement("BUTTON");
        this.redo_button.className = "ctr_btn fa fa-repeat fa-flip-horizontal";
        this.control_line.appendChild(this.redo_button);

        // Info button
        this.info_button = document.createElement("BUTTON");
        this.info_button.className = "ctr_btn last fa fa-info";
        this.control_line.appendChild(this.info_button);

        // Listening to events in JS Front-End
        // TODO inputEvent redundant
        this.play_button.addEventListener("click",
            (inputEvent => this.click_play()), false);
        this.redo_button.addEventListener("click",
            (inputEvent => this.click_redo()), false);
        this.step_button.addEventListener("click",
            (inputEvent => this.click_step()), false);
        this.info_button.addEventListener("click",
            (inputEvent => this.click_info()), false);

        // Text ------------------------------------------------------------ //

        this.control_line2 = document.createElement("div");
        this.control_line2.className = "row"
        this.control.appendChild(this.control_line2);

        // Create output area
        this.output1 = document.createElement("span");
        this.output2 = document.createElement("span");
        this.control_line2.appendChild(this.output1);
        this.control_line2.appendChild(this.output2);

        // Initializing values
        this.output1.textContent = 'Steps: ';
        this.output2.textContent = this.model.get('t');

        // Sliders --------------------------------------------------------- //

        // <input type="range" min="1" max="100" value="50" class="slider" id="myRange">

        this.control_line3 = document.createElement("div");
        this.control_line3.className = "row"
        this.control.appendChild(this.control_line3);

        this.slider = document.createElement("input");
        this.slider.className = "slider"
        this.slider.setAttribute('id', 'myRange')
        this.slider.setAttribute('type', 'range')
        this.slider.setAttribute('min', '1')
        this.slider.setAttribute('max', '100')
        this.slider.setAttribute('value', '50')
        this.control_line3.appendChild(this.slider);

        // Setup ----------------------------------------------------------- //
        this.send({event: 'setup_simulation'});
    },

    // React to tratilet changes ------------------------------------------- //
    running_changed: function() {
        if (this.model.get('running') === true) {
            this.play_button.className = "ctr_btn fa fa-pause";
        } else {
            this.play_button.className = "ctr_btn fa fa-play";
        }
    },

    t_changed: function() {
        this.output2.textContent = this.model.get('t');
    },
    
    data_changed: function() {
        
        // Add new data to data
        let new_data = this.model.get('new_data')
        for (const [key, value] of Object.entries(new_data)) {
            this.model.data.push(...value) //[key] TODO CREATE DATA CATEGORIES
        }

        // Unlock back-end for next data update
        this.send({event: 'sync_finished'});

        console.log("Data changed")
        console.log(this.model)
		console.log(this.model.charts)
        console.log(this.model.data)


        // Update visualization TODO CREATE LOOP & GENERAL UPDATE FUNCTION
        var i;
        for (i = 0; i < this.model.charts.length; i++) {
            console.log("Accessing chart")
            console.log(this.model.charts[i])
            console.log(this.model.charts[i].update)
            this.model.charts[i].update(this.model.data)
        }
    },
    
    reset_changed: function() {
        this.model.data = []
    }

});


module.exports = {
    ControlModel: ControlModel,
    ControlView: ControlView,
};


