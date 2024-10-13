import { VERIFY_CERTIFICATE_EXPIRES } from "./constant.ts";
import { VERIFY_PARAMS_KEY } from "./constant.ts";
import { getLoginInfoSession } from "./login.session.ts";
import { decrypt, encrypt } from "./cropty.ts";
import { HttpError } from "fresh";

export type VerifyCertificate = {
    createAt: number;
    domain: string;
    email: string;
};

export async function getVerifyLink(
    { domain, email }: { email: string; domain: string },
) {
    const verifyCertificate: VerifyCertificate = {
        createAt: Date.now(),
        domain,
        email,
    };

    const encoded = btoa(JSON.stringify(verifyCertificate));
    const signValue = await encrypt(encoded);

    const url = new URL(domain);
    url.pathname = "/verify";
    url.searchParams.set(VERIFY_PARAMS_KEY, signValue);
    return url.toString();
}

function getVerifyLinkFromURL(url: string) {
    try {
        const verifyLink = new URL(url).searchParams.get(VERIFY_PARAMS_KEY);
        return verifyLink ?? "";
    } catch {
        return "";
    }
}

export async function getVerifyCertificateFromRequest(request: Request) {
    const { getVerifyLink } = await getLoginInfoSession(request);

    const encryptVerifyInfo = getVerifyLinkFromURL(request.url);
    const verifyLink = getVerifyLink();
    const sessionVerifyInfo = verifyLink ? getVerifyLinkFromURL(verifyLink) : null;

    if (!encryptVerifyInfo) throw new HttpError(400, "会话验证链接未提供。");
    if (sessionVerifyInfo !== encryptVerifyInfo) {
        throw new HttpError(400, "处于安全考虑，您必须在同一浏览器上打开链接");
    }

    let verifyCertificate: VerifyCertificate;
    try {
        const value = await decrypt(encryptVerifyInfo);
        verifyCertificate = JSON.parse(atob(value)) as VerifyCertificate;
    } catch (error) {
        console.log(error);
        throw new HttpError(400, "验证链接无效，请重新请求。");
    }

    const { createAt } = verifyCertificate;
    if (createAt + VERIFY_CERTIFICATE_EXPIRES < Date.now()) {
        throw new HttpError(400, "验证链接过期，请重新请求。");
    }
    return verifyCertificate as VerifyCertificate;
}
