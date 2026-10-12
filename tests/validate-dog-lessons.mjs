import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/dog-lessons.js', import.meta.url), 'utf8')
  .replace('const dogLessons =', 'globalThis.dogLessons =');
const context = {};
vm.runInNewContext(source, context);
const lessons = context.dogLessons;

assert.equal(lessons.length, 8, 'Release A must contain eight Dog micro-lessons');
assert.equal(new Set(lessons.map(({ id }) => id)).size, lessons.length, 'Lesson IDs must be unique');

let predictionCount = 0;
for (const lesson of lessons) {
  assert.ok(lesson.files['App.java'], `${lesson.id} must show App.java`);
  assert.ok(lesson.steps.length > 1, `${lesson.id} needs a meaningful trace`);

  let previousConsoleLength = 0;
  for (const [index, step] of lesson.steps.entries()) {
    const file = lesson.files[step.file];
    assert.ok(file, `${lesson.id} step ${index + 1} refers to an unknown file`);
    assert.ok(step.line >= 1 && step.line <= file.length, `${lesson.id} step ${index + 1} has an invalid line`);
    assert.ok(Array.isArray(step.stack), `${lesson.id} step ${index + 1} needs an explicit call stack`);
    assert.ok(Array.isArray(step.console), `${lesson.id} step ${index + 1} needs explicit console state`);
    assert.ok(step.console.length >= previousConsoleLength, `${lesson.id} console output cannot disappear while stepping forward`);
    previousConsoleLength = step.console.length;

    if (step.prediction) {
      predictionCount += 1;
      assert.ok(step.prediction.options.length >= 2, `${lesson.id} prediction needs choices`);
      assert.ok(step.prediction.answer >= 0 && step.prediction.answer < step.prediction.options.length, `${lesson.id} prediction answer is invalid`);
    }
  }
}

assert.ok(predictionCount >= 3, 'Release A needs at least three prediction stops');
console.log(`Validated ${lessons.length} Dog lessons with ${predictionCount} prediction stops.`);
