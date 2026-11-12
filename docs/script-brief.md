# FLOW LAB — Script Brief

This document contains no lines. None. We checked.

What it has instead: every place in the game where words go, and for each one — where it appears, who says it, what it needs to achieve, and how much room it has. Write the line, put it in `js/script.js` under the same key, refresh, and it's in the game.

- **Key** — the name in `js/script.js`. `tutorial.found` means `tutorial: { found: '…' }`.
- **Length** — counted in Korean characters (spaces included), because that's what has to fit on a phone. The English word count in brackets is a rough guide for writing the original.
- **Button pictures** — write `{play}` inside a line and the game swaps in the actual button. Each one takes about two characters' worth of room. The full list sits at the top of `js/script.js`.
- **Recommended workflow** — write it in English first, then translate. The game is meant to feel like a small British indie title that someone has lovingly localised into Korean, and the slight stiffness of a translation is part of the charm. The letters (`story.mail`) already have `en` and `ko` side by side.

---

## 1. World and tone

- **Setting** — The Roads Department of an unnamed provincial town. At the end of the year the council will hold a **departmental abolition review**. Fix the morning commute in four districts — countryside, harbour, town and mountains — before then, and the department survives.
- **The player** — The new "Manager". Fourth one this year. Never speaks. Everyone addresses them politely, the way you'd address someone you don't expect to see again.
- **Tone** — Dry bureaucratic comedy with a soft centre. Nothing explodes. Small, specific lives get slightly better. The jokes come from **the afterthought tacked onto the end of a sentence**, and from **people being far too honest about mundane things**.
- **The translated feel** — Write as if there's an English original behind every line: short, precise sentences; the subject usually kept; endings like "That is all." / "Even so." Understatement over exclamation. No sound effects, no slang, no memes, no emoji.
- **Avoid** — Internet voice, spelling out the moral, telling the player off, long back-and-forth dialogue (a scene is 2–6 lines, not a radio play).

## 2. Characters

### Pip — Site Foreman, Roads Department. A penguin.
- **Role** — Runs the tutorial, gives the tool lectures, narrates the story.
- **Personality** — Tired but conscientious. Never does a job badly. The cynicism points at **himself and the council**, never at the player. Genuinely wants the player to succeed, and has no idea how to say so, so every compliment arrives with a small dent in it.
- **Voice** — Polite, formal Korean (`-습니다`, `-죠`). Two or three short sentences, then a short afterthought ("…mostly.", "I mean that."). Almost no exclamation marks. Oddly exact with numbers (42 minutes, 11 years, nine in ten).
- **Recurring material** — Fish (lunch, and eventually his first ever performance bonus). Working hours. The abolition review and the threat of a transfer to Parking Enforcement. Pretending his being a penguin isn't on file. Eating lunch alone in the park. Stairs, short legs.
- **Arc** — Tutorial: hides the department's trouble, keeps it professional → Prologue (after 1-1's first star): admits everything → each district finished: nearly allows himself hope → Ending: the department survives, he lets one feeling slip, and asks for it to be kept off the record.
- **Poses** — `talk` neutral · `think` thoughtful / dry joke · `worry` worried · `found` relieved, pleased · `point` pointing · `cheer` happy · `search`/`call` looking for the player (tutorial opening). In lectures he holds a pointer: `teach`/`teach2`.

### Angus — a moose. Farm lad, eventually site manager.
- **Role** — The face of someone whose life gets better because of the player. One line on stage cards and result cards; the occasional scene.
- **Personality** — Earnest, eager, unsure of himself but relentlessly hopeful. Can't hide gratitude. Volunteers his own mistakes cheerfully.
- **Voice** — Polite but warm (`-요`). Sometimes stammers into a sentence ("Um, ex— excuse me"). Plenty of exclamation marks. Shorter sentences than Pip; feelings arrive before the facts.
- **Recurring material** — Potatoes. His mum (who sticks photos on the fridge). Hard hats and hi-vis. Shovels. "The lads down the docks".
- **Arc by rank** — Countryside: farm lad (shy, asking a favour) → Harbour: site hand (thrilled to have a job) → Town: site engineer (a bit more composed, starting to read drawings) → Mountains: site manager (grown up, mostly; occasionally attempts a Manager Voice and it collapses).
- **Poses** — `cheer` happy · `shy` shy / sorry.

### K — the previous Manager. Appears only in notes and a postcard.
- **Role** — The player's mirror. Believed "the more roads, the better" — right up to Town 3-3 (the shortcut paradox), where he resigned.
- **Voice** — Diary fragments, plain past tense, short. Certainty → doubt → bewilderment. Never names a feeling directly.
- **Arc** — A note on every stage card from 1-1 to 3-3. Then the notes stop. A postcard from the seaside when Town is finished; a final letter on 4-6.

### The residents — letter writers
- One person per stage whose life changed very slightly because that road was fixed. Each gets a one-line personality (see the letters table).
- House rule: nobody says "thank you" loudly. One small, specific change + one odd or personal aside.

