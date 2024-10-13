import { Bread } from "./Icons/Bread.tsx";
import { DropDown, DropDownContent } from "./DropDown.tsx";
import { User } from "../utils/kv/user.kv.ts";

export interface HeaderProps {
    active: string;
    user: User;
    className?: string;
}

export function Header({ active, user, className }: HeaderProps) {
    const isHomePage = active === "/";
    return (
        <header
            class={[
                "flex items-center justify-between",
                "sticky top-0 right-0 left-0",
                "h-16 px-6 py-3 z-40 w-full",
                className,
            ].join(" ")}
        >
            {!isHomePage &&
                (
                    <a class="text-[40px]" href="/">
                        <Bread />
                    </a>
                )}
            <div class="flex flex-1 justify-end items-center gap-4">
                <NavBar active={active} />
                <LoginInfo user={user} active={active} />
            </div>
        </header>
    );
}

const navs = [
    { title: "图片", url: "/image", icon: "🥱", activeIcon: "😜" },
    { title: "博客", url: "/blog", icon: "🤐", activeIcon: "😉" },
];
export interface NavBarProps {
    active: string;
}
export function NavBar({ active }: NavBarProps) {
    return (
        <nav class="flex gap-2 items-center bg-white rounded-md shadow-md px-2 py-1">
            {navs.map(({ title, url, icon, activeIcon }, index) => {
                const isActive = active.includes(url);
                return (
                    <>
                        <a
                            href={url}
                            title={title}
                            class={["px-2", isActive ? "font-bold" : ""]
                                .join(" ")}
                        >
                            {title} {isActive ? activeIcon : icon}
                        </a>
                        {index !== navs.length - 1 &&
                            <div class="h-[16px] border-[1px] rounded-md border-gray-200" />}
                    </>
                );
            })}
        </nav>
    );
}

export interface LoginInfoProps {
    user: User;
    active: string;
}
export function LoginInfo({ user, active }: LoginInfoProps) {
    const isLogin = !!user?.id;
    return (
        <>
            {isLogin ? <UserInfo user={user} active={active} /> : (
                <a
                    href="/login"
                    class="rounded-md px-3 py-1 bg-white text-green-500 shadow-md"
                >
                    ( •̀ .̫ •́ )✧ 登录
                </a>
            )}
        </>
    );
}

export interface UserProps {
    user: User;
    active: string;
}

export function UserInfo({ user, active }: UserProps) {
    return (
        <DropDown>
            <div class="flex items-center bg-white shadow-md rounded-md px-3 py-1">
                <span class="mr-3 font-bold text-green-600">
                    (｡･∀･)ﾉﾞ嗨
                </span>
                <i class="underline text-slate-400">
                    {user.username}
                </i>
            </div>
            <DropDownContent>
                <form action={`/logout`} method="post">
                    <input type="hidden" name="action" value="logout" />
                    <button type="submit" class="hover:text-red-500">
                        退出登录
                    </button>
                </form>
            </DropDownContent>
        </DropDown>
    );
}
