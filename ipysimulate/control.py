import traitlets
import ipywidgets
import threading
import time
import ipysimulate

# See js/lib/control.js for the frontend counterpart to this file.
semver_range = "~" + ipysimulate.__version__


@ipywidgets.register
class Control(ipywidgets.DOMWidget):
    """ Interactive control widget for a simulation model. """

    # Traitlet declarations ------------------------------------------------- #
    
    _view_name = traitlets.Unicode('ControlView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('ControlModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)

    running = traitlets.Bool(False).tag(sync=True)
    reset = traitlets.Bool(False).tag(sync=True)

    parameters = traitlets.Dict({}).tag(sync=True)
    data_paths = traitlets.List().tag(sync=True)
    t = traitlets.Integer(0).tag(sync=True)

    sim_name = traitlets.Unicode().tag(sync=True)
    sim_info = traitlets.Unicode().tag(sync=True)

    # Initiation - Don't start any threads here ----------------------------- #
    
    def __init__(self, model, parameters=None):
        super().__init__()  # Initiate front-end
        self.on_msg(self._handle_button_msg)  # Handle front-end messages
        self.thread = None  # Placeholder for simulation threads

        # TODO ADD Conversion from param ranges
        self.parameters = parameters if parameters else {}

        self.model = model
        self.model.set_parameters(self.parameters)

        self.sim_name = model.name if hasattr(model, 'name') else 'Simulation'
        self.sim_info = model.info if hasattr(model, 'info') else ''
        
    # Methods to be called from the front-end ------------------------------- #

    def _handle_button_msg(self, _, content, buffers):
        """ Handles messages from the front-end 
        by calling method of same name as msg. """
        getattr(self, content.get('event', ''))()

    def setup_simulation(self):
        """ Call model setup. """
        self.thread = threading.Thread(target=self.run_setup)
        self.thread.start()
        
    def continue_simulation(self):
        """ Start background thread that runs simulation. """
        self.thread = threading.Thread(target=self.run_simulation)
        self.thread.start()
        
    def increment_simulation(self):
        """ Do a single simulation step. """
        self.thread = threading.Thread(target=self.run_single_step)
        self.thread.start()
        
    def reset_simulation(self):
        """ Reset simulation (in thread!) """
        self.thread = threading.Thread(target=self.run_reset)
        self.thread.start()
        
    # Methods to be called only within threads ------------------------------ #

    def sync_data(self, data_paths):
        """ Retrieve new data from the simulation model and send it
        to front-end.

        Arguments:
            data_paths (list of str): A list of paths for each attribute that
                should be retrieved from `self.model`. E.g. ['x', 'sub_obj.x']
                would load `self.model.x` and `self.model.sub_obj.x`.
        """

        new_data = {}
        for data_path in self.data_paths:

            # Move to target object
            obj = self.model
            for attr in data_path.split('.'):
                obj = getattr(obj, attr)

            # TODO Handle NAN

            # Add target object to new data
            new_data[data_path] = obj

        self.send({"what": "new_data", "data": new_data})

    def run_reset(self):
        """ Reset simulation by clearing front-end data,
        calling `model.sim_reset()`, and sending initial data to front-end."""
        self.send({"what": "reset_data"})  # Reset frontend model
        self.model.sim_reset()  # Reset backend model
        self.t = self.model.t
        self.sync_data(self.data_paths)

    def run_setup(self):
        """ Initiate simulation by calling `model.sim_setup()`
        and sending initial data to front-end. """
        self.model.sim_setup()
        self.t = self.model.t
        self.sync_data(self.data_paths)
    
    def run_single_step(self):
        """ Run a single simulation step by calling `model.sim_step()`,
        and sending new data to front-end. """
        self.model.sim_step()
        self.t = self.model.t
        self.sync_data(self.data_paths)
        
    def run_simulation(self):
        """ Start or continue the simulation by repeatedly calling
        :func:`Control.run_single_step` as long as `model.active` is True. """
        self.running = True
        while self.model.active:
            self.run_single_step()
            if not self.running:
                break
        self.running = False
        if self.reset:
            self.reset_simulation()
            self.reset = False
