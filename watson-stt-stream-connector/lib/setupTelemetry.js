
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor, BatchSpanProcessor } = require('@opentelemetry/tracing');
const { CollectorTraceExporter } = require('@opentelemetry/exporter-collector-proto');
const { grpc } = require('@opentelemetry/exporter-trace-otlp-grpc');
const { credentials } = require('@grpc/grpc-js');


const LOG_LEVEL = process.env.LOG_LEVEL;
const OTEL_EXPORTER_OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4317';
const logger = require('pino')({ level: LOG_LEVEL, name: 'setupTelemetry' });

let providerInstance; // Store the provider instance to be re-used

function setupTelemetry() {
  if (!providerInstance) {
    const provider = new NodeTracerProvider();
    provider.register();
    let spanProcessor;

    if (process.env.TELEMETRY === 'true') {
      const exporter = new CollectorTraceExporter({
        credentials: credentials.createInsecure(),
        url: OTEL_EXPORTER_OTLP_ENDPOINT,//'jaeger:4317',
      });

      spanProcessor = new BatchSpanProcessor(exporter);
      logger.debug('Enabling jaeger tracing');
    } else {
      spanProcessor = new SimpleSpanProcessor(console);
      logger.debug('logging tracing to console');
    }
    provider.addSpanProcessor(spanProcessor);
    providerInstance = provider;
    provider.register()
  }
  return providerInstance;
}

module.exports = setupTelemetry;