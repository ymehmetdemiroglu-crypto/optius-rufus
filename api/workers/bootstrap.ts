import { queueWorker } from "../pipeline/worker.js";
import { webhookWorker } from "../infra/workers/webhookWorker.js";

export function startWorkers() {
  queueWorker.start();
  webhookWorker.start();
}
