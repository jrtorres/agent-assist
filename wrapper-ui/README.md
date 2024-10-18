# Wrapper UI with React & Vite

## Overview

This folder contains the demo UI used to intiate a sample call. A diarized dual channel mulaw audio file (agent - right, caller - left) is uploaded to the watson-stt-stream-connector to start the demo.

The wrapper UI initializes a random agent_id (uuid) and opens an iframe in the middle of the page to agent-dashboard-ui and appends the agent_id in a query param.

When the watson-stt-stream-connector starts processing the sample audio, it will open two STT connections to process each channel of the call, simulating an on-going production system and sends transcription events. The transcription events (created when watson STT emits the final:true flag) for each agent/caller is submitted as a new Celery task, with the call metadata attached.


## Features

> TODO

<br>
<br>

## Requirements

- Node v18.17.0 or higher.

- Watsonx Assistant instance.

- (Optional) Podman/Docker for deployment. Building the image locally and then sending to a **PRIVATE** image repository is recommended for deployment as building from source code can cause issues with Vite environment variables not importing correctly.

- For the dashboard to be fully operational, first deploy the following microservices in the parent folder of this repo before running `wrapper-ui`:

1. **RabbitMQ**
2. One of the two **Next Best Action Microservice**s, `-assistant` or `-llm` depending on your use case.
3. **Sentiment**
4. **Summarization**
5. **Watson STT Stream Connector**

<br>
<br>

## Configuration

### Setup

1. In a terminal, naviagte to `wrapper-ui`.
2. `npm i`.
3. `cd wrapper-ui/server`.
4. `npm i`.
5. `cd ..`.

<br>

### Environment Variables

<br>

| Variable Name                | Details                                            | Default Value |
| ---------------------------- | -------------------------------------------------- | ------------- |
| `VITE_LOCAL_MICROSERVICES` | Boolean switch for local or deployed microservice connection | true        |
| `VITE_MQTT_CALLER_ID`        | MQTT caller ID (i.e. current user).                | N/A           |
| `VITE_LOCAL_MICROSERVICES`   | MQTT connection mode (SSL or not).                 | N/A           |
| `VITE_WA_INTEGRATION_ID`     | Watson Assistant integration ID.                   | N/A           |
| `VITE_WA_REGION`             | Watson Assistant region.                           | N/A           |
| `COS_ENDPOINT`               | COS endpoint.                                      | N/A           |
| `COS_API_KEY_ID`             | COS apikey.                                        |
| `COS_SERVICE_INSTANCE_ID`    | COS service instance ID.                           | N/A           |
| `COS_SIGNATURE_VERSION`      | COS signature version.                             | N/A           |
| `CLIENT_ID`                  | AppID client ID                                    | N/A           |
| `OAUTH_SERVER_URL`           | AppID Oauth server URL                             | N/A           |
| `PROFILES_URL`               | AppID profiles URL                                 | N/A           |
| `APP_ID_SECRET`              | AppID Secret                                       | N/A           |
| `TENANT_ID`                  | AppID tenant id                                    | N/A           |
| `REDIRECT_URI`               | AppID redirect URL                                 | N/A           |
| `SESSION_SECRET`             | Express session secret - can be anything           | N/A           |

<br>
<br>

## Local Development

**Recommended**

1. `npm run lint`
2. Fix any linting errors.

<br>

### Local Vite dev server - hotloading

1. Make sure you are in the `wrapper-ui` directory
2. If running microservices dependencies locally, uncomment line 4 in `wrapper-ui/.env` file.
3. If running deployed microservices dependencies, make sure line 4 in `wrapper-ui/.env` file is commented out.
4. `npm run dev`

<br>

### Local Express server

1. If running microservices dependencies locally, uncomment line 4 in `wrapper-ui/.env` file.
2. If running deployed microservices dependencies, make sure line 4 in `wrapper-ui/.env` file is commented out.
3. Make sure you are in the `server` directory
4. `cd server`
5. `npm start`

<br>
<br>

## Local Containerization for Testing

**Recommended**

1. `npm run lint`
2. Fix any linting errors.
3. `npm run prettier`

<br>

### Local containization w/Express sever without AppID

1. If running microservices dependencies locally, uncomment line 4 in `wrapper-ui/.env` file.
2. If running deployed microservices dependencies, make sure line 4 in `wrapper-ui/.env` file is commented out.
3. Make sure line 36 in Dockerfile is commented out.
4. Make sure line 39 in Dockerfile is not commented out.
5. `cd` to the `wrapper-ui` directory.
6. `podman build -t wrapper-ui .`
7. `podman run -d -p 3003:3003 wrapper-ui`
8. Open `http://localhost:3003/protected` in a browser.

<br>
<br>

## Build Image for Deployment to **PRIVATE** Image Repository

**Recommended**

1. `npm run lint`
2. Fix any linting errors.
3. `npm run prettier`

<br>
