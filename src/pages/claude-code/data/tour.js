// Guided tour — a narrated fly-through. Each step focuses a body, shows a
// caption, and dwells for `dwell` real-time seconds before advancing. The
// engine drives stepping off the render clock so the tour respects pause.

export const TOUR = [
  {
    id: "sun",
    title: "The Sun",
    caption:
      "We begin at the heart of it all — a star holding 99.9% of the system's mass, the gravitational anchor for everything that follows.",
    dwell: 8,
  },
  {
    id: "mercury",
    title: "Mercury",
    caption: "The swift innermost world: scorched, airless, and cratered, completing a lap of the Sun every 88 days.",
    dwell: 7,
  },
  {
    id: "venus",
    title: "Venus",
    caption: "Shrouded in toxic cloud. A runaway greenhouse makes it the hottest planet — and it spins backwards.",
    dwell: 7,
  },
  {
    id: "earth",
    title: "Earth",
    caption: "Our pale blue dot — the one world we know cradles life, sitting comfortably within the Sun's habitable zone.",
    dwell: 8,
  },
  {
    id: "mars",
    title: "Mars",
    caption: "The Red Planet: home to the tallest volcano and the deepest canyon, with ice locked at its poles.",
    dwell: 7,
  },
  {
    id: "jupiter",
    title: "Jupiter",
    caption: "The colossus. Banded storms swirl across a world that could hold 1,300 Earths, ringed by its Galilean moons.",
    dwell: 8,
  },
  {
    id: "saturn",
    title: "Saturn",
    caption: "Crowned by its dazzling rings of ice — vast yet wafer-thin — escorted by the haze-wrapped moon Titan.",
    dwell: 8,
  },
  {
    id: "uranus",
    title: "Uranus",
    caption: "The tilted ice giant, rolling on its side through an 84-year orbit with decades-long polar seasons.",
    dwell: 7,
  },
  {
    id: "neptune",
    title: "Neptune",
    caption: "The windiest world, found by mathematics before it was ever seen — a deep blue giant on the frontier.",
    dwell: 7,
  },
  {
    id: "pluto",
    title: "Pluto",
    caption: "Out in the Kuiper Belt: a tilted, eccentric dwarf planet with a heart of frozen nitrogen.",
    dwell: 7,
  },
  {
    id: "__system__",
    title: "The Solar System",
    caption: "Eight planets, a dwarf, moons, a belt, and a wandering comet — all bound to a single ordinary star. The tour is complete.",
    dwell: 8,
  },
];
