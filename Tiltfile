# -*- mode: Python -*


# `Disables Tilt’s snapshots feature, hiding it from the UI.
disable_snapshots()

# Enable or Disable Telemetry
docker_compose(["./docker-compose.telemetry.yml"])
services = {'stream-connector': {'environment': {'TELEMETRY': 'true'}}, 'celery-workers': {'environment': {'TELEMETRY': 'true'}}, 'api-server': {'environment': {'TELEMETRY': 'true'}}}
docker_compose(['docker-compose.yml', encode_yaml({'services': services})])
docker_compose(["./docker-compose.ui.yml"])


# point Tilt at the existing docker-compose configuration.
# docker_compose(["./docker-compose.yml"])