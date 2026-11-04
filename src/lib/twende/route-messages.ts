import type { RouteCalculationError } from "./route.functions";

/** Friendly, honest copy for each routing-provider failure mode. */
export function routeErrorText(error: RouteCalculationError): string {
  if (error === "rate-limited") {
    return "The routing service is busy right now — try again in a moment.";
  }
  if (error === "provider") {
    return "The routing service isn't responding.";
  }
  if (error === "unreachable") {
    return "No driving route was found between these points — try moving one of them onto a road.";
  }
  if (error === "invalid") {
    return "One of the selected points isn't on a drivable road — adjust it on the map.";
  }
  return "The route couldn't reach the routing service — check your connection.";
}