### Story timeline
| When | What |
|---|---|
| First launch | Title screen → tutorial (joining the road on 1-1) → handover form |
| After 1-1's first star | Prologue: the abolition review is admitted; K's first note revealed |
| 1-3 stage card | Angus's first appearance |
| First stage of each district (2-1, 3-1, 4-1) | District intro scene + Angus's promotion news |
| Every stage card | A note from K or from Pip |
| Every stage's first star | One resident's letter |
| All six stages in a district starred | District finale scene |
| All twenty-four starred | Ending: the review verdict |

---

## 3. Slot by slot

### 3-1. Name tags and title screen
#### `name / role`
- **Where** — The name tag above every Pip speech bubble
- **Who** — —
- **Job** — Pip's name, and a job title that sounds like it came out of a council staffing chart.
- **Length** — name 1–4 Korean chars (≈ 1–1 English words) / title 5–10 Korean chars (≈ 2–3 English words)

#### `title.small`
- **Where** — Top line of the green road-sign title card, small print
- **Who** — The sign (no speaker)
- **Job** — Reads like the reference number bolted to the corner of a road sign: department and district.
- **Length** — 6–14 Korean chars (≈ 2–4 English words)
- **Must include** — Something official-sounding

#### `title.line1`
- **Where** — Title card, first line under the logo
- **Who** — The sign
- **Job** — The premise in one sentence: there's a town that grinds to a halt every morning.
- **Length** — 18–28 Korean chars (≈ 5–8 English words)

#### `title.line2`
- **Where** — Title card, second line
- **Who** — The sign
- **Job** — The player has been handed the job. Pairs with line 1.
- **Length** — 15–24 Korean chars (≈ 5–7 English words)
- **Must include** — Second person — it's addressed to you

#### `title.start`
- **Where** — Big yellow button on the title card (first visit)
- **Who** — Button
- **Job** — Start the game. A commuting / clocking-in metaphor works.
- **Length** — 2–6 Korean chars (≈ 1–2 English words)

#### `title.resume`
- **Where** — Big yellow button (after the tutorial)
- **Who** — Button
- **Job** — Continue.
- **Length** — 3–7 Korean chars (≈ 1–2 English words)

#### `title.skipTutorial / title.replayTutorial`
- **Where** — Small links under the big button
- **Who** — Button
- **Job** — Skip the tutorial / watch it again.
- **Length** — 6–12 Korean chars (≈ 2–4 English words)

### 3-2. First tutorial (`tutorial`) — 1-1 Countryside, joining the road
Pip and a speech bubble sit at the bottom of the screen. Whatever he's talking about is lit; everything else is dimmed. **The bubble is narrow: one idea per line.**

#### `tutorial.call1`
- **Where** — Opening shot: Pip peers in from the left edge (advances by itself after 1.4 s)
- **Who** — Pip `search`
- **Job** — He is looking for the Manager and hasn't spotted them yet.
- **Length** — 3–8 Korean chars (≈ 1–2 English words)
- **Must include** — A call
- **Avoid** — Explanation of any kind

#### `tutorial.call2`
- **Where** — Pip peers in from the right (auto)
- **Who** — Pip `search`
- **Job** — Still looking, slightly more urgent. A variation on call1.
- **Length** — 3–8 Korean chars (≈ 1–2 English words)

#### `tutorial.call3`
- **Where** — Centre screen, very large text — Pip shouts (auto)
- **Who** — Pip `call`
- **Job** — He's been at this a while. Pip almost never raises his voice, which is exactly why this one is funny.
- **Length** — 5–12 Korean chars (≈ 2–4 English words)
- **Must include** — A stretched-out vowel or similar

#### `tutorial.found`
- **Where** — Pip finally spots the player. From here the screen brightens
- **Who** — Pip `found`
- **Job** — Relief at finding them, plus a civil-servant joke about logging the search as work time. First impression: tired, but diligent.
- **Length** — 30–55 Korean chars (≈ 9–17 English words)

#### `tutorial.intro`
- **Where** — Introduction
- **Who** — Pip `talk`
- **Job** — Name, title, and that he'll be showing the Manager round from today. (He does NOT mention the abolition review yet.)
- **Length** — 30–55 Korean chars (≈ 9–17 English words)
- **Avoid** — Any hint of the department being in trouble — that's the prologue's job

#### `tutorial.look`
- **Where** — The whole 1-1 countryside map is visible
- **Who** — Pip `worry`
- **Job** — Introduce the first site: the road between the village and the market stops halfway, so nobody gets to market. Make the player look at the map and see the problem.
- **Length** — 45–85 Korean chars (≈ 14–26 English words)
- **Must include** — Village, market, the gap

#### `tutorial.tray`
- **Where** — The tool tray at the bottom is lit
- **Who** — Pip `point`
- **Job** — This is the tool tray. Today there are only two tools (Road, Demolish). And if a tool is a mystery, the `?` button on the right summons Pip with a lecture.
- **Length** — 50–90 Korean chars (≈ 15–27 English words)
- **Must include** — That there are only a few tools; how to ask Pip

#### `tutorial.pick`
- **Where** — Only the Road button is lit. **Advances when the player selects Road**
- **Who** — Pip `point`
- **Job** — Pick the Road tool. Short and clear.
- **Length** — 20–40 Korean chars (≈ 6–12 English words)
- **Must include** — `{t:road}`, an instruction to pick it

