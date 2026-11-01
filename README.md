# Beyond the Plane

A playable, dependency-free browser game about reconstructing a 3D solid from the one-dimensional view of its changing cross-sections. Twenty experiments progress from simple solids to faceted profiles, skewed and twisted columns, asymmetric shapes, lobed forms, and linked rings.

## Premise

You live in a two-dimensional world. A three-dimensional object passes through your plane, and you must infer its full shape from what you observe. After observing, choose the correct object from a small set of 3D candidates.

Your in-world vision is a one-dimensional strip: colored line segments whose apparent lengths and colors change as the object moves and you change your viewpoint. No overhead view or 3D view of the actual object is available during observation. Candidate cards are created only when the player selects **Ready to guess**. They appear in a separate dialog, never beside the observation strip. Closing the dialog removes the candidates and preserves the current time and viewpoint.

## Geometry and perception

The passing object intersects the world in a 2D cross-section, rather than casting a projection or shadow onto it. A sphere passing through produces a circle that grows from a point, reaches a maximum, then shrinks to a point. A suitably aligned cube produces a constant square while it crosses; a cone can produce steadily growing or shrinking circles.

The player sees each cross-section edge-on. Cast rays within the world plane and display the nearest visible boundary along each viewing direction as a horizontal strip. Apparent segment length depends on viewing distance and angle as well as the slice's geometry. Complex or disconnected slices can produce several visible segments separated by background; nearer surfaces hide farther ones.

Color must follow a consistent rule: assign a fixed material/color field to each object and sample it at the slice boundary. Never randomize colors between frames. Early puzzles can use uniform color to teach shape inference, then introduce stable markings as additional evidence. Avoid giving each answer a unique identifying color unless color deduction is the intended lesson.

## Core loop

1. Introduce the observation abilities with all candidate objects hidden.
2. Let the object pass through the plane along a prescribed trajectory.
3. Observe changing segment lengths, colors, gaps, and occlusion.
4. Use movement, freeze, rewind, forward playback, and timeline scrubbing to gather more evidence; all are available from the first puzzle.
5. Select **Ready to guess**, inspect the candidates, and choose the one that explains the observations. **Keep observing** returns to the hidden-choice observation view.
6. Reveal the actual object in 3D, the world plane, and a synchronized replay of what the player saw.

The reveal is the teaching moment: connect the changing slice and the line-strip view to the full shape. Allow retries without a time penalty.

## Progression

All observation abilities are available throughout the game. The player can freeze time, move around the current slice, and play or scrub time backward and forward from the first puzzle. Player position stays independent of object time, so rewinding never undoes observation movement. There are no ability unlocks.

- Levels 1–4: simple solids establish time and viewpoint observation.
- Levels 5–8: pyramids, ellipsoids, faceted prisms, and truncated profiles require closer comparisons.
- Levels 9–12: growing polygons, tilt, skew, and twist require tracking edges across both time and angle.
- Levels 13–15: compound and asymmetric profiles require comparing the entire passage.
- Levels 16–17: circular, stretched, thick, and tilted rings reward studying gaps and occlusion.
- Levels 18–20: lobes, changing twist, and ring assemblies require reconstructing several slices and their relationships.

Levels 1–7 offer three candidates; levels 8–20 offer four, chosen for similar features. Observation prompts give only general investigative advice, without identifying the candidates. All objects still travel on a known straight path: a twisted solid does not rotate while passing through the plane.

Difficulty grows through object complexity and the similarity of answer choices. Players can take as much time as they need to investigate each puzzle.

Keep the initial motion a known straight translation at a known speed. Rotation or unknown motion introduces another source of ambiguity and should be a separately taught mechanic.

## Fairness and controls

- A single view or slice often cannot uniquely identify a 3D object. Validate every candidate set against the observations and abilities available in that level; do not assume distinct solids necessarily look distinct.
- Keep candidate scale, orientation, motion, and material conventions explicit. Early puzzles should not require guessing hidden pose or size.
- Start the observer outside the object's maximum slice footprint and constrain early movement to a safe inspection orbit.
- Give the player a heading indicator and a clear time cursor. Pause freezes the object, while observation movement remains active.
- Color supplements geometry; avoid puzzles solvable only by distinguishing similar hues.
- Prefer untimed reasoning and discovery over reaction speed.

## Play

Open `index.html` directly in a modern browser. The game works offline without installation, external assets, or a build step.

Alternatively, run `npm run dev` from this folder and open **http://127.0.0.1:4318**. Set `PORT` to choose a different port.

- **Space** freezes or resumes time; **R** plays backward.
- **Left/right arrows** or **A/D** move around the cross-section.
- **[ / ]** step backward/forward in time.
- Drag the time slider to any moment or the viewpoint slider to any angle. Touch users can also hold the movement buttons.
- Select **Ready to guess** to open the candidates. Rotate their previews together with the inspection slider, choose a solid, and select **Reveal the answer**. The reveal shows the same object, a world plane, its highlighted cross-section, and your viewing direction. Drag the reveal to orbit the 3D camera; the time and viewpoint controls remain active.
- All twenty experiments are available immediately. Correct answers are saved locally when storage is available. Saves from the original nine levels migrate to their corresponding experiments in the new progression. Wrong answers reveal the explanation and allow another attempt.

Sliders keep their standard keyboard controls when focused; Space activates a focused button. Opening instructions or leaving the browser pauses time. Reduced-motion users start each puzzle paused.

## Implementation

Vanilla JavaScript and Canvas 2D, with no runtime dependencies. `src/geometry.js` generates shared triangle meshes, intersects them with the world plane, and raycasts the resulting segments from the observer's position. The nearest edge determines each visible sample, including occlusion and gaps. All solids use the same mint material with view-dependent edge shading. Curved shapes are polygonal approximations.

`src/model.js` owns puzzles, playback, movement, answering, and completion. `src/render.js` draws the line strip and a software-rendered 3D reconstruction. `src/app.js` connects the controls and saves progress. The reveal's bright contour is an explanatory x-ray overlay; its amber observer marker indicates direction rather than the full observation radius. Candidate thumbnails initially show an oblique view in the actual passage orientation; the inspection slider rotates their cameras together. The 3D reveal follows the same straight translation used for slicing.

## Verification

```sh
npm test
npm run check
```

The tests verify analytic sphere and cube slices, cone narrowing, nearest-edge occlusion, the ring's central gap, timeline bounds, candidate distinguishability across viewpoints and moments, independent movement while frozen, forward/reverse playback, the explicit guessing phase and cancellation, answer locking, twenty valid candidate sets, saved-progress validation, and migration from the original nine levels.

Optional browser smoke test (requires Node with built-in WebSocket and an installed Chrome):

```sh
node scripts/browser-check.cjs
```

On macOS it uses the default Chrome application path. Set `CHROME_PATH` elsewhere. It launches an isolated temporary browser profile and a local server on port 4328, checks gameplay and direct-file launch, and writes desktop/mobile screenshots under ignored `artifacts/`. It closes its browser/server and removes its temporary profile afterward.

The existing sibling project `flatland` is a reference for line-strip perception; this is a separate game focused on reconstructing 3D solids from changing cross-sections.
