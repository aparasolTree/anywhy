export interface LoginFormProps {
    email?: string;
}

export function LoginForm({ email }: LoginFormProps) {
    return (
        <form action="/login" method="post" class="mt-6 w-[360px]">
            <div class="mb-2 text-end">
                <button
                    type="reset"
                    class="text-white mr-2 hover:text-red-500"
                >
                    重置
                </button>
            </div>
            <fieldset class="flex-1 flex gap-3 rounded-full px-4 py-2 bg-white bg-opacity-30">
                <label htmlFor="email">📫</label>
                <input
                    required
                    id="email"
                    type="text"
                    name="email"
                    autoComplete="off"
                    defaultValue={email}
                    placeholder="输入邮箱验证"
                    class="flex-1 bg-transparent focus:outline-none placeholder:text-white"
                />
            </fieldset>
            <button
                type="submit"
                class="bg-green-600 text-white px-4 py-2 mt-4 w-full rounded-full"
            >
                发送登录验证链接
            </button>
        </form>
    );
}
