import { uuid } from "../utils/cropty.ts";
import { kv } from "../utils/kv/index.ts";
import { User } from "../utils/kv/user.kv.ts";
import {
    ANYWHY_KV_FAKE_USER_KEY_NUM,
    ANYWHY_KV_KEY,
    ANYWHY_KV_USER_ID_KEY,
    ANYWHY_KV_USER_KEY,
    ANYWHY_KV_USER_TOTAL,
} from "../utils/constant.ts";

function createUserFakeData(): User {
    return {
        id: uuid(),
        createAt: Date.now(),
        email: "12313123213@asd.com",
        role: "user",
        username: "asdadw",
        blacklist: false,
    };
}

export async function createUsersFakeData() {
    const atomicOperation = kv.atomic();
    atomicOperation.sum(
        [ANYWHY_KV_KEY, ANYWHY_KV_USER_TOTAL],
        BigInt(ANYWHY_KV_FAKE_USER_KEY_NUM),
    );
    for (let i = 0; i < ANYWHY_KV_FAKE_USER_KEY_NUM; i++) {
        const fakeUser = createUserFakeData();
        atomicOperation.set(
            [
                ANYWHY_KV_KEY,
                ANYWHY_KV_USER_KEY,
                ANYWHY_KV_USER_ID_KEY,
                fakeUser.id,
            ],
            fakeUser,
        );
    }

    await atomicOperation.commit();
}

await createUsersFakeData();
