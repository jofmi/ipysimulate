import traitlets
import ipywidgets
import ipysimulate

semver_range = "~" + ipysimulate.__version__

@ipywidgets.register
class Linechart(ipywidgets.DOMWidget):
    """ Linechart widget. """
    
    _view_name = traitlets.Unicode('LinechartView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _model_name = traitlets.Unicode('LinechartModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode(semver_range).tag(sync=True)
    _control_id = traitlets.Unicode().tag(sync=True)
    config = traitlets.Dict().tag(sync=True)
    
    def __init__(self, control, y, x='t', **kwargs):
        self._control = control
        self._control_id = control.comm.comm_id
        y = y if isinstance(y, (tuple, list)) else [y]
        self.config = {'x': x, 'y': y}
        super().__init__(**kwargs)
