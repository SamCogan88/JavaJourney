import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../dist/dog-lessons.js', import.meta.url), 'utf8')
  .replace('const dogLessons =', 'globalThis.dogLessons =');
const context = {};
vm.runInNewContext(source, context);
const lessons = context.dogLessons;
const extensionSource = fs.readFileSync(new URL('../dist/curriculum-extensions.js', import.meta.url), 'utf8')
  .replace('const curriculumExtensions =', 'globalThis.curriculumExtensions =');
vm.runInNewContext(extensionSource, context);
const extensions = Object.values(context.curriculumExtensions);

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
    assert.deepEqual([...step.console.slice(0, previousConsoleLength)], [...lesson.steps[Math.max(0,index-1)].console.slice(0, previousConsoleLength)], `${lesson.id} must preserve earlier console lines`);
    previousConsoleLength = step.console.length;

    if (step.prediction) {
      predictionCount += 1;
      assert.ok(step.prediction.options.length >= 2, `${lesson.id} prediction needs choices`);
      assert.ok(step.prediction.answer >= 0 && step.prediction.answer < step.prediction.options.length, `${lesson.id} prediction answer is invalid`);
    }
  }
}

assert.ok(predictionCount >= 3, 'Release A needs at least three prediction stops');

for (const lesson of extensions) {
  assert.ok(lesson.files?.['App.java'], `${lesson.id} must include App.java`);
  for (const [index, step] of lesson.steps.entries()) {
    assert.ok(lesson.files[step.file], `${lesson.id} step ${index + 1} refers to an unknown file`);
    assert.ok(step.line >= 1 && step.line <= lesson.files[step.file].length, `${lesson.id} step ${index + 1} has an invalid line`);
    if (step.activity) {
      assert.ok(step.activity.options.length >= 2, `${lesson.id} activity needs choices`);
      assert.ok(step.activity.review, `${lesson.id} activity needs a remediation lesson`);
    }
  }
  if (lesson.mastery) {
    assert.equal(lesson.steps.length, 3, `${lesson.id} must contain three mastery questions`);
    assert.ok(lesson.steps.every(step => step.activity), `${lesson.id} mastery steps must require learner action`);
    assert.ok(new Set(lesson.steps.map(step => step.activity.answer)).size > 1, `${lesson.id} must vary correct-answer positions`);
  }
}

const aliases=context.curriculumExtensions.aliasing.steps;
assert.equal(aliases[1].dogs.length,1,'Copying a reference must not create another Dog');
assert.deepEqual([...aliases[1].dogs[0].refs],['dog1','other'],'Both aliases must point to Dog #1');
assert.equal(aliases.at(-1).dogs[0].fields.name,'"Scout"','Mutation through other must be visible through dog1');

const constructor=lessons.find(lesson=>lesson.id==='dog-names').steps;
assert.equal(constructor[0].dogs[0].fields.name,'null','String fields must have Java default null before constructor assignment');
assert.equal(constructor[1].dogs[0].fields.name,'"Rex"','Constructor must initialize Dog #1 before App continues');

const parameters=context.curriculumExtensions.parameters;
assert.ok(parameters.files['Dog.java'].some(line=>line.includes('bark(String sound)')),'Parameter lesson must use a simple String parameter');
assert.ok(!parameters.files['Dog.java'].some(line=>line.includes('for (')),'Parameter lesson must not introduce loops');
assert.deepEqual([...parameters.steps.at(-1).console],['Woof!','Ruff!'],'Different arguments must produce different output through the same method');

const thisLesson=context.curriculumExtensions.thisConcept;
assert.ok(thisLesson.files['Dog.java'].some(line=>line.includes('System.out.println(this.name)')),'this lesson must read receiver state explicitly');
assert.ok(!thisLesson.files['Dog.java'].some(line=>line.includes('System.out.println(this);')),'this lesson must not print Java object identity text');

for (const lesson of extensions.filter(lesson=>lesson.mastery)) {
  for (const [fileName, lines] of Object.entries(lesson.files)) {
    assert.match(lines.join('\n'),new RegExp(`public class ${fileName.replace('.java','')} \\{`),`${lesson.id} ${fileName} must be a complete class`);
  }
  assert.match(lesson.files['App.java'].join('\n'),/public static void main\(String\[\] args\)/,`${lesson.id} must include a runnable main method`);
}

const getter=lessons.find(lesson=>lesson.id==='dog-getter').steps;
assert.ok(getter[1].stack.at(-1).includes('getName'),'Getter frame must be active while reading the field');
assert.ok(!getter[3].stack.some(frame=>frame.includes('getName')),'Getter frame must be removed before assignment in App');
assert.equal(getter[3].vars.dogName,'"Rex"','Returned value must be assigned in App');

const appSource=fs.readFileSync(new URL('../dist/app.js', import.meta.url),'utf8');
assert.match(appSource,/current\.activity\?state\.predictions\.get\(predictionKey\(\)\)===interaction\.answer/,'Application checks must require the correct answer');
assert.match(appSource,/if\(!passed\)return/,'Next-step gating must block failed application checks');
assert.match(appSource,/const tourSteps=\[/,'Lesson 1 must include an interface orientation tour');
assert.match(appSource,/target:'\.code-panel'/,'The welcome tour must identify the code area');
assert.match(appSource,/target:'\.visual-panel'/,'The welcome tour must identify the execution visual');
assert.match(appSource,/target:'\.explanation-card'/,'The welcome tour must identify the plain-English explanation');
assert.match(appSource,/target:'#nextButton'/,'The welcome tour must finish on the primary Next step control');
assert.match(appSource,/lesson\.id==='app-start'\|\|state\.view==='console'/,'Lesson 1 must always show the simple output view');
assert.match(appSource,/classList\.toggle\('beginner-mode',beginner\)/,'Lesson 1 must enable progressive interface disclosure');
assert.doesNotMatch(lessons[0].steps[0].title,/invokes/i,'Lesson 1 should lead with everyday language');

const orderedIds=[...lessons.slice(0,5).map(x=>x.id),'method-parameters','meet-this','reference-aliasing',...lessons.slice(5).map(x=>x.id)];
assert.ok(orderedIds.indexOf('method-parameters')<orderedIds.indexOf('dog-names'),'Ordinary method parameters must precede constructor parameters');
assert.ok(extensions.filter(lesson=>lesson.projectLesson).length>=3,'Curriculum needs recurring mini projects and a final project');

console.log(`Validated ${lessons.length} Dog lessons, ${extensions.length} extension lessons and ${predictionCount} prediction stops.`);
