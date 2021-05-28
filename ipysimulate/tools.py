def make_list(element, keep_none=False):
    """ Turns element into a list of itself
    if it is not of type list or tuple. """

    if element is None and not keep_none:
        element = []  # Convert none to empty list
    if not isinstance(element, (list, tuple, set)):
        element = [element]
    elif isinstance(element, (tuple, set)):
        element = list(element)

    return element