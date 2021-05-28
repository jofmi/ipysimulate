
class Range:
    """ A range of parameter values
    that can be passed to :class:`Control`.

    Arguments:
        vmin (float, optional):
            Minimum value for this parameter (default 0).
        vmax (float, optional):
            Maximum value for this parameter (default 1).
        vdef (float, optional):
            Default value. Default value. If none is passed, `vmin` is used.
    """

    def __init__(self, vmin=0, vmax=1, vdef=None):
        self.vmin = vmin
        self.vmax = vmax
        self.vdef = vdef if vdef else vmin
        self.ints = False

    def __repr__(self):
        return f"Parameter range from {self.vmin} to {self.vmax}"


class IntRange(Range):
    """ A range of integer parameter values
    that can be passed to :class:`Control`.
    Similar to :class:`Range`,
    but sampled values will be rounded and converted to integer.

    Arguments:
        vmin (int, optional):
            Minimum value for this parameter (default 0).
        vmax (int, optional):
            Maximum value for this parameter (default 1).
        vdef (int, optional):
            Default value. If none is passed, `vmin` is used.
    """

    def __init__(self, vmin=0, vmax=1, vdef=None):
        self.vmin = int(round(vmin))
        self.vmax = int(round(vmax))
        self.vdef = int(round(vdef)) if vdef else vmin
        self.ints = True

    def __repr__(self):
        return f"Integer parameter range from {self.vmin} to {self.vmax}"


class Values:
    """ A pre-defined set of discrete parameter values
    that can be passed to :class:`Control`.

    Arguments:
        *args:
            Possible values for this parameter.
        vdef:
            Default value. If none is passed, the first passed value is used.
    """

    def __init__(self, *args, vdef=None):
        self.values = args
        self.vdef = vdef if vdef else args[0]

    def __len__(self):
        return len(self.values)

    def __repr__(self):
        return f"Set of {len(self.values)} parameter values"