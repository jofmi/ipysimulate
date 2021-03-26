import traitlets
import ipywidgets
import threading
import time
import ipysimulate

# See js/lib/control.js for the frontend counterpart to this file.
semver_range = "~" + ipysimulate.__version__


@ipywidgets.register
class Control(ipywidgets.DOMWidget):
    """ Interactive control widget for a simulation model.

    Arguments:
        model (Simulation):
            Simulation instance. See :class:`Simulation` for an example.
        parameters (dict):
            Parameter ranges.
        name (str, optional):
            Name of the simulation.
            If none is passed the model's class name is used.

    Returns:
        widget: An IPython widget object.
    """

    # Traitlet declarations ------------------------------------------------- #
    
    _view_name = traitlets.Unicode('ControlView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('ControlModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)

    is_running = traitlets.Bool(False).tag(sync=True)
    do_reset = traitlets.Bool(False).tag(sync=True)

    parameters = traitlets.Dict({}).tag(sync=True)
    data_paths = traitlets.List().tag(sync=True)
    t = traitlets.Integer(0).tag(sync=True)

    name = traitlets.Unicode().tag(sync=True)

    # Initiation - Don't start any threads here ----------------------------- #
    
    def __init__(self, model, parameters=None, name=None):
        super().__init__()  # Initiate front-end
        self.on_msg(self._handle_button_msg)  # Handle front-end messages
        self.thread = None  # Placeholder for simulation threads

        # TODO ADD Conversion from param ranges
        self.parameters = parameters if parameters else {}

        self.model = model
        self.model.set_parameters(self.parameters)

        self.name = name if name else type(model).__name__
        
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
        self.thread = threading.Thread(target=self.run_step)
        self.thread.start()
        
    def reset_simulation(self):
        """ Reset simulation (in thread!) """
        self.thread = threading.Thread(target=self.reset)
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

    def reset(self):
        """ Reset simulation by clearing front-end data,
        calling `model.sim_reset()`, and sending initial data to front-end."""
        self.send({"what": "reset_data"})  # Reset frontend model
        self.model.reset()  # Reset backend model
        self.run_setup()  # Setup backend model again

    def run_setup(self):
        """ Initiate simulation by calling `model.sim_setup()`
        and sending initial data to front-end. """
        self.model.run_setup()
        self.t = self.model.t
        self.sync_data(self.data_paths)
    
    def run_step(self):
        """ Run a single simulation step by calling `model.sim_step()`,
        and sending new data to front-end. """
        self.model.run_step()
        self.t = self.model.t
        self.sync_data(self.data_paths)
        
    def run_simulation(self):
        """ Start or continue the simulation by repeatedly calling
        :func:`Control.run_single_step` as long as `model.active` is True. """
        self.is_running = True
        while self.model.is_running:
            self.run_step()
            if not self.is_running:
                break
        self.is_running = False
        if self.do_reset:
            self.reset_simulation()
            self.do_reset = False
