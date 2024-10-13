export const redirect = (location: string, init?: ResponseInit) => {
    const headers = init?.headers || new Headers();

    if (headers instanceof Headers) {
        headers.set("Location", location);
    } else if (Array.isArray(headers)) {
        headers.push(["Location", location]);
    } else headers["Location"] = location;

    return new Response("", { ...init, status: 303, headers });
};

export const badRequest = (message?: string, init?: ResponseInit) => new Response(message, { ...init, status: 400 });

export const json = (data: unknown, init: ResponseInit = {}) => {
    const headers = init?.headers || new Headers();

    if (headers instanceof Headers) {
        headers.set("Content-Type", "application/json");
    } else if (Array.isArray(headers)) {
        headers.push(["Content-Type", "application/json"]);
    } else headers["Content-Type"] = "application/json";

    return new Response(JSON.stringify(data), {
        ...init,
        headers,
        status: 200,
    });
};
