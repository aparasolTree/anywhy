import { redirect } from "../utils/response.ts";
import { createUser, createUserEntry, getUserFromEmail } from "../utils/kv/user.kv.ts";
import { getUserSession } from "../utils/user.session.ts";
import { getVerifyCertificateFromRequest } from "../utils/verifyLink.ts";
import { getLoginInfoSession } from "../utils/login.session.ts";
import { define } from "../utils/define.ts";

export const handler = define.handlers({
    async GET({ req }) {
        const loginInfoSession = await getLoginInfoSession(req);
        const VerifyCertificate = await getVerifyCertificateFromRequest(req);
        const email = VerifyCertificate.email;
        const userSession = await getUserSession(req);
        let user = await getUserFromEmail(email);
        if (!user) {
            user = createUserEntry(email, email);
            await createUser(user);
        }
        if (await userSession.getUser()) {
            loginInfoSession.setError("当前用户以登录。");
        }

        await userSession.signIn(user.id);

        const headers = new Headers();
        await userSession.getHeaders(headers);
        await loginInfoSession.getHeaders(headers);

        return redirect("/", {
            headers,
        });
    },
});
