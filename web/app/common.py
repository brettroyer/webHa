from .extentions import cache
from flask import current_app as app


def remove_from_cache(key: str) -> None:
    """
    https://stackoverflow.com/questions/60118783/how-can-i-retrieve-all-keys-from-a-flask-cache

    :param key: str
    :return: None
    """
    try:
        cache.cache._cache.pop(key)
        app.logger.info(f"Key: {key} Removed from Cache")

    except AttributeError:
        cache.delete(key)
        app.logger.info(f"Key: {key} Removed from Cache")

    except KeyError:
        app.logger.debug("Cache Not Present")