import { define } from "../utils/define.ts";

export default define.page(function ErrorRoute({ error }) {
    return <div>{JSON.stringify(error)}</div>;
});
