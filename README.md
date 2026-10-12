# Java Journey

Interactive visual lessons showing how Java executes code, beginning with objects and instance methods before progressing to variables, loops, arrays, two-dimensional arrays, and multi-class programs.

Live site: https://samcogan88.github.io/JavaJourney/

## Current curriculum

The opening path contains eight core `App.java` and `Dog.java` lessons, expanded with application checkpoints and projects:

1. Entering `App.main()`
2. Defining a second class without executing it
3. Constructing one Dog and storing a reference
4. Calling `bark()` and returning to App
5. Separating one class definition from two objects
6. Initialising independent fields with a constructor
7. Running the same method against different receiver objects
8. Returning a value through a getter

The original variables, loops, arrays, 2D arrays, challenge, getters/setters, and multiple-Student lessons remain available afterward.

Additional object-first activities include a regular-method parameter lesson before constructors, a dedicated explanation of `this`, reference aliasing, three-question mastery checks, two offline mini projects, and a final Dog Adoption Centre capstone.

## How execution is represented

Java Journey is a guided execution visualiser. Lesson traces are predefined and validated against the displayed example code; the application does not compile or execute arbitrary Java entered by a learner. Heap and stack diagrams are conceptual teaching models rather than byte-for-byte JVM memory diagrams.

Prediction stops pause playback before consequential steps. Application checks require the correct answer before progression and link back to the relevant lesson after an incorrect attempt.

## Development

The project is a buildless static site in `dist/`. Run the lesson-data validation with:

```sh
node tests/validate-dog-lessons.mjs
```

Pushes to `main` deploy automatically through `.github/workflows/pages.yml`.

## Roadmap

- Release B (in progress): persistence, application checks, milestone mastery checks, project briefs, and expanded semantic validation are complete; controlled input experiments remain.
- Release C: conditions, aliasing, arrays of objects, validation setters, nested calls, and debugging challenges.
