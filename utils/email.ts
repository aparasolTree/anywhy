import IsEmail from "npm:isemail";
import { getUserFromEmail, User } from "./kv/user.kv.ts";
import { getEnvVar } from "./common.ts";
import { formatDate } from "./formatDate.ts";
import { getVerifyLink } from "./verifyLink.ts";
import { ANYWHY_EMAIL_LIMITS_EXPIREIN, ANYWHY_KV_EMAIL_LIMITS_DAY, ANYWHY_KV_EMAIL_LIMITS_KEY } from "./constant.ts";
import { getValue, kv } from "./kv/index.ts";

export const isEmail = (email: string) => IsEmail.validate(email);
export async function sendToken(
    { domain, email }: { email: string; domain: string },
) {
    const verifyLink = await getVerifyLink({ domain, email });
    const user = await getUserFromEmail(email);
    await sendVerifyEmail({
        verifyLink,
        user,
        email,
        domain,
    });
    return verifyLink;
}

const MJ_APIKEY_PUBLIC = getEnvVar("MJ_APIKEY_PUBLIC");
const MJ_APIKEY_PRIVATE = getEnvVar("MJ_APIKEY_PRIVATE");
async function sendVerifyEmail(
    { verifyLink, domain, email, user }: {
        verifyLink: string;
        user: User | null;
        email: string;
        domain: string;
    },
) {
    const obj = { verifyLink, domain, state: user ? "登录" : "创建账号" };
    const path = new URL("../templates/verify.html", import.meta.url);
    const html = await Deno.readTextFile(path);

    await fetch("https://api.mailjet.com/v3/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`)}`,
        },
        body: JSON.stringify({
            FromEmail: "anywhy@xulealive.cn",
            FromName: "",
            Subject: `[Anywhy] 验证邮件🎆 - ${formatDate(new Date(), "YYYY/MM/DD HH:mm")}`,
            "Text-part": "亲爱的用户, 欢迎来到 xulealive.cn! 愿幸运伴你一生!",
            "Html-part": html.replaceAll(
                /{{\w+}}/g,
                (substring) => obj[substring.slice(2, -2) as keyof typeof obj],
            ),
            Recipients: [{ Email: email }],
        }),
    })
        .then((response) => response.json())
        .catch((error) => console.error("Error:", error));
    await setEmailLimitesCount();
}

export async function getMessageSentCount() {
    const url = new URL("https://api.mailjet.com/v3/REST/statcounters");
    url.searchParams.append("CounterSource", "APIKey");
    url.searchParams.append("CounterTiming", "Message");
    url.searchParams.append("CounterResolution", "Lifetime");
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Basic ${btoa(`${MJ_APIKEY_PUBLIC}:${MJ_APIKEY_PRIVATE}`)}`,
            },
        });
        const data = await response.json();
        return (data as {
            Data: [{
                MessageSentCount: number;
            }];
        }).Data[0]?.MessageSentCount || 0;
    } catch (error) {
        console.log(error);
        return 0;
    }
}

export async function getEmailLimitesCount() {
    const EmailLimitsKey = [ANYWHY_KV_EMAIL_LIMITS_KEY, ANYWHY_KV_EMAIL_LIMITS_DAY, (new Date()).getDate()];
    return (await getValue<Deno.KvU64>(EmailLimitsKey))
        ?.value || 0n;
}

export async function setEmailLimitesCount() {
    const EmailLimitsKey = [ANYWHY_KV_EMAIL_LIMITS_KEY, ANYWHY_KV_EMAIL_LIMITS_DAY, (new Date()).getDate()];
    const count = (await getValue<Deno.KvU64>(EmailLimitsKey))?.value || 0n;
    const atomic = kv.atomic();
    if (!count) {
        atomic.set(EmailLimitsKey, new Deno.KvU64(0n), {
            expireIn: ANYWHY_EMAIL_LIMITS_EXPIREIN,
        });
    }
    await atomic.sum(EmailLimitsKey, 1n).commit();
}
