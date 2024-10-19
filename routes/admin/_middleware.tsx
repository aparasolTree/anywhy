import { define } from "../../utils/define.ts";
import { requiredAdmin } from "../../utils/user.session.ts";

export const handler = define.middleware(async ({ next, req }) => {
    await requiredAdmin(req);
    return next();
});
