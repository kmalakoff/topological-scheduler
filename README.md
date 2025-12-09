## topological-scheduler

Execute async tasks in dependency order with concurrency control.

# Basic Usage

```typescript
import schedule, { type DependencyGraph } from 'topological-scheduler';

const graph: DependencyGraph<string> = {
  nodes: { a: 'taskA', b: 'taskB', c: 'taskC', d: 'taskD' },
  dependencies: {
    a: [],           // a has no dependencies
    b: ['a'],        // b depends on a
    c: ['a'],        // c depends on a
    d: ['b', 'c']    // d depends on b and c
  }
};

// Callback style
schedule(graph, (item, id, cb) => {
  console.log('Processing:', id, item);
  cb(null, 'result-' + id);
}, { concurrency: 2 }, (err, results) => {
  console.log('Done!', results);
});

// Promise style
const results = await schedule(graph, (item, id, cb) => {
  console.log('Processing:', id, item);
  cb(null, 'result-' + id);
}, { concurrency: 2 });
```

# Options

```typescript
interface SchedulerOptions {
  concurrency?: number;      // Max concurrent tasks (default: 1)
  failDependents?: boolean;  // Skip tasks whose dependencies failed
}
```

# Result Structure

```typescript
interface SchedulerResult<T, R> {
  id: string;        // Node ID
  item: T;           // The item value
  result?: R;        // Worker result (on success)
  error?: Error;     // Worker error (on failure)
  skipped?: boolean; // True if skipped due to failDependents
}
```

# With topological-sort-group

Use `topological-sort-group` for cycle detection before scheduling:

```typescript
import Graph from 'topological-sort-group';
import schedule from 'topological-scheduler';

// Build and validate graph
const graph = Graph.from({
  nodes: { a: 'A', b: 'B', c: 'C' },
  dependencies: { a: [], b: ['a'], c: ['b'] }
});

// Check for cycles first
const { cycles } = graph.sort();
if (cycles.length) {
  throw new Error('Circular dependencies detected: ' + JSON.stringify(cycles));
}

// Schedule work
const results = await schedule(
  graph.toGraph(),
  (item, id, cb) => {
    // Your async work here
    cb(null, 'processed-' + id);
  },
  { concurrency: 4 }
);
```

# Fail Dependents Mode

Skip tasks whose dependencies have failed:

```typescript
const results = await schedule(graph, worker, {
  concurrency: 2,
  failDependents: true  // Skip dependents of failed tasks
});

// Check for skipped tasks
for (const result of results) {
  if (result.skipped) {
    console.log(result.id, 'was skipped due to failed dependency');
  }
}
```

### Documentation

[API Docs](https://kmalakoff.github.io/topological-scheduler/)
