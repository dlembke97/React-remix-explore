import type { ServerBuild } from "react-router";
import { StartServer } from "@react-router/dev/start";
import { renderToString } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: ServerBuild
) {
  const body = renderToString(
    <StartServer
      request={request}
      statusCode={responseStatusCode}
      routerContext={routerContext}
    />
  );

  responseHeaders.set("Content-Type", "text/html");
  return new Response(`<!DOCTYPE html>${body}`, {
    status: responseStatusCode,
    headers: responseHeaders,
  });
}
