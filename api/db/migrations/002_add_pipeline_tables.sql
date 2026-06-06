-- Migration 002: Add event-driven pipeline infrastructure tables

-- Pipeline jobs: top-level async job tracking
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  listingId INTEGER,
  packageType TEXT DEFAULT 'package_2',
  status TEXT DEFAULT 'pending',
  currentStage TEXT,
  stagesJSON TEXT DEFAULT '{}',
  tokenUsage INTEGER DEFAULT 0,
  errorLog TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id) ON DELETE CASCADE,
  FOREIGN KEY (listingId) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_prospectId ON pipeline_jobs(prospectId);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_status ON pipeline_jobs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_createdAt ON pipeline_jobs(createdAt);

-- Pipeline job stages: granular stage output persistence for resumability
CREATE TABLE IF NOT EXISTS pipeline_job_stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jobId INTEGER NOT NULL,
  stageName TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  outputJSON TEXT DEFAULT '{}',
  errorMessage TEXT,
  startedAt DATETIME,
  completedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (jobId) REFERENCES pipeline_jobs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pipeline_job_stages_jobId ON pipeline_job_stages(jobId);
CREATE INDEX IF NOT EXISTS idx_pipeline_job_stages_status ON pipeline_job_stages(status);

-- Usage events: token and cost tracking per prospect/job/service
CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  jobId INTEGER,
  service TEXT NOT NULL,
  promptTokens INTEGER DEFAULT 0,
  completionTokens INTEGER DEFAULT 0,
  totalTokens INTEGER DEFAULT 0,
  costCents INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id) ON DELETE CASCADE,
  FOREIGN KEY (jobId) REFERENCES pipeline_jobs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_events_prospectId ON usage_events(prospectId);
CREATE INDEX IF NOT EXISTS idx_usage_events_jobId ON usage_events(jobId);
CREATE INDEX IF NOT EXISTS idx_usage_events_service ON usage_events(service);
CREATE INDEX IF NOT EXISTS idx_usage_events_createdAt ON usage_events(createdAt);

-- Job queue: SQLite-backed queue for async workers (primary adapter)
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queue TEXT NOT NULL,
  name TEXT NOT NULL,
  dataJSON TEXT NOT NULL DEFAULT '{}',
  optsJSON TEXT DEFAULT '{}',
  progress INTEGER DEFAULT 0,
  delay INTEGER DEFAULT 0,
  timestamp INTEGER NOT NULL,
  attempts INTEGER DEFAULT 0,
  maxAttempts INTEGER DEFAULT 3,
  processedOn INTEGER,
  finishedOn INTEGER,
  returnValueJSON TEXT,
  failedReason TEXT,
  stacktraceJSON TEXT DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_queue_status ON jobs(queue, status);
CREATE INDEX IF NOT EXISTS idx_jobs_timestamp ON jobs(timestamp);
CREATE INDEX IF NOT EXISTS idx_jobs_delay ON jobs(delay);