#### `tutorial.first`
- **Where** — Only the first marked tile on the map is lit. **Advances when a road is placed there**
- **Who** — Pip `think`
- **Job** — Tap the marked tile and a road goes down.
- **Length** — 25–45 Korean chars (≈ 8–14 English words)
- **Must include** — The marked tile; tapping

#### `tutorial.draw`
- **Where** — The rest of the route is marked. **Advances when the road reaches the market**
- **Who** — Pip `think`
- **Job** — Follow the marks to the market, plus the trick: drag to draw several at once, and tap a tile again to remove a mistake.
- **Length** — 55–90 Korean chars (≈ 17–27 English words)
- **Must include** — Drag to draw; tap again to undo

#### `tutorial.run`
- **Where** — Only the Run button is lit. **Advances when pressed**
- **Who** — Pip `found`
- **Job** — A word of approval, then: press Run and let's see whether the villagers actually reach the market.
- **Length** — 30–55 Korean chars (≈ 9–17 English words)
- **Must include** — `{play}`

#### `tutorial.hud`
- **Where** — Simulation running; the status strip gets an outline (no dimming)
- **Who** — Pip `point`
- **Job** — How to read the strip: the big number is the average journey time (lower is better); next to it, accidents and arrivals.
- **Length** — 50–85 Korean chars (≈ 15–26 English words)
- **Must include** — Average journey time; lower is better

#### `tutorial.wait`
- **Where** — Running; outline round the speed and skip buttons. **Advances when the result appears**
- **Who** — Pip `talk`
- **Job** — Watch it through, or skip if you're in a hurry.
- **Length** — 35–60 Korean chars (≈ 11–18 English words)
- **Must include** — `{skip}` (and/or `{speed}`)

#### `tutorial.result`
- **Where** — The result card is lit
- **Who** — Pip `cheer`
- **Job** — How the result card works: goals are earned top to bottom, a star each. Pip's version of praise.
- **Length** — 35–70 Korean chars (≈ 11–21 English words)
- **Must include** — Stars come in order

#### `tutorial.help`
- **Where** — Only the `?` button on the right is lit
- **Who** — Pip `talk`
- **Job** — The rest you'll pick up on the job. Stuck on a tool? Press `?` and he'll come. The list grows as tools unlock.
- **Length** — 50–90 Korean chars (≈ 15–27 English words)
- **Must include** — `{help}`

#### `tutorial.bye`
- **Where** — Last line of the tutorial (the handover form follows)
- **Who** — Pip `cheer`
- **Job** — Exit line. He leaves for a personal, fish-related reason, wishes the Manager luck, then adds one beat too many.
- **Length** — 40–70 Korean chars (≈ 12–21 English words)

### 3-3. Handover form (`end`) — the paperwork card after the tutorial
Looks like an official form. A rubber stamp thumps down on it.

#### `end.form`
- **Where** — Small print at the top
- **Who** — The form
- **Job** — Form number and title. As stiff as real paperwork.
- **Length** — 14–26 Korean chars (≈ 4–8 English words)
- **Must include** — A form number

#### `end.title`
- **Where** — Big heading
- **Who** — The form
- **Job** — Declares the handover complete.
- **Length** — 4–8 Korean chars (≈ 1–2 English words)

#### `end.body1`
- **Where** — First line of the body
- **Who** — The form
- **Job** — Appoints the player as Roads Manager for the district.
- **Length** — 20–34 Korean chars (≈ 6–10 English words)
- **Must include** — May bold the job title with `<b>…</b>`

#### `end.body2`
- **Where** — Second line
- **Who** — The form
- **Job** — From today, all complaints go to the Manager. The joke is delivering something alarming completely deadpan.
- **Length** — 30–56 Korean chars (≈ 9–17 English words)
- **Must include** — `<b class="all">…</b>` to emphasise "all complaints"

#### `end.list[0~2]`
- **Where** — Three checklist lines inside the form, each starting with a button picture
- **Who** — The form (Manager's code of practice)
- **Job** — The game loop: watch → fix → run again. Each line ends with a short rule of thumb (jams happen for a reason / more roads isn't always the answer / if the number goes down, you're right).
- **Length** — 22–36 Korean chars (≈ 7–11 English words) each
- **Must include** — Lines start with `{rewind}` / `{t:road}` / `{play}`

#### `end.stamp1 / stamp2`
- **Where** — Two lines inside the red round stamp
- **Who** — The stamp
- **Job** — Handover complete.
- **Length** — 2–3 Korean chars (≈ 1–1 English words) each

#### `end.button`
- **Where** — Yellow button
- **Who** — Button
- **Job** — Start work.
- **Length** — 3–6 Korean chars (≈ 1–2 English words)

### 3-4. "Ask Pip" labels (`ask`)
#### `ask.button / ask.buttonSub`
- **Where** — Button inside the tool description popup (big text / small text)
- **Who** — Button
- **Job** — Phrased as the player's question (what's this for?) / who you're asking.
- **Length** — big 6–12 Korean chars (≈ 2–4 English words) / small 6–10 Korean chars (≈ 2–3 English words)

#### `ask.heading / close / skip`
- **Where** — Lecture heading, close button, skip button
- **Who** — Button
- **Job** — —
- **Length** — 2–6 Korean chars (≈ 1–2 English words)

