"""Shared types."""


class AttributeDictionary(dict):
    """A `dict` with keys available as attributes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__dict__ = self
