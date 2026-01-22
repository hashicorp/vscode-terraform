import { WebTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const exporter = new OTLPTraceExporter({
  url: 'http://127.0.0.1:4318/v1/traces',
  headers: {},
});

const myResource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'terraform-visualizer',
});

const provider = new WebTracerProvider({
  resource: myResource,
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

provider.register();

export const tracer = provider.getTracer('terraform-visualizer');
