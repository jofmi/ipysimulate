import traitlets
import ipywidgets


@ipywidgets.register
class Linechart(ipywidgets.DOMWidget):
    """ Linechart widget. """
    
    _view_name = traitlets.Unicode('LinechartView').tag(sync=True)
    _view_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _view_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)
    _model_name = traitlets.Unicode('LinechartModel').tag(sync=True)
    _model_module = traitlets.Unicode('ipysimulate').tag(sync=True)
    _model_module_version = traitlets.Unicode('^0.1.0').tag(sync=True)

    _control_id = traitlets.Unicode().tag(sync=True)
    
    def __init__(self, control, **kwargs):
        self._control = control
        self._control_id = control.comm.comm_id
        super().__init__(**kwargs)
