# GeoFinder

A free, self-hosted GeoGuessr-style game. You get dropped into a random Google
Street View panorama somewhere on Earth and have to guess where you are by
clicking on a world map. Five rounds, up to 5,000 points each.

## Setup

1. **Install dependencies**

   ```bash
   yarn        # or: npm install
   ```

2. **Get a Google Maps API key**

   In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and enable **Maps JavaScript API**. Create an API key and (strongly
   recommended) restrict it to your domain / `localhost`.

3. **Configure environment**

   Copy `.env.example` to `.env` and fill in:

   ```env
   LOGIN_PASSWORD=somepassword
   GOOGLE_MAPS_API_KEY=AIza...
   SESSION_SECRET=any-long-random-string
   PORT=3000
   ```

4. **Run**

   ```bash
   yarn start   # production
   yarn dev     # auto-reload with nodemon (install nodemon globally first)
   ```

   Open <http://localhost:3000>, enter `LOGIN_PASSWORD`, and play.

## How it works

- `server.js` is an Express app. The whole site (and the API key handoff
  endpoint `/maps.js`) is gated behind a session cookie set after a correct
  password POST to `/login`.
- The Google Maps script is loaded from the client with the key injected at
  request time by `/maps.js`, so the key is not embedded in static HTML and
  only reachable to logged-in users.
- Random locations are picked by sampling weighted lat/lng bounding boxes and
  asking the Street View Service for the nearest outdoor panorama within
  50 km, retrying until one is found.
- Scoring: `5000 * exp(-km / 2000)` - full points at 0 km, ~1,800 at 2,000 km,
  near zero at the other side of the world.

## License

GeoFinder is free software released under the
[GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html)
(AGPL-3.0). See the [`LICENSE`](./LICENSE) file for the full text.

In short: you are free to use, modify, and redistribute this software, but if
you run a modified version on a network server (for example, hosting your own
GeoFinder), you must make the corresponding source code of your modified
version available to its users under the same license.
