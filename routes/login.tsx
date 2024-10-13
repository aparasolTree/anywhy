import { page } from "fresh";
import { asset } from "fresh/runtime";
import { getUserSession } from "../utils/user.session.ts";
import { redirect } from "../utils/response.ts";
import { Bread } from "../components/Icons/Bread.tsx";
import { getLoginInfoSession } from "../utils/login.session.ts";
import { getEmailLimitesCount, isEmail, sendToken } from "../utils/email.ts";
import { getDomain, getErrorMessage } from "../utils/common.ts";
import { define } from "../utils/define.ts";
import { LoginForm } from "../components/LoginForm.tsx";
import { formDataVerify } from "../utils/formDataVerify.ts";
import { ANYWHY_EMAIL_LIMITS_COUNT_DAY } from "../utils/constant.ts";

export const handler = define.handlers({
    async GET({ req }) {
        const userSession = await getUserSession(req);
        const loginInfoSession = await getLoginInfoSession(req);
        const user = await userSession.getUser();

        const error = loginInfoSession.getError();
        const email = loginInfoSession.getEmail();

        const headers = new Headers();
        await loginInfoSession.getHeaders(headers);
        await userSession.getHeaders(headers);

        if (user) return redirect("/", { headers });
        return page({ error, email }, {
            headers,
        });
    },
    async POST({ req }) {
        const loginSession = await getLoginInfoSession(req);
        if (await getEmailLimitesCount() > ANYWHY_EMAIL_LIMITS_COUNT_DAY) {
            loginSession.setError("当天邮件的发送数量已达上限。明天再来吧。");
            return redirect("/login", {
                headers: await loginSession.getHeaders(),
            });
        }
        if (loginSession.getVerifyLink()) {
            loginSession.setError("验证邮箱已发送，五分钟后重试");
            return redirect("/login", {
                headers: await loginSession.getHeaders(),
            });
        }

        const [error, { email }] = formDataVerify(await req.formData(), {
            email: {
                type: "String",
                required: true,
                custom: (_, val) => !isEmail(val) ? "上传的邮箱地址格式错误" : "",
            },
        });

        if (error) {
            loginSession.setError(error);
            return redirect("/login", {
                headers: await loginSession.getHeaders(),
            });
        }

        loginSession.setEmail(email);

        try {
            const domain = getDomain(req);
            const verifyLink = await sendToken({ email, domain });
            loginSession.setVerifyLink(verifyLink);
        } catch (error) {
            loginSession.setError(getErrorMessage(error));
        }

        return redirect("/login", {
            headers: await loginSession.getHeaders(),
        });
    },
});

export default define.page<typeof handler>(function Login({ data }) {
    const { error, email } = data;
    return (
        <div
            class="h-screen relative bg-opacity-65"
            style={{ backgroundImage: `url(${asset("/bg.jpg")})` }}
        >
            {error && (
                <div class="absolute top-0 right-0 left-0 bg-red-500 text-white rounded-br-md rounded-bl-md py-2 pl-3">
                    {error}
                </div>
            )}
            <div class="h-full bg-slate-400 bg-opacity-35 flex items-center justify-center">
                <div class="backdrop-filter backdrop-blur-[8px] bg-black bg-opacity-10 px-6 py-5 rounded-lg shadow-lg">
                    <div class="text-[50px] flex justify-center">
                        <Bread />
                    </div>
                    <LoginForm email={email} />
                </div>
            </div>
        </div>
    );
});
