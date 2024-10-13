import { App, fsRoutes, staticFiles, trailingSlashes } from "fresh";
import { type State } from "./utils/define.ts";
import { createAdmin } from "./utils/kv/index.ts";

import "@std/dotenv/load";

export const app = new App<State>();
app.use(staticFiles())
    .use(trailingSlashes("never"));

await createAdmin();

await fsRoutes(app, {
    loadIsland: (path) => import(`./islands/${path}`),
    loadRoute: (path) => import(`./routes/${path}`),
});

if (import.meta.main) {
    await app.listen();
}
