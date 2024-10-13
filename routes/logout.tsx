import { define } from "../utils/define.ts";
import { formDataVerify } from "../utils/formDataVerify.ts";
import { getLoginInfoSession } from "../utils/login.session.ts";
import { badRequest, redirect } from "../utils/response.ts";
import { getUserSession } from "../utils/user.session.ts";

export const handler = define.handlers({
    async POST({ req }) {
        const userSession = await getUserSession(req);
        const loginInfoSession = await getLoginInfoSession(req);
        const user = await userSession.getUser();
        if (!user) {
            loginInfoSession.setError("用户并不存在，请注册。");
            return redirect("/login", {
                headers: await loginInfoSession.getHeaders(),
            });
        }

        const [error] = formDataVerify(await req.formData(), {
            action: {
                type: "String",
                required: true,
                custom: (_, val) => val !== "logout" ? "表单提交字段action错误" : "",
            },
        });
        if (error) return badRequest(error);

        userSession.clean();
        loginInfoSession.clean();
        const headers = new Headers();
        headers.append("Set-Cookie", await userSession.destory());
        headers.append("Set-Cookie", await loginInfoSession.destory());
        return redirect("/", {
            headers,
        });
    },
});
