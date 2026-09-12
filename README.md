# topological-scheduler

Run asynchronous tasks after their dependencies, with a concurrency limit.
Worker failures are returned per task instead of rejecting the whole schedule.

```bash
npm install topological-scheduler
```

## Quick start

```ts
import schedule, { type DependencyGraph, type WorkerFunction } from 'topological-scheduler';

const graph: DependencyGraph<string> = {
  nodes: { fetch: 'fetch data', index: 'build index', report: 'write report' },
  dependencies: {
    fetch: [],
    index: ['fetch'],
    report: ['index'],
  },
};

const worker: WorkerFunction<string, string> = (task, id, done) => {
  console.log(id, task);
  done(null, `completed: ${task}`);
};

const results = await schedule(graph, worker, { concurrency: 2 });
```

Each result contains `id`, `item`, and either `result` or `error`. Set
`failDependents: true` to return dependent tasks with `skipped: true` after a
dependency fails. The default concurrency is `1`.

The same function accepts a final callback:

```ts
schedule(graph, worker, { concurrency: 2 }, (error, results) => {
  if (error) throw error;
  console.log(results);
});
```

## Cycles

The scheduler expects an acyclic graph and does not perform cycle validation.
Use `topological-sort-group` before scheduling when input may contain cycles:

```ts
import Graph from 'topological-sort-group';

const checked = Graph.from(graph);
const { cycles } = checked.sort();
if (cycles.length) throw new Error(`Circular dependencies: ${JSON.stringify(cycles)}`);

await schedule(checked.toGraph(), worker, { concurrency: 2 });
```

## Documentation

[API documentation](https://kmalakoff.github.io/topological-scheduler/)
