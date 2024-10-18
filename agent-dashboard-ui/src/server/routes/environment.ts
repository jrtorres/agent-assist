

import {Router} from "express";
import {isLeft} from "fp-ts/Either";
import {PathReporter} from "io-ts/PathReporter";
import {WidgetConfig, WidgetConfigT} from "../../@types/widget";

const WIDGET_CONFIG = JSON.parse(process.env.WIDGET_CONFIG ?
    process.env.WIDGET_CONFIG :
    '{"widgets": [{"type": "ExtractedEntities", "minColumns": 1}]}');

const SOCKET_PORT = process.env.SOCKET_PORT ? parseInt(process.env.SOCKET_PORT) : 8000;

const envRouter = Router();

const decoded = WidgetConfig.decode(WIDGET_CONFIG);

if (isLeft(decoded)) {
    throw Error(
        `Invalid widget config: ${PathReporter.report(decoded).join("\n")}`
    );
}

const decodedWidgetConfig: WidgetConfigT = decoded.right; // now safely the correct type


export default function setupEnvironment(router: Router) {
    envRouter.get("/", (req, res) => {
        res.status(200).json({
            widgetConfig: decodedWidgetConfig,
            socketPort: SOCKET_PORT,
            waIntegrationId: process.env.WA_INTEGRATION_ID,
            waRegion: process.env.WA_REGION,
            waServiceInstanceId: process.env.WA_SERVICE_INSTANCE_ID
        });
    });

    router.use('/environment', envRouter);
    return router;
}