### 3-5. Angus (`moose`)
#### `moose.name / moose.ranks[0~3]`
- **Where** — Angus's name tag / his rank (countryside → harbour → town → mountains)
- **Who** — —
- **Job** — Ranks should sound like a real building-site hierarchy, and clearly climb.
- **Length** — name 2–5 Korean chars (≈ 1–2 English words) / ranks 4–6 Korean chars (≈ 1–2 English words) each

#### `moose.first`
- **Where** — 1-3 "Two Villages, One Market" stage card — Angus's debut (`shy`)
- **Who** — Angus (farm lad)
- **Job** — Shyly asks a stranger for a favour: could his farm be joined to the market too? One concrete reason it's urgent (the potatoes are going off).
- **Length** — 40–70 Korean chars (≈ 12–21 English words)
- **Must include** — A stammering opener; potatoes

#### `moose.hello[1]`
- **Where** — 2-1 stage card, first harbour stage (`cheer`)
- **Who** — Angus (site hand)
- **Job** — Thanks to the Manager's road he's got a job on the harbour site. One new piece of kit (a hard hat).
- **Length** — 40–60 Korean chars (≈ 12–18 English words)

#### `moose.hello[2]`
- **Where** — 3-1 stage card, first town stage (`cheer`)
- **Who** — Angus (site engineer)
- **Job** — Fully qualified engineer now. Family reaction (Mum's put his photo on the fridge).
- **Length** — 40–60 Korean chars (≈ 12–18 English words)

#### `moose.hello[3]`
- **Where** — 4-1 stage card, first mountain stage (`cheer`)
- **Who** — Angus (site manager)
- **Job** — He's the site manager, which he can't believe either. Still a farm lad underneath (misses the smell of the fields).
- **Length** — 40–60 Korean chars (≈ 12–18 English words)

#### `moose.cheer[rank][0~2]`
- **Where** — Result card when a star is earned; one of three picked at random per rank (`cheer`)
- **Who** — Angus
- **Job** — Celebrates with the player. Gets slightly more composed with each rank. The three lines for a rank should come from different angles (thanks / ties it to his own work / an odd aside).
- **Length** — 15–40 Korean chars (≈ 5–12 English words)

#### `moose.sorry[0~2]`
- **Where** — Result card when no star is earned; one of three at random (`shy`)
- **Who** — Angus
- **Job** — Consoles the player with his own blunders or clumsy encouragement. Never scolds, never gives the answer away.
- **Length** — 15–35 Korean chars (≈ 5–11 English words)

### 3-6. Story (`story`)
#### `story.worlds[0~3]`
- **Where** — Stage-select road map: the grey line next to each district name — countryside, harbour, town, mountains
- **Who** — Narration (like a map legend)
- **Job** — The district's character and its main traffic problem in one line. A dry observation with a small twist.
- **Length** — 12–28 Korean chars (≈ 4–8 English words)
- **Must include** — Countryside: broken roads, tractors / Harbour: lorries, bridges, crossings / Town: complaints, crossroads, shortcuts / Mountains: rock, gorges

#### Scenes (`story.scenes`)
Each scene line is `['who', 'pose', 'line']`. Who: `pip` · `angus` · `note` (a note — the pose slot becomes the note's heading). A large bubble at the bottom of the screen; tap to advance. **20–90 Korean chars (≈ 6–27 English words) per line, 2–6 lines per scene.** Add or drop lines freely.

#### `scenes.prologue`
- **Where** — Right after the first star on 1-1, once the result card is closed
- **Who** — Pip 4–5 lines + 1 note
- **Job** — The story begins. ① A word of praise, then the thing he's been holding back ② The department faces an abolition review this year (quote the council's stiff phrasing) ③ Fix four districts to survive; otherwise Pip goes to Parking Enforcement ④ The Manager is the fourth this year — and a pointed silence about the other three ⑤ Note: K's creed in one line ⑥ He'll pin K's notes to the stage cards from now on.
- **Length** — 20–90 Korean chars (≈ 6–27 English words) per line
- **Must include** — The review; four districts; fourth Manager; K's notes
- **Avoid** — Blaming the player

#### `scenes.world1`
- **Where** — Opening the harbour (2-1) for the first time, before the stage card
- **Who** — Pip, 2 lines
- **Job** — Harbour intro (the containers arrive on time; the lorries carrying them don't) + one line on what K did here (built one bridge and went on a long holiday).
- **Length** — 30–60 Korean chars (≈ 9–18 English words) per line

#### `scenes.world2`
- **Where** — Opening town (3-1) for the first time
- **Who** — Pip 2 lines + Angus 1
- **Job** — Town is complaints HQ + foreshadowing: K quit at this district's 3-3, after adding roads and making it worse + Angus's entirely unfounded encouragement.
- **Length** — 30–65 Korean chars (≈ 9–20 English words) per line
- **Must include** — Foreshadow 3-3

#### `scenes.world3`
- **Where** — Opening the mountains (4-1) for the first time
- **Who** — Pip 1 line + Angus 1
- **Job** — Last district, the review is close + Angus tries to say something managerial and doesn't quite land it.
- **Length** — 30–55 Korean chars (≈ 9–17 English words) per line

#### `scenes.clear0`
- **Where** — All six countryside stages starred
- **Who** — Angus 2 + Pip 2
- **Job** — The countryside payoff: every potato sold → Pip's report (he very nearly hopes) → Angus nervously asks about applying for the harbour job → Pip writes his first ever reference.
- **Length** — 20–60 Korean chars (≈ 6–18 English words) per line
- **Must include** — Angus's next job (harbour)

#### `scenes.clear1`
- **Where** — All six harbour stages starred
- **Who** — Pip 2 + Angus 1
- **Job** — The harbour runs on time → the dockers send fish as thanks (Pip's first ever bonus) → Angus passes his engineer's exam.
- **Length** — 25–55 Korean chars (≈ 8–17 English words) per line

#### `scenes.clear2`
- **Where** — All six town stages starred
- **Who** — Pip 2 + note (postcard) 1
- **Job** — What passing 3-3 means (K never did) → Pip closes the drawer where he keeps his resignation letter → a short postcard from K at the seaside (his realisation + where he lives now).
- **Length** — Pip 25–50 Korean chars (≈ 8–15 English words) / postcard 50–80 Korean chars (≈ 15–24 English words)
- **Must include** — K's realisation: it was about closing one

#### `scenes.clear3`
- **Where** — All six mountain stages starred — just before the ending
- **Who** — Pip 4 + Angus 1
- **Job** — Tension before the verdict (one line of pure ellipsis) → survived, budget frozen (a triumph, in this town) → Angus's joy (Mum, the fridge) → Pip lets one feeling show (pay off the 42 minutes from the tutorial) + asks for it to be kept off the record.
- **Length** — 2–50 Korean chars (≈ 1–15 English words) per line
- **Must include** — Call back to the tutorial's opening

#### Stage-card notes (`story.memo`)
A yellow (K) or pale green (Pip) sticky note on the stage card. `['k' or 'pip', 'text']`. **20–55 Korean chars (≈ 6–17 English words), one or two sentences.** K up to 3-3, Pip after that. Don't hand out the solution; nudge at the map's problem from an angle.

| Stage | Writer | The map's problem (what the note should nudge at) | Where the writer is |
|---|---|---|---|
| 1-1 The Broken Lane | K | Join the village to the market; the road stops halfway. Tools: Road | K's first day. Still optimistic |
| 1-2 Over the Stream | K | A stream cuts the road; only a bridge will do. Tools: Road, Bridge | K: certainty slowly wobbling |
| 1-3 Two Villages, One Market | K | Connect both the village and the farm to the market. Tools: Road | K: certainty slowly wobbling |
| 1-4 Stuck Behind the Tractor | K | A slow tractor leads a long queue; widen the road so others can pass. Tools: Widen, Road | K: certainty slowly wobbling |
| 1-5 The Long Way Round | K | The market is next door but the road goes all the way round. Tools: Road | K: certainty slowly wobbling |
| 1-6 Market Day (region final) | K | Broken road, a stream and slow tractors, all at once. Tools: Road, Bridge, Widen | K: certainty slowly wobbling |
| 2-1 Road to the Quay | K | Warehouse to quay, across the canal. Tools: Road, Bridge | K: certainty slowly wobbling |
| 2-2 Crossing at the Terminal | K | Cars queue at a zebra crossing; send the people over the top. Tools: Footbridge, Road, Bridge | K: certainty slowly wobbling |
| 2-3 One Bridge for the Whole Harbour | K | Everyone funnels onto the only bridge. Tools: Bridge, Road | K: certainty slowly wobbling |
| 2-4 Container Maze | K | Thread a road between immovable containers to two quays. Tools: Road | K: certainty slowly wobbling |
| 2-5 Fish Market Crossroads | K | An unsignalled crossroads where everyone politely gives way and nobody moves. Tools: Roundabout, Traffic lights, Guide lines | K: certainty slowly wobbling |
| 2-6 Sailing Time (region final) | K | A crossroads, a zebra crossing and a quay you cannot reach, all at once. Tools: Road, Bridge, Footbridge, Roundabout, Traffic lights | K: certainty slowly wobbling |
| 3-1 Two Crossings to School | K | Two zebra crossings, two full stops. Tools: Footbridge, Road | K: certainty slowly wobbling |
| 3-2 The Staring Contest | K | Accidents at an unsignalled crossroads. Tools: Roundabout, Traffic lights, Guide lines, Speed camera, Speed bump | K: certainty slowly wobbling |
| 3-3 The Shortcut Paradox | K | Everyone takes the middle shortcut; try closing a perfectly good road. Tools: Road closure, Footbridge, Road | K just before quitting. Most confused |
| 3-4 Across the River to Work | Pip | Two neighbourhoods hang on one bridge and one crossing. Tools: Footbridge, Roundabout, Traffic lights, Bridge, Road | Pip: K's notes stop here |
| 3-5 Solving It Without Closing Anything | Pip | Same town, different homework: no closures this time. Tools: Footbridge, Roundabout, Traffic lights, Guide lines, Road | Pip: one dry observation |
| 3-6 The Perfect Commute (region final) | Pip | Every tool, and the purple star. Tools: Road, Widen, One-way, Guide lines, Bus lane, Reversible lane, Roundabout, Traffic lights, Bridge, Underpass, Footbridge, Speed camera, Speed bump, Road closure | Pip: one dry observation |
| 4-1 Through the Rock | Pip | Rock cannot be moved; go under it. Tools: Road, Underpass | Pip: one dry observation |
| 4-2 Gorge and Rock | Pip | Cheap and long, or expensive and short. Tools: Road, Bridge, Underpass | Pip: one dry observation |
| 4-3 Twenty-One Bends | Pip | The only road goes all the way round the mountain. Tools: Road, Underpass | Pip: one dry observation |
| 4-4 Two Hamlets and a Gorge | Pip | Bring both hamlets across the gorge to town. Tools: Road, Bridge, Underpass | Pip: one dry observation |
| 4-5 Ski Weekend | Pip | Slow lorries and a crossing on the way to the slopes. Tools: Widen, Footbridge, Road | Pip: one dry observation |
| 4-6 Opening Day (region final) | Pip | Rock, gorge, slow lorries and a crossing, all on opening day. Tools: Road, Underpass, Bridge, Footbridge, Widen | Pip: last map, review imminent |

#### Residents' letters (`story.mail`)
Arrives on a stage's first star; opened from the mailbox, it slides out on its own notepaper.
Each letter has `en` (original) and `ko` (translation), **one item = one paragraph**. The first paragraph is the greeting; a paragraph starting with `—` is the signature.
**Length: 3–6 paragraphs, 15–90 Korean chars each, 100–260 in total (≈ 30–80 English words).** Children's letters: short paragraphs (15–50), a few deliberate spelling mistakes, and a final line describing their drawing.
`hand` (handwriting), `paper` and `doodle` are already set and can be changed (options listed in the comments in `js/script.js`).
Shape: **greeting → one very specific thing that changed because the road was fixed → an odd or personal aside → signature (+ P.S.).**

| Stage | Sender and personality (the letter's context) | What got fixed there | Hand · paper · doodle |
|---|---|---|---|
| 1-1 The Broken Lane | The village head. Loves a meeting. Spends the time saved on a meeting about the time saved | Join the village to the market; the road stops halfway | pen · lined · none |
| 1-2 Over the Stream | Gran at the mill. Has sent cold rice cakes for forty years. Gruff, kind; sends a portion for the penguin | A stream cuts the road; only a bridge will do | pen · kraft · none |
| 1-3 Two Villages, One Market | Angus's mum. Worried, very polite. A sack of potatoes. P.S. about whether he's eating | Connect both the village and the farm to the market | pen · lined · potato |
| 1-4 Stuck Behind the Tractor | The tractor driver. Thirty years on that road, few words. The silence where the horns used to be | A slow tractor leads a long queue; widen the road so others can pass | casual · grid · none |
| 1-5 The Long Way Round | The soup shop by the market. Trade has doubled; a vote on naming the shortcut after the Manager; a voucher enclosed | The market is next door but the road goes all the way round | pen · kraft · coupon |
| 1-6 Market Day (region final) | Market committee (official notice). Market Day went ahead, plus the admission they thought the department had closed | Broken road, a stream and slow tractors, all at once | type · official · seal |
| 2-1 Road to the Quay | Warehouse keeper. Home before dark for the first time in years; getting reacquainted with his family | Warehouse to quay, across the canal | pen · lined · none |
| 2-2 Crossing at the Terminal | Ferry ticket clerk. Shouted at far less. Has counted. A seagull is involved | Cars queue at a zebra crossing; send the people over the top | pen · grid · none |
| 2-3 One Bridge for the Whole Harbour | Lorry driver. Now suffers the luxury of choosing a bridge | Everyone funnels onto the only bridge | casual · plain · none |
| 2-4 Container Maze | Crane operator. Sees the road from forty metres up; nobody ever asks his opinion | Thread a road between immovable containers to two quays | pen · lined · none |
| 2-5 Fish Market Crossroads | Fishmongers' association. Fish no longer spoils at the crossroads; a crate of mackerel addressed to the penguin | An unsignalled crossroads where everyone politely gives way and nobody moves | pen · kraft · fish |
| 2-6 Sailing Time (region final) | Harbour master (official). Every sailing on time — with an honest footnote about how short the records are | A crossroads, a zebra crossing and a quay you cannot reach, all at once | type · official · seal |
| 3-1 Two Crossings to School | A primary-school kid (child letter). The view from the footbridge; outrage that being late is now their own fault; P.S. is the penguin real. Drawing: me on the footbridge, and the bus | Two zebra crossings, two full stops | kid · crayon · kidBridge |
| 3-2 The Staring Contest | Tow-truck driver. Business is down; congratulations and resentment in equal measure | Accidents at an unsignalled crossroads | casual · plain · none |
| 3-3 The Shortcut Paradox | A suspicious citizen (typed). Doesn't believe closing a road made it faster. Arrived early anyway | Everyone takes the middle shortcut; try closing a perfectly good road | type · plain · none |
| 3-4 Across the River to Work | Office worker. A coffee drunk sitting down; would like to exaggerate how much that changed their life. Coffee ring | Two neighbourhoods hang on one bridge and one crossing | pen · lined · coffee |
| 3-5 Solving It Without Closing Anything | The man with the whistle who used to direct traffic. Redundant; still turns up to watch the roundabout | Same town, different homework: no closures this time | pen · lined · none |
| 3-6 The Perfect Commute (region final) | Mayor's office (official). The Mayor didn't know the department still existed. Meant warmly | Every tool, and the purple star | type · official · seal |
| 4-1 Through the Rock | Hilltop pharmacy. The hospital is closer. Simple thanks — the one letter with no joke | Rock cannot be moved; go under it | pen · plain · none |
| 4-2 Gorge and Rock | Bus driver. Stops on the gorge bridge so passengers can take photos. Against the timetable | Cheap and long, or expensive and short | casual · grid · none |
| 4-3 Twenty-One Bends | Someone from the upper village. Marrying someone from the lower village now the tunnel brought them closer; you are invited | The only road goes all the way round the mountain | pen · lined · heart |
| 4-4 Two Hamlets and a Gorge | Class 1 at the mountain school, all seven of them (child letter). The library van comes faster; shock that books have to go back. Drawing: penguin, moose, book van | Bring both hamlets across the gorge to town | kid · crayon · kidClass |
| 4-5 Ski Weekend | Ski-resort manager. The lift queue is now longer than the road queue; two lift passes (the penguin may not need the lift down) | Slow lorries and a crossing on the way to the slopes | pen · plain · tickets |
| 4-6 Opening Day (region final) | K. His last letter. He put in eleven roads; you took one away. Lives by the sea now, on a road with one destination | Rock, gorge, slow lorries and a crossing, all on opening day | pen · postcard · none |

#### Ending notice (`story.ending`) — all twenty-four starred
#### `ending.form / ending.title`
- **Where** — Small print at the top / big heading
- **Who** — Paperwork (council audit office)
- **Job** — The departmental review verdict. Heading: the verdict in a word or two.
- **Length** — form 14–26 Korean chars (≈ 4–8 English words) / title 4–8 Korean chars (≈ 1–2 English words)

#### `ending.body`
- **Where** — Body text (line breaks with `<br>`)
- **Who** — Paperwork
- **Job** — The department continues, budget frozen (good news, locally), Manager retained, Pip not transferred to Parking Enforcement — a happy ending told entirely in council prose.
- **Length** — 40–70 Korean chars (≈ 12–21 English words)

#### `ending.rows[0~2]`
- **Where** — Row labels in the verdict table (the game fills in the numbers): stars earned / letters received / total journey time saved
- **Who** — Paperwork
- **Job** — —
- **Length** — 4–20 Korean chars (≈ 1–6 English words) each

#### `ending.perfect / ending.more`
- **Where** — Small print under the table — all stars earned / some still missing
- **Who** — Paperwork
- **Job** — perfect: the audit office doesn't believe it / more: there's another review next year (a reason to go back).
- **Length** — 30–50 Korean chars (≈ 9–15 English words)

#### `ending.thanks`
- **Where** — Final bold line
- **Who** — The developers (the only voice outside the paperwork)
- **Job** — A direct thank-you to the player for seeing it through.
- **Length** — 10–20 Korean chars (≈ 3–6 English words)

#### `ending.stamp1 / stamp2 / button`
- **Where** — Green stamp, yellow button
- **Who** — —
- **Job** — Stamp: the verdict in one word / button: keep working.
- **Length** — stamp 2–3 Korean chars (≈ 1–1 English words) / button 4–7 Korean chars (≈ 1–2 English words)

#### `ending.share / ending.shared`
- **Where** — Share button on the result card / the text it briefly changes to
- **Who** — Button
- **Job** — Share / copied — go and show off.
- **Length** — 3–6 Korean chars (≈ 1–2 English words) / 12–22 Korean chars (≈ 4–7 English words)

#### `mailTitle / mailNew / mailOpen / mailLocked / memoBy.k / memoBy.pip`
- **Where** — Mailbox heading / "letter arrived" on the result card / open / an envelope not yet received / the two note headings
- **Who** — UI
- **Job** — —
- **Length** — 3–12 Korean chars (≈ 1–4 English words) each

### 3-7. Pip's lectures (`topics`) — tools and markers
Shown when the player taps "Ask Pip" in a tool popup or picks a topic from the `?` list. A board with a moving example picture on top, Pip's bubble underneath. **One line = one picture, 40–90 Korean chars (≈ 12–27 English words) each — three lines of bubble.**
Most follow **picture 1: the problem → picture 2: after using the tool**. Don't narrate what the picture already shows; say why it happens, and add Pip's aside. Dropping a `{t:tool}` picture in once instead of the tool's name is nice.
**The number of lines must match the number of pictures.**

#### `topics.road` — Road (3 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | A road broken by empty land; cars stopped. Board note: "broken road" | Introduce the tool. It is so basic that explaining it is slightly embarrassing |
| 2 | Road joined; cars go through. Note: "connected!" | Where it can go (open land) and where it can't (houses, buildings) |
| 3 | More cars piling into a crossroads. Note: "more road = more cars" | Warning: new roads bring new traffic. Ties to the theme of the whole game |

#### `topics.wide` — Widen (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | One lane; a queue behind a slow learner. Note: "one slow car" | On one lane, the car at the front sets everyone's speed |
| 2 | Two lanes; faster cars overtake. Note: "overtaking possible" | Lay two or more tiles for two lanes. Fast cars and slow cars both find peace |

#### `topics.oneway` — One-way (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | One direction, two lanes. Note: "one way, two lanes" | Traffic goes one way only, but in two lanes. Each tap turns the arrow |
| 2 | A car coming the other way is stuck. Note: "no wrong-way driving" | Oncoming traffic has to go round. Their complaints are Pip's problem |

#### `topics.demolish` — Demolish (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | The ghost of a removed road. Note: "there was a road here" | Anything you built comes back for a full refund; original roads cost money to remove |
| 2 | Red-bordered locked road. Note: "locked roads cannot be demolished" | Locked roads stay. Reasons: the council's |

#### `topics.guide` — Guide lines (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | A learner car with ? before a fork. Note: "which way was it…" | Hesitating learners at a fork stop everyone behind them |
| 2 | Pink and green lines on the road; the learner sails through. Note: "follow the colour" | Pink = left, green = right. Learners can at least read colours |

#### `topics.bus` — Bus lane (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | A bus trapped among cars. Note: "20 people stuck" | One bus = 20 people. Average journey time counts people, not vehicles |
| 2 | A road only buses use. Note: "buses only" | Paint it along a one-lane road and it becomes a bus lane. Cars go round, which is the point |

#### `topics.rev` — Reversible lane (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Morning: the middle lane points to the office. Note: "morning: middle → office" | The middle lane flips to whichever direction is busy |
| 2 | Evening: the middle lane points home. Note: "evening: middle → home" | Needs two or more tiles; can't share a road with one-way or widening |

#### `topics.round` — Roundabout (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Unsignalled crossroads, cars stopped on all sides. Note: "staring contest" | The staring contest at an unsignalled junction, and the crashes that follow |
| 2 | Cars circling and peeling off a roundabout. Note: "it never stops, it goes round" | Nobody stops; fewer collision points. One remark about the British |

#### `topics.signal` — Traffic lights (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | One direction moving, the other waiting. Note: "turns are assigned" | Turns are assigned: no staring, no dithering. Just waiting. Fair waiting |
| 2 | Now the other side waits. Note: "one side always stops" | Somebody always stops. Only works where three or more roads meet |

#### `topics.bridge` — Bridge (3 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Road ends at the river; cars stopped. Note: "cars can't swim" | You can't lay road on water |
| 2 | Cars crossing a bridge. Note: "across by bridge" | Put a bridge on the water tile. Each tap turns it; the third tap refunds it |
| 3 | A bridge passing over another road. Note: "they pass without meeting" | On top of a road it becomes a flyover. The junction disappears |

#### `topics.tunnel` — Underpass (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Road ends at a park. Note: "parks cannot be flattened" | Parks and rock cannot be moved. The park is where Pip eats lunch (alone) |
| 2 | Cars passing under the park. Note: "goes underneath" | Expensive, but everything on top stays where it is |

#### `topics.overpass` — Footbridge (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Cars queued at a zebra crossing. Note: "8 seconds in every 12 are for walkers" | At a crossing, cars wait while people walk. Where the jam starts |
| 2 | People over the footbridge, cars below keep moving. Note: "people up, cars down" | Put it on a crossing and cars don't stop. The stairs are hard work for a penguin |

#### `topics.camera` — Speed camera (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | A red speeder tailgating. Note: "speeding → hard braking → crash" | Meet the speeders: the gap to the car in front is, to them, more of a suggestion |
| 2 | Speeders inside the circle calm down. Note: "well-behaved inside the circle" | Only speeders nearby slow down; everyone else is unaffected |

#### `topics.bump` — Speed bump (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Every car slows. Note: "everyone slows down" | Cheap, but every vehicle slows — the bus too |
| 2 | Bump just before an accident-prone junction. Note: "only before trouble spots" | Use it only where slowing down actually helps |

#### `topics.barricade` — Road closure (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Everyone pours through the middle shortcut. Note: "everyone takes the shortcut" | If there's a shortcut, everyone takes it, so it stops being a shortcut |
| 2 | Shortcut closed; traffic splits over two roads. Note: "split, and it flows" | Closes a road without destroying it, even a locked one. The paradox: closing a road speeds things up |

#### `topics.marks` — Markers over cars (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | ? · ! · ··· bubbles over cars; red roads | Reading the markers: hesitating / hard braking / stuck for ages; redder roads are worse. Include `{q}` `{bang}` `{stuck}` |
| 2 | Cars of different colours. Note: "blue normal · red speeder · yellow learner · green bus" | Reading driver types by colour + tap a car to see where it's going |

#### `topics.stars` — Stars and goals (2 lines)
| Line | Board picture | What this line has to do |
|---|---|---|
| 1 | Poster listing the four star goals | Stars come in order; miss one and the later ones don't count (a joke about bureaucracy) |
| 2 | Poster on budget, refunds and forecasts | The size of the budget (the place for a joke comparing it with Pip's salary); tap with the same tool again for a full refund |

---

## 4. Afterwards

1. Put each line into `js/script.js` under the same key (inside the quotes only). Write an apostrophe inside a line as `\'`.
2. Refresh the browser and it's live. The tutorial can be replayed from "watch the tutorial again" on the title card. Story scenes and letters only play once (letters can be reopened from the mailbox); to see a scene again, clear the site data in your browser.
3. Over the length limit, a phone bubble runs past three lines. Nothing breaks, but the text may disappear behind a penguin.
